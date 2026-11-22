import * as esbuild from 'esbuild';
import { globSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const test = process.argv.includes('--test');
const testWeb = process.argv.includes('--test-web');

/**
 * Fails the build if modules in src/ import each other in a cycle. Dynamic `import()`s are allowed
 * to form cycles, since they don't run until after every module has loaded.
 */
const noCircularImports: esbuild.Plugin = {
  name: 'no-circular-imports',
  setup(build) {
    build.onEnd((result) => {
      if (!result.metafile) {
        return;
      }

      const graph = new Map<string, string[]>();
      for (const [file, { imports }] of Object.entries(result.metafile.inputs)) {
        if (file.startsWith('src/')) {
          graph.set(
            file,
            imports
              .filter((i) => i.kind !== 'dynamic-import' && i.path.startsWith('src/'))
              .map((i) => i.path),
          );
        }
      }

      const state = new Map<string, 'visiting' | 'done'>();
      const stack: string[] = [];
      const errors: esbuild.PartialMessage[] = [];
      const visit = (file: string) => {
        state.set(file, 'visiting');
        stack.push(file);
        for (const dep of graph.get(file) ?? []) {
          if (state.get(dep) === 'visiting') {
            const cycle = [...stack.slice(stack.indexOf(dep)), dep];
            errors.push({ text: `Circular dependency: ${cycle.join(' -> ')}` });
          } else if (!state.has(dep)) {
            visit(dep);
          }
        }
        stack.pop();
        state.set(file, 'done');
      };
      for (const file of graph.keys()) {
        if (!state.has(file)) {
          visit(file);
        }
      }

      return { errors };
    });
  },
};

/**
 * Leaves out modules that only work in Node.js. The web build only reaches them through `import()`
 * calls guarded by `SUPPORT_*` flags, which are false there.
 */
const excludeNodeOnlyModules: esbuild.Plugin = {
  name: 'exclude-node-only-modules',
  setup(build) {
    build.onResolve({ filter: /\/(neovim|imswitcher|vimrc)$|child_process$/ }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

const common: esbuild.BuildOptions = {
  bundle: true,
  format: 'cjs',
  target: 'es2021',
  // Created by VS Code at runtime
  external: ['vscode'],
  minify: production,
  sourcemap: !production,
  metafile: true,
  logLevel: 'info',
};

const extensionConfigs: esbuild.BuildOptions[] = [
  {
    ...common,
    entryPoints: ['extension.ts'],
    outfile: 'dist/extension.js',
    platform: 'node',
    alias: {
      platform: './src/platform/node',
    },
    plugins: [noCircularImports],
  },
  {
    ...common,
    entryPoints: ['extensionWeb.ts'],
    outfile: 'dist/extensionWeb.js',
    platform: 'browser',
    alias: {
      os: 'os-browserify/browser',
      path: 'path-browserify',
      platform: './src/platform/browser',
    },
    inject: ['./build/processShim.js'],
    plugins: [excludeNodeOnlyModules, noCircularImports],
  },
];

/**
 * Mocha's browser build is a UMD bundle, but Mocha's package.json says `"type": "module"`, so esbuild
 * inlines it unwrapped and it replaces the test bundle's `module.exports` with itself. Loading it
 * outside the file namespace (which is where package.json applies) makes esbuild wrap it as CommonJS.
 */
const mochaAsCommonJS: esbuild.Plugin = {
  name: 'mocha-as-commonjs',
  setup(build) {
    build.onResolve({ filter: /^mocha\/mocha$/ }, () => ({
      path: fileURLToPath(import.meta.resolve('mocha/mocha.js')),
      namespace: 'mocha-cjs',
    }));
    build.onLoad({ filter: /.*/, namespace: 'mocha-cjs' }, async (args) => ({
      contents: await readFile(args.path, 'utf8'),
      loader: 'js',
    }));
  },
};

/**
 * Smoke tests that `pnpm test-web` runs against dist/extensionWeb.js in a browser
 */
const testWebConfig: esbuild.BuildOptions = {
  ...common,
  entryPoints: ['test/web/index.ts'],
  outfile: 'out/test-web/index.js',
  platform: 'browser',
  minify: false,
  sourcemap: true,
  plugins: [mochaAsCommonJS],
};

/**
 * Provides the `test-files` module (see test/testFiles.d.ts), which lists every test file with a
 * function that runs it. The files are sorted, since glob v9+ doesn't sort its results and some tests
 * are sensitive to what ran before them; this is the order glob v7 found them in.
 */
const testFiles: esbuild.Plugin = {
  name: 'test-files',
  setup(build) {
    build.onResolve({ filter: /^test-files$/ }, (args) => ({
      path: args.path,
      namespace: 'test-files',
    }));
    build.onLoad({ filter: /.*/, namespace: 'test-files' }, () => {
      const files = globSync('**/*.test.ts', { cwd: 'test' })
        .map((file) => file.replaceAll('\\', '/'))
        .sort((a, b) => a.localeCompare(b, 'en'));
      const entries = files.map(
        (file) => `[${JSON.stringify(file)}, () => import(${JSON.stringify(`./test/${file}`)})]`,
      );
      return {
        contents: `export default [\n${entries.join(',\n')}\n];`,
        loader: 'js',
        resolveDir: '.',
      };
    });
  },
};

/**
 * The extension and its tests, bundled together so they share module state. VS Code loads the
 * bundle both as the extension and as the test runner; see test/index.ts.
 */
const testConfigs: esbuild.BuildOptions[] = [
  {
    ...common,
    entryPoints: ['test/index.ts'],
    outfile: 'out/test.js',
    platform: 'node',
    // Load dependencies from node_modules, as the tests always have, rather than bundling them
    packages: 'external',
    alias: {
      platform: './src/platform/node',
    },
    minify: false,
    sourcemap: true,
    plugins: [testFiles],
  },
  {
    ...common,
    entryPoints: ['test/runTest.ts'],
    outfile: 'out/runTest.js',
    platform: 'node',
    packages: 'external',
    minify: false,
    metafile: false,
  },
];

/**
 * Writes out/package.json, so that VS Code can load out/ as the extension under test, with the test
 * bundle as its `main`
 */
async function writeTestManifest() {
  const manifest = JSON.parse(await readFile('package.json', 'utf8')) as Record<string, unknown>;
  manifest.main = './test';
  delete manifest.browser;
  await mkdir('out', { recursive: true });
  await writeFile('out/package.json', JSON.stringify(manifest, null, 2) + '\n');
}

const configs = testWeb ? [testWebConfig] : test ? testConfigs : extensionConfigs;

if (test) {
  await writeTestManifest();
}

if (watch) {
  for (const config of configs) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
  }
} else {
  // esbuild has already logged any errors
  await Promise.all(configs.map((config) => esbuild.build(config))).catch(() => process.exit(1));
}
