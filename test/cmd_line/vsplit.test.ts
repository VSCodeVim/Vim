import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { runCmdLine } from '../../src/cmd_line/main';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqual, cleanUpWorkspace, setupWorkspace, WaitForEditors } from './../testUtils';

suite('Vertical split', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('Run :vs', async () => {
    await runCmdLine('vs', modeHandler);
    await WaitForEditors(2);

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });

  test('Run :vsp', async () => {
    await runCmdLine('vsp', modeHandler);
    await WaitForEditors(2);

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });
});
