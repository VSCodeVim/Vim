// @ts-check

import * as esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Fails the build if modules in src/ import each other in a cycle. Dynamic `import()`s are allowed
 * to form cycles, since they don't run until after every module has loaded.
 * @type {esbuild.Plugin}
 */
const noCircularImports = {
  name: 'no-circular-imports',
  setup(build) {
    build.onEnd((result) => {
      if (!result.metafile) {
        return;
      }

      /** @type {Map<string, string[]>} */
      const graph = new Map();
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

      /** @type {Map<string, 'visiting' | 'done'>} */
      const state = new Map();
      /** @type {string[]} */
      const stack = [];
      /** @type {esbuild.PartialMessage[]} */
      const errors = [];
      /** @param {string} file */
      const visit = (file) => {
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
 * @type {esbuild.Plugin}
 */
const excludeNodeOnlyModules = {
  name: 'exclude-node-only-modules',
  setup(build) {
    build.onResolve({ filter: /\/(neovim|imswitcher|vimrc)$|child_process$/ }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

/** @type {esbuild.BuildOptions} */
const common = {
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

/** @type {esbuild.BuildOptions[]} */
const configs = [
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

if (watch) {
  for (const config of configs) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
  }
} else {
  // esbuild has already logged any errors
  await Promise.all(configs.map((config) => esbuild.build(config))).catch(() => process.exit(1));
}
