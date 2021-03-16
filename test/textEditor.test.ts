import * as assert from 'assert';
import * as vscode from 'vscode';

import { TextEditor } from './../src/textEditor';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('text editor', () => {
  suiteSetup(async () => {
    await setupWorkspace();
  });

  suiteTeardown(cleanUpWorkspace);

  test("insert 'Hello World'", async () => {
    const editor = vscode.window.activeTextEditor!;
    const expectedText = 'Hello World';

    await TextEditor.insert(editor, expectedText);

    assert.strictEqual(editor.document.lineCount, 1);
    assert.strictEqual(editor.document.lineAt(0).text, expectedText);
  });

  test("replace 'World' with 'Foo Bar'", async () => {
    const editor = vscode.window.activeTextEditor!;
    const newText = 'Foo Bar';
    const start = new vscode.Position(0, 6);
    const end = new vscode.Position(0, 11);
    const range: vscode.Range = new vscode.Range(start, end);

    await TextEditor.replace(editor, range, newText);
    assert.strictEqual(editor.document.lineCount, 1);
    assert.strictEqual(editor.document.lineAt(0).text, 'Hello Foo Bar');
  });

  test('delete `Hello`', async () => {
    const editor = vscode.window.activeTextEditor!;
    assert.strictEqual(editor.document.lineCount, 1);

    const end = new vscode.Position(0, 5);
    const range = new vscode.Range(new vscode.Position(0, 0), end);

    await TextEditor.delete(editor, range);
    assert.strictEqual(editor.document.lineAt(0).text, ' Foo Bar');
  });

  test('delete the whole line', async () => {
    const editor = vscode.window.activeTextEditor!;
    assert.strictEqual(editor.document.lineCount, 1);

    const range = editor.document.lineAt(0).range;

    await TextEditor.delete(editor, range);
    assert.strictEqual(editor.document.lineAt(0).text, '');
  });
});
