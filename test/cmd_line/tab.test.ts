import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { CommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';
import { createRandomFile, setupWorkspace, cleanUpWorkspace } from '../testUtils';

suite('cmd_line tab', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('tabe with no arguments when not in workspace opens an untitled file', async () => {
    const beforeEditor = vscode.window.activeTextEditor;
    await CommandLine.Run('tabe', modeHandler.vimState);
    const afterEditor = vscode.window.activeTextEditor;

    assert.notEqual(beforeEditor, afterEditor, 'Active editor did not change');
  });

  test('tabedit with no arguments when not in workspace opens an untitled file', async () => {
    const beforeEditor = vscode.window.activeTextEditor;
    await CommandLine.Run('tabedit', modeHandler.vimState);
    const afterEditor = vscode.window.activeTextEditor;

    assert.notEqual(beforeEditor, afterEditor, 'Active editor did not change');
  });

  test('tabe with absolute path when not in workspace opens file', async () => {
    const file = await createRandomFile('', '');
    await CommandLine.Run(`tabe ${file.path}`, modeHandler.vimState);
    const editor = vscode.window.activeTextEditor;

    if (editor === undefined) {
      assert.fail('File did not open');
    } else {
      assert.equal(editor.document.fileName, file.path, 'Opened wrong file');
    }
  });

  test('tabe with current file path does nothing', async () => {
    const file = await createRandomFile('', '');
    await CommandLine.Run(`tabe ${file.path}`, modeHandler.vimState);

    const beforeEditor = vscode.window.activeTextEditor;
    await CommandLine.Run(`tabe ${file.path}`, modeHandler.vimState);
    const afterEditor = vscode.window.activeTextEditor;

    assert.equal(
      beforeEditor,
      afterEditor,
      'Active editor changed even though :tabe opened the same file'
    );
  });
});
