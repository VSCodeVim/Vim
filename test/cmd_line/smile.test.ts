import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import {
  assertEqualLines,
  cleanUpWorkspace,
  setupWorkspace,
  waitForTabChange,
} from './../testUtils';
import { SmileCommand } from '../../src/cmd_line/commands/smile';

suite('Smile command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test(':smile creates new tab', async () => {
    await commandLine.Run('smile', modeHandler.vimState);
    await waitForTabChange();

    assert.strictEqual(
      vscode.window.visibleTextEditors.length,
      1,
      ':smile did not create a new untitled file'
    );
  });

  test(':smile editor contains smile text', async () => {
    await commandLine.Run('smile', modeHandler.vimState);
    await waitForTabChange();
    const textArray = SmileCommand.smileText.split('\n');

    assertEqualLines(textArray);
  });
});
