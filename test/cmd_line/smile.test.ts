import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { SmileCommand } from '../../src/cmd_line/commands/smile';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace, waitForTabChange } from './../testUtils';

suite('Smile command', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test(':smile creates new tab containing smile', async () => {
    await new ExCommandLine('smile', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    await waitForTabChange();

    assert.strictEqual(
      vscode.window.visibleTextEditors.length,
      1,
      ':smile did not create a new untitled file',
    );

    assertEqualLines(SmileCommand.smileText.split('\n'));
  });
});
