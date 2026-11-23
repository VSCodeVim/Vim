import * as fs from 'fs';
import * as path from 'path';

import { runTests } from '@vscode/test-electron';

/**
 * User settings for the VS Code that runs the tests. Each turns off background work that slows the
 * tests down; together they make them about a quarter faster. `index.ts` sets `files.eol` too.
 */
const testSettings = {
  'chat.disableAIFeatures': true,
  'telemetry.telemetryLevel': 'off',
};

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

    // Write the settings before VS Code starts, since some of them only take effect at startup.
    // This replaces the settings of earlier runs, so none of them carry over.
    const userDataDir = path.resolve(__dirname, '..', '.vscode-test', 'user-data');
    fs.mkdirSync(path.join(userDataDir, 'User'), { recursive: true });
    fs.writeFileSync(
      path.join(userDataDir, 'User', 'settings.json'),
      JSON.stringify(testSettings, null, 2),
    );

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        // Disable other extensions while running tests for avoiding unexpected side-effect
        '--disable-extensions',
        `--user-data-dir=${userDataDir}`,
      ],
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exit(1);
  }
}

void main();
