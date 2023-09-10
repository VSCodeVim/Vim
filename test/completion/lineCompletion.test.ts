import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { getCompletionsForCurrentLine } from '../../src/completion/lineCompletionProvider';
import { ModeHandler } from '../../src/mode/modeHandler';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';
import { VimState } from '../../src/state/vimState';
import { Position } from 'vscode';

suite('Provide line completions', () => {
  let modeHandler: ModeHandler;
  let vimState: VimState;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
    vimState = modeHandler.vimState;
  });

  teardown(cleanUpWorkspace);

  const setupTestWithLines = async (lines: string[]) => {
    vimState.cursorStopPosition = new Position(0, 0);

    await modeHandler.handleKeyEvent('<Esc>');
    await vimState.editor.edit((builder) => {
      builder.insert(new Position(0, 0), lines.join('\n'));
    });
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'j', 'j', 'A']);
  };

  suite('Line Completion Provider unit tests', () => {
    // TODO(#4844): this fails on Windows
    test('Can complete lines in file, prioritizing above cursor, near cursor', async () => {
      if (process.platform === 'win32') {
        return;
      }
      const lines = ['a1', 'a2', 'a', 'a3', 'b1', 'a4'];
      await setupTestWithLines(lines);
      const expectedCompletions = ['a2', 'a1', 'a3', 'a4'];
      const topCompletions = getCompletionsForCurrentLine(
        vimState.cursorStopPosition,
        vimState.document,
      )!.slice(0, expectedCompletions.length);

      assert.deepStrictEqual(topCompletions, expectedCompletions, 'Unexpected completions found');
    });

    // TODO(#4844): this fails on Windows
    test('Can complete lines in file with different indentation', async () => {
      if (process.platform === 'win32') {
        return;
      }
      const lines = ['a1', '   a 2', 'a', 'a3  ', 'b1', 'a4'];
      await setupTestWithLines(lines);
      const expectedCompletions = ['a 2', 'a1', 'a3  ', 'a4'];
      const topCompletions = getCompletionsForCurrentLine(
        vimState.cursorStopPosition,
        vimState.document,
      )!.slice(0, expectedCompletions.length);

      assert.deepStrictEqual(topCompletions, expectedCompletions, 'Unexpected completions found');
    });

    test('Returns no completions for unmatched line', async () => {
      const lines = ['a1', '   a2', 'azzzzzzzzzzzzzzzzzzzzzzzz', 'a3  ', 'b1', 'a4'];
      await setupTestWithLines(lines);
      const expectedCompletions = [];
      const completions = getCompletionsForCurrentLine(
        vimState.cursorStopPosition,
        vimState.document,
      )!.slice(0, expectedCompletions.length);

      assert.strictEqual(completions.length, 0, 'Completions found, but none were expected');
    });
  });
});
