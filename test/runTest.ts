import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    // This is out/ (where this script is built to), not the repo root, so VS Code loads the test
    // bundle as the extension rather than dist/extension.js
    const extensionDevelopmentPath = __dirname;

    // The path to the extension test runner script, which is the same bundle
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, 'test');

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // Disable other extensions while running tests for avoiding unexpected side-effect
      launchArgs: ['--disable-extensions'],
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exit(1);
  }
}

void main();
