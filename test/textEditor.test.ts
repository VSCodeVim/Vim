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
    const expectedText = 'Hello World';

    await TextEditor.insert(expectedText);

    assert.strictEqual(vscode.window.activeTextEditor!.document.lineCount, 1);
    const actualText = TextEditor.readLineAt(0);
    assert.strictEqual(actualText, expectedText);
  });

  test("replace 'World' with 'Foo Bar'", async () => {
    const newText = 'Foo Bar';
    const start = new vscode.Position(0, 6);
    const end = new vscode.Position(0, 11);
    const range: vscode.Range = new vscode.Range(start, end);

    await TextEditor.replace(range, newText);
    assert.strictEqual(vscode.window.activeTextEditor!.document.lineCount, 1);

    const actualText = TextEditor.readLineAt(0);
    assert.strictEqual(actualText, 'Hello Foo Bar');
  });

  test('delete `Hello`', async () => {
    assert.strictEqual(vscode.window.activeTextEditor!.document.lineCount, 1);

    const end = new vscode.Position(0, 5);
    const range = new vscode.Range(new vscode.Position(0, 0), end);

    await TextEditor.delete(range);
    const actualText = TextEditor.readLineAt(0);
    assert.strictEqual(actualText, ' Foo Bar');
  });

  test('delete the whole line', async () => {
    assert.strictEqual(vscode.window.activeTextEditor!.document.lineCount, 1);

    const range = vscode.window.activeTextEditor!.document.lineAt(0).range;

    await TextEditor.delete(range);
    const actualText = TextEditor.readLineAt(0);
    assert.strictEqual(actualText, '');
  });

  test("try to read lines that don't exist", () => {
    assert.strictEqual(vscode.window.activeTextEditor!.document.lineCount, 1);
    assert.throws(() => TextEditor.readLineAt(1), RangeError);
    assert.throws(() => TextEditor.readLineAt(2), RangeError);
  });
});
