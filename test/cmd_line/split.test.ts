import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import {
  assertEqual,
  cleanUpWorkspace,
  setupWorkspace,
  WaitForEditorsToClose,
} from './../testUtils';

suite('Horizontal split', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('Run :sp', async () => {
    await commandLine.Run('sp', modeHandler.vimState);
    await WaitForEditorsToClose(2);

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });

  test('Run :split', async () => {
    await commandLine.Run('split', modeHandler.vimState);
    await WaitForEditorsToClose(2);

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });

  test('Run :new', async () => {
    await commandLine.Run('split', modeHandler.vimState);
    await WaitForEditorsToClose(2);

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });
});
