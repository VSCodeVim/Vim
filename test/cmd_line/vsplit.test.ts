import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';
import * as vscode from 'vscode';
import { join } from 'path';
import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../../extension';

async function WaitForEditorOpen(): Promise<void> {
  // cleanUpWorkspace - testUtils.ts
  let poll = new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === 2) {
      return c();
    }

    let pollCount = 0;
    // TODO: the visibleTextEditors variable doesn't seem to be
    // up to date after a onDidChangeActiveTextEditor event, not
    // even using a setTimeout 0... so we MUST poll :(
    let interval = setInterval(() => {
      // if visibleTextEditors is not updated after 1 sec
      // we can expect that 'wq' failed
      if (pollCount <= 100) {
        pollCount++;
        if (vscode.window.visibleTextEditors.length < 2) {
          return;
        }
      }

      clearInterval(interval);
      c();
    }, 10);
  });

  try {
    await poll;
  } catch (error) {
    assert.fail(null, null, error.toString(), '');
  }
}

suite('Vertical split', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('Run :vs', async () => {
    await runCmdLine('vs', modeHandler);
    await WaitForEditorOpen();

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });

  test('Run :vsp', async () => {
    await runCmdLine('vsp', modeHandler);
    await WaitForEditorOpen();

    assertEqual(vscode.window.visibleTextEditors.length, 2, 'Editor did not split in 1 sec');
  });
});
