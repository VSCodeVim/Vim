//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.
import Mocha from 'mocha';
import testFiles from 'test-files';
import * as vscode from 'vscode';

import { Globals } from '../src/globals';
import { Configuration } from './testConfiguration';

// The test build bundles the extension and the tests into one file, which VS Code loads both as the
// extension (`main` in out/package.json) and as the test runner, so the tests share module state,
// such as `Globals`, with the extension
export { activate, deactivate } from '../extension';

Globals.isTesting = true;
Globals.mockConfiguration = new Configuration();

export async function run(): Promise<void> {
  const mochaGrep = new RegExp(process.env.MOCHA_GREP || '');

  // New documents get their line ending from `files.eol`. It's a user setting, which persists in
  // the test's VS Code profile, so set it on every run rather than only when `TEST_EOL` is set.
  const { testEol } = await import('./testUtils');
  await vscode.workspace
    .getConfiguration('files')
    .update('eol', testEol, vscode.ConfigurationTarget.Global);

  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 5000,
    grep: mochaGrep,
    // Fail in CI if a `newTestOnly` or `.only` was committed, since it would skip every other test
    forbidOnly: !!process.env.CI,
    rootHooks: {
      beforeEach: async () => {
        const testUtils = await import('./testUtils');
        testUtils.resetGlobalState();
        // Runs after the suite's `suiteSetup` hooks, so this undoes only the test's own changes,
        // including any its `setup` hooks make
        restoreTestConfig = await testUtils.saveConfig();
      },
      afterEach: async () => restoreTestConfig?.(),
      afterAll: async () => (await import('./testUtils')).removeTestTempDir(),
    },
  });
  let restoreTestConfig: (() => Promise<void>) | undefined;

  // Undo each suite's config changes (e.g. from `setupWorkspace` in `suiteSetup`) when it ends, so
  // they don't leak into the suites after it. The hooks are added as each suite is created, before
  // its body runs, so they run before the suite's own `suiteSetup` and `suiteTeardown`.
  const scopeConfigToSuites = (parent: Mocha.Suite) => {
    parent.on(Mocha.Suite.constants.EVENT_SUITE_ADD_SUITE, (suite: Mocha.Suite) => {
      let restoreSuiteConfig: (() => Promise<void>) | undefined;
      suite.beforeAll(async () => {
        restoreSuiteConfig = await (await import('./testUtils')).saveConfig();
      });
      suite.afterAll(async () => restoreSuiteConfig?.());
      scopeConfigToSuites(suite);
    });
  };
  scopeConfigToSuites(mocha.suite);

  // Load each test file from the bundle, the way `mocha.addFile` would load it from disk
  for (const [file, load] of testFiles) {
    mocha.suite.emit(Mocha.Suite.constants.EVENT_FILE_PRE_REQUIRE, globalThis, file, mocha);
    mocha.suite.emit(Mocha.Suite.constants.EVENT_FILE_REQUIRE, await load(), file, mocha);
    mocha.suite.emit(Mocha.Suite.constants.EVENT_FILE_POST_REQUIRE, globalThis, file, mocha);
  }

  return new Promise((c, e) => {
    try {
      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (error) {
      console.error(error);
      e(error as Error);
    }
  });
}
