import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension.ts';
import { ExCommandLine } from '../../src/cmd_line/commandLine.ts';
import { ModeHandler } from '../../src/mode/modeHandler.ts';
import { assertEqualLines, setupWorkspace, waitForTabChange } from './../testUtils.ts';
import { SmileCommand } from '../../src/cmd_line/commands/smile.ts';

suite('Smile command', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test(':smile creates new tab', async () => {
    await new ExCommandLine('smile', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    await waitForTabChange();

    assert.strictEqual(
      vscode.window.visibleTextEditors.length,
      1,
      ':smile did not create a new untitled file',
    );
  });

  test(':smile editor contains smile text', async () => {
    await new ExCommandLine('smile', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    await waitForTabChange();
    const textArray = SmileCommand.smileText.split('\n');

    assertEqualLines(textArray);
  });
});
