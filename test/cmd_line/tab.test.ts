import * as vscode from 'vscode';
import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { createFile, setupWorkspace, cleanUpWorkspace } from '../testUtils';

suite('cmd_line tab', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suiteTeardown(cleanUpWorkspace);

  test('tabe with no arguments when not in workspace opens an untitled file', async () => {
    const beforeEditor = vscode.window.activeTextEditor;
    await new ExCommandLine('tabe', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    const afterEditor = vscode.window.activeTextEditor;

    assert.notStrictEqual(beforeEditor, afterEditor, 'Active editor did not change');
  });

  test('tabedit with no arguments when not in workspace opens an untitled file', async () => {
    const beforeEditor = vscode.window.activeTextEditor;
    await new ExCommandLine('tabedit', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    const afterEditor = vscode.window.activeTextEditor;

    assert.notStrictEqual(beforeEditor, afterEditor, 'Active editor did not change');
  });

  test('tabe with absolute path when not in workspace opens file', async () => {
    const filePath = await createFile();
    await new ExCommandLine(`tabe ${filePath}`, modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const editor = vscode.window.activeTextEditor;

    if (editor === undefined) {
      assert.fail('File did not open');
    } else {
      if (process.platform !== 'win32') {
        assert.strictEqual(editor.document.fileName, filePath, 'Opened wrong file');
      } else {
        assert.strictEqual(
          editor.document.fileName.toLowerCase(),
          filePath.toLowerCase(),
          'Opened wrong file',
        );
      }
    }
  });

  test('tabe with current file path does nothing', async () => {
    const filePath = await createFile();
    await new ExCommandLine(`tabe ${filePath}`, modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );

    const beforeEditor = vscode.window.activeTextEditor;
    await new ExCommandLine(`tabe ${filePath}`, modeHandler.vimState.currentMode).run(
      modeHandler.vimState,
    );
    const afterEditor = vscode.window.activeTextEditor;

    assert.strictEqual(
      beforeEditor,
      afterEditor,
      'Active editor changed even though :tabe opened the same file',
    );
  });
});
