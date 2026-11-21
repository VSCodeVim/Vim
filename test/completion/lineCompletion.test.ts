import * as assert from 'assert';

import * as vscode from 'vscode';
import { getCompletionsForCurrentLine } from '../../src/completion/lineCompletionProvider';
import { setupWorkspace } from '../testUtils';

suite('Provide line completions', () => {
  /**
   * Opens a document with `lines` and returns the completions for the end of line `line`. Other
   * open documents can add completions after the ones from this document.
   */
  const getCompletions = async (lines: string[], line: number) => {
    await setupWorkspace({ fileContent: lines });
    const document = vscode.window.activeTextEditor!.document;
    return getCompletionsForCurrentLine(document.lineAt(line).range.end, document)!;
  };

  test('Can complete lines in file, prioritizing above cursor, near cursor', async () => {
    const completions = await getCompletions(['a1', 'a2', 'a', 'a3', 'b1', 'a4'], 2);
    assert.deepStrictEqual(completions.slice(0, 4), ['a2', 'a1', 'a3', 'a4']);
  });

  test('Can complete lines in file with different indentation', async () => {
    const completions = await getCompletions(['a1', '   a 2', 'a', 'a3  ', 'b1', 'a4'], 2);
    assert.deepStrictEqual(completions.slice(0, 4), ['a 2', 'a1', 'a3  ', 'a4']);
  });

  test('Returns no completions for unmatched line', async () => {
    const completions = await getCompletions(
      ['a1', '   a2', 'azzzzzzzzzzzzzzzzzzzzzzzz', 'a3  ', 'b1', 'a4'],
      2,
    );
    assert.deepStrictEqual(completions, []);
  });
});
