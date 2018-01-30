import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { CommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqual, cleanUpWorkspace, setupWorkspace, WaitForEditorsToClose } from './../testUtils';

suite('Vertical split', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('Run :vs', async () => {
    await CommandLine.Run('vs', modeHandler.vimState);
    await WaitForEditorsToClose(2);

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });

  test('Run :vsp', async () => {
    await CommandLine.Run('vsp', modeHandler.vimState);
    await WaitForEditorsToClose(2);

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });
});
