import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';
import * as vscode from 'vscode';
import { join } from 'path';
import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../../extension';

/**
 * Waits for the number of text editors in the current window to equal the
 * given expected number of text editors.
 *
 * @param numEditors Expected number of editors in the window
 */
async function WaitForEditors(numEditors: number): Promise<void> {
  let waitForEditorChange = new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === numEditors) {
      return c();
    }

    let editorChange = vscode.window.onDidChangeVisibleTextEditors(() => {
      if (vscode.window.visibleTextEditors.length === numEditors) {
        c();
      }
    });
  });

  try {
    await waitForEditorChange;
  } catch (error) {
    assert.fail(null, null, error.toString(), '');
  }
}

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
