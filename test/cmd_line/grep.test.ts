import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { GrepCommand } from '../../src/cmd_line/commands/grep';
import { Pattern, SearchDirection } from '../../src/vimscript/pattern';
import { Mode } from '../../src/mode/mode';
import { createFile, setupWorkspace, cleanUpWorkspace } from '../testUtils';

function grep(pattern: Pattern, files: string[]): GrepCommand {
  return new GrepCommand({ pattern, files });
}

suite('Basic grep command', () => {
  // when you search.action.focusNextSearchResult , it will enter the file in visual mode for some reason, we can test whether it is in visual mode or not after running that command
  // that only happens if the search panel is not open already
  // if the search panel is open, it will be in normal mode
  // it will also be in normal mode if you run vimgrep from another file
  setup(async () => {
    // await cleanUpWorkspace();
    await setupWorkspace();
  });
  test('GrepCommand executes correctly', async () => {
    // first file, will have matches
    let file1 = await createFile({
      fileExtension: '.txt',
      contents: 'test, pattern nnnn, t*st, ttst',
    });
    // second file without a match
    let file2 = await createFile({
      fileExtension: '.txt',
      contents: 'no pattern match here ',
    });
    // We open the second file where we know there is no match
    const document1 = await vscode.workspace.openTextDocument(vscode.Uri.file(file1));
    await vscode.window.showTextDocument(document1);
    const document2 = await vscode.workspace.openTextDocument(vscode.Uri.file(file2));
    await vscode.window.showTextDocument(document2);
    const pattern = Pattern.parser({ direction: SearchDirection.Backward });
    file1 = file1.replace('/tmp/', '');
    file2 = file2.replace('/tmp/', '');
    const command = grep(pattern.tryParse('t*st'), [file1, file2]);
    await command.execute();
    // await vscode.commands.executeCommand('search.action.focusNextSearchResult');
    const activeEditor = vscode.window.activeTextEditor;
    const modeHandler = await getAndUpdateModeHandler();
    assert.ok(activeEditor, 'There should be an active editor');
    assert.ok(modeHandler, 'modeHandler should be defined');
    console.log(`Active editor: ${activeEditor.document.fileName}`);
    console.log(`Current mode: ${modeHandler.vimState.currentMode}`);
    const docs = vscode.workspace.textDocuments.map((doc) => doc.fileName);
    console.log(`open documents: ${docs}`);
    // After grep, the active editor should be the first file because the search panel focuses the first match and therefore opens the file
    assert.ok(
      activeEditor.document.fileName.endsWith(file1),
      'Active editor should be first file after grep',
    );
    assert.notStrictEqual(
      modeHandler.vimState,
      Mode.Visual,
      'Should not be in visual mode after grep',
    );
  });
});
