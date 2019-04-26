import * as vscode from 'vscode';
import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { createRandomFile, setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { StatusBar } from '../../src/statusBar';

suite('cmd_line tab', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('command line command tab completion', async () => {
    const beforeStatusBar = StatusBar.GetTrimmed();

    // figure out how to press keys in this test
    const commands = vscode.commands.getCommands();

    const afterStatusBar = StatusBar.GetTrimmed();

    assert.notEqual(beforeStatusBar, afterStatusBar, 'Status Bar did not change');
  });


  test('command line file tab completion', async () => {
    const beforeStatusBar = StatusBar.GetTrimmed();
    // code to change editor
    const afterStatusBar = StatusBar.GetTrimmed();

    assert.notEqual(beforeStatusBar, afterStatusBar, 'Status Bar did not change');
  });
});

