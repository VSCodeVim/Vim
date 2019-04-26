import * as vscode from 'vscode';
import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { createRandomFile, setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { StatusBar } from '../../src/statusBar';

suite('cmd_line tabComplete', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('command line command tab completion', async () => {
    await modeHandler.handleMultipleKeyEvents([':', 'e','d','i']);
    await modeHandler.handleKeyEvent('<tab>');
    const statusBarAfterTab = StatusBar.GetTrimmed();

    assert.notEqual(statusBarAfterTab, 'edit', 'Command Tab Completion Failed');
  });

  test('command line file tab completion', async () => {
    await modeHandler.handleKeyEvent(':');
    const beforeStatusBar = StatusBar.GetTrimmed();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '<tab>']);
    const afterStatusBar = StatusBar.GetTrimmed();

    assert.notEqual(beforeStatusBar, afterStatusBar, 'Status Bar did not change');
  });
});
