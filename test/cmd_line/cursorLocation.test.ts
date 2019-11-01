import * as vscode from 'vscode';
import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { createRandomFile, setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { StatusBar } from '../../src/statusBar';

suite('cursor location', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('cursor location in command line', async () => {
    await modeHandler.handleMultipleKeyEvents([
      ':',
      't',
      'e',
      's',
      't',
      '<right>',
      '<right>',
      '<right>',
      '<left>',
    ]);

    const statusBarAfterCursorMovement = StatusBar.Get();
    await modeHandler.handleKeyEvent('<Esc>');

    const statusBarAfterEsc = StatusBar.Get();
    assert.strictEqual(
      statusBarAfterCursorMovement.trim(),
      ':tes|t',
      'Command Tab Completion Failed'
    );
  });

  test('cursor location in search', async () => {
    await modeHandler.handleMultipleKeyEvents([
      '/',
      't',
      'e',
      's',
      't',
      '<right>',
      '<right>',
      '<right>',
      '<left>',
    ]);

    const statusBarAfterCursorMovement = StatusBar.Get();

    await modeHandler.handleKeyEvent('<Esc>');
    const statusBarAfterEsc = StatusBar.Get();
    assert.strictEqual(
      statusBarAfterCursorMovement.trim(),
      '/tes|t',
      'Command Tab Completion Failed'
    );
  });
});
