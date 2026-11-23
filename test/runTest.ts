import * as fs from 'fs';
import * as path from 'path';

import { runTests } from '@vscode/test-electron';
import { Report } from 'c8';

/**
 * User settings for the VS Code that runs the tests. Each turns off background work that slows the
 * tests down; together they make them about a quarter faster. `index.ts` sets `files.eol` too.
 */
const testSettings = {
  'chat.disableAIFeatures': true,
  'telemetry.telemetryLevel': 'off',
};

/**
 * `--coverage` (or `COVERAGE=1`, which `pnpm test-docker --coverage` sets) records which lines of
 * src/ the tests run and writes a report to coverage/
 */
const coverage = process.argv.includes('--coverage') || process.env.COVERAGE === '1';
const coverageDir = path.resolve(__dirname, '..', 'coverage');
const rawCoverageDir = path.join(coverageDir, 'tmp');

/**
 * Turns the V8 coverage the extension host recorded for out/test.js into a report on the files in
 * src/, using the bundle's source map
 */
async function writeCoverageReport() {
  await new Report({
    tempDirectory: rawCoverageDir,
    reportsDirectory: coverageDir,
    reporter: ['text-summary', 'html', 'lcov'],
    // Report on the source files the bundle maps back to, leaving out the tests and VS Code's
    // built-in extensions, which share the extension host. An `include` list of src/ would drop
    // everything: v8-to-istanbul checks each range against it using the source map's file://
    // URLs, which never match.
    excludeAfterRemap: true,
    exclude: ['test/**', '.vscode-test/**'],
  }).run();
  console.log(`Coverage report: ${path.join(coverageDir, 'index.html')}`);
}

async function main() {
  if (coverage) {
    fs.rmSync(coverageDir, { recursive: true, force: true });
  }

  let failed = false;
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
      // Set only for the extension host, which runs the extension and the tests, so V8 doesn't
      // record coverage for the rest of VS Code
      extensionTestsEnv: coverage ? { NODE_V8_COVERAGE: rawCoverageDir } : undefined,
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    failed = true;
  }

  // Report coverage even when tests fail, since a few failures barely change it
  if (coverage) {
    await writeCoverageReport();
  }
  if (failed) {
    process.exit(1);
  }
}

void main();
