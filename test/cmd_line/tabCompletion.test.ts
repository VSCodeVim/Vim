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
    await modeHandler.handleMultipleKeyEvents([':', 'e', 'd', 'i']);
    await modeHandler.handleKeyEvent('<tab>');
    const statusBarAfterTab = StatusBar.Get();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.equal(statusBarAfterTab.trim(), ':edit|', 'Command Tab Completion Failed');
  });

  test('command line file tab completion with no base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.Get();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '<tab>']);
    const statusBarAfterTab = StatusBar.Get();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with / as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.Get();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '.', '.', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.Get();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with ~/ as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.Get();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '~', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.Get();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with ./ as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.Get();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '.', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.Get();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });

  test('command line file tab completion with ../ as base path', async () => {
    await modeHandler.handleKeyEvent(':');
    const statusBarBeforeTab = StatusBar.Get();

    await modeHandler.handleMultipleKeyEvents(['e', ' ', '.', '.', '/', '<tab>']);
    const statusBarAfterTab = StatusBar.Get();

    await modeHandler.handleKeyEvent('<Esc>');
    assert.notEqual(statusBarBeforeTab, statusBarAfterTab, 'Status Bar did not change');
  });
});
