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
    await setupWorkspace();
  });
  test('GrepCommand executes correctly', async () => {
    if (process.platform === 'win32') {
      return; // TODO: Why does this fail on Windows?
    }
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
    await vscode.window.showTextDocument(document1, { preview: false });
    const document2 = await vscode.workspace.openTextDocument(vscode.Uri.file(file2));
    await vscode.window.showTextDocument(document2, { preview: false });
    const pattern = Pattern.parser({ direction: SearchDirection.Backward });
    // The vscode's search doesn't work with the paths of the extension test host, so we strip to the file names only
    file1 = file1.substring(file1.lastIndexOf('/') + 1);
    file2 = file2.substring(file2.lastIndexOf('/') + 1);
    const command = grep(pattern.tryParse('t*st'), [file1, file2]);
    await command.execute();
    // Despite the fact that we already execute this command in the grep itself, without this focus, there is no active editor
    // I've tested visually and without this command you are still in the editor in the file with the match, I have no idea why it won't work without this
    await vscode.commands.executeCommand('search.action.focusNextSearchResult');
    const activeEditor = vscode.window.activeTextEditor;
    const modeHandler = await getAndUpdateModeHandler();
    assert.ok(activeEditor, 'There should be an active editor');
    assert.ok(modeHandler, 'modeHandler should be defined');
    const docs = vscode.workspace.textDocuments.map((doc) => doc.fileName);
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
