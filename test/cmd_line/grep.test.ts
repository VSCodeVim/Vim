import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import * as t from '../testUtils';
import { GrepCommand } from '../../src/cmd_line/commands/grep';
import { Pattern, SearchDirection } from '../../src/vimscript/pattern';
import { Mode } from '../../src/mode/mode';

// This will go into the exCommandParse test
// function exParseTest(input: string, parsed: ExCommand) {
//   test(input, () => {
//     const { command } = exCommandParser.tryParse(input);
//     assert.deepStrictEqual(command, parsed);
//   });
// }

// suite('grep', () => {
//     const pattern = Pattern.parser({ direction: SearchDirection.Forward, delimiter: '/' });
//   exParseTest(':vimgrep "t*st" foo.txt',
//     new GrepCommand({
//       pattern: pattern.tryParse('t*st'),
//       files: ['foo.txt'],
//     }),
//   );
// });

function grep(pattern: Pattern, files: string[]): GrepCommand {
  return new GrepCommand({ pattern, files });
}

suite('Basic grep command', () => {
  setup(t.setupWorkspace);
  suiteTeardown(t.cleanUpWorkspace);
  test('GrepCommand parses correctly', async () => {
    await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    const pattern = Pattern.parser({ direction: SearchDirection.Backward, delimiter: '/' });
    const command = grep(pattern.tryParse('t*st'), ['Untitled-1']);
    assert.deepStrictEqual(command.arguments, {
      pattern: pattern.tryParse('t*st'),
      files: ['Untitled-1'],
    });
  });
  // when you search.action.focusNextSearchResult , it will enter the file in visual mode for some reason, we can test whether it is in visual mode or not after running that command
  // that only happens if the search panel is not open already
  // if the search panel is open, it will be in normal mode
  // it will also be in normal mode if you run vimgrep from another file
  test('GrepCommand executes correctly', async () => {
    // Untitled-1
    await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(0, 0),
          'this is a test\nanother t*st line\nno match here\n',
        );
      });
      // Because of the save confirmation dialog, it will timeout
      // await editor.document.save()
    }
    // Untitled-2
    await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    const modeHandler = await getAndUpdateModeHandler();
    const pattern = Pattern.parser({ direction: SearchDirection.Backward, delimiter: '/' });
    const command = grep(pattern.tryParse('t*st'), ['Untitled-1']);
    await command.execute();
    await vscode.commands.executeCommand('search.action.focusNextSearchResult');
    // Assert that the active editor is Untitled-1
    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, 'There should be an active editor');
    assert.ok(
      activeEditor?.document.fileName.endsWith('Untitled-1'),
      'Active editor should be Untitled-1 after grep',
    );
    assert.ok(modeHandler, 'modeHandler should be defined');
    assert.notStrictEqual(
      modeHandler.vimState,
      Mode.Visual,
      'Should not be in visual mode after grep',
    );
  });
});
