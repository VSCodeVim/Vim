// Test runner for the web extension smoke tests, which run in a browser's web extension host
// against the bundled dist/extensionWeb.js. Bundled by `node esbuild.mts --test-web`.
//
// These are separate from the main test suite (which runs under Node against the tsc build), so
// they can only drive the extension through VS Code's API, the same way a user would.
import 'mocha/mocha';

export async function run(): Promise<void> {
  mocha.setup({ ui: 'tdd', reporter: 'spec', timeout: 10000 });

  await import('./smoke');

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}
