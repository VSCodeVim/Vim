import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqual, cleanUpWorkspace, setupWorkspace } from '../testUtils';

const isPanelVisible = async () =>
  withinIsolatedEditor(async () => {
    // Insert 1000 lines (ie. beyond veritical viewport)
    await vscode.window.activeTextEditor!.edit(async editBuilder => {
      editBuilder.insert(new vscode.Position(0, 0), 'Line\n'.repeat(1000));
    });

    // Toggle the panel's visibility to see which has a larger vertical viewport
    const initialVisibleLineCount = await getNumberOfVisibleLines();
    await vscode.commands.executeCommand('workbench.action.togglePanel');
    const postToggleVisibleLineCount = await getNumberOfVisibleLines();
    await vscode.commands.executeCommand('workbench.action.togglePanel');

    return postToggleVisibleLineCount > initialVisibleLineCount;
  });

const withinIsolatedEditor = async (lambda: () => Thenable<unknown>) => {
  await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
  const result = await lambda();
  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  return result;
};

const getNumberOfVisibleLines = async () =>
  vscode.window.activeTextEditor!.visibleRanges[0].end.line;

suite(':only command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('Run :only', async () => {
    // Ensure we have multiple editors in a split
    await vscode.commands.executeCommand('workbench.action.splitEditorRight');
    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split into 2');

    // Ensure panel is visible
    if ((await isPanelVisible()) !== true) {
      await vscode.commands.executeCommand('workbench.action.togglePanel');
    }
    assertEqual(await isPanelVisible(), true);

    // Run 'only' command
    await commandLine.Run('only', modeHandler.vimState);
    assertEqual(vscode.window.visibleTextEditors.length, 1, 'Did not reduce to single editor');
    assertEqual(await isPanelVisible(), false, 'Panel is still visible');
  });
});
