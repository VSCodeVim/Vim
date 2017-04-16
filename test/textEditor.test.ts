"use strict";

import * as assert from 'assert';
import * as vscode from 'vscode';
import { TextEditor } from './../src/textEditor';
import { setupWorkspace, cleanUpWorkspace } from './testUtils';

suite("text editor", () => {
  suiteSetup(async () => {
    await setupWorkspace();
  });

  suiteTeardown(cleanUpWorkspace);

  test("insert 'Hello World'", async () => {
  let expectedText = "Hello World";

    await TextEditor.insert(expectedText);

    assert.equal(vscode.window.activeTextEditor!.document.lineCount, 1);
    let actualText = TextEditor.readLineAt(0);
    assert.equal(actualText, expectedText);
  });

  test("replace 'World' with 'Foo Bar'", async () => {
    let newText = "Foo Bar";
    let start = new vscode.Position(0, 6);
    let end = new vscode.Position(0, 11);
    let range : vscode.Range = new vscode.Range(start, end);

    await TextEditor.replace(range, newText);
    assert.equal(vscode.window.activeTextEditor!.document.lineCount, 1);

    let actualText = TextEditor.readLineAt(0);
    assert.equal(actualText, "Hello Foo Bar");
  });

  test("delete `Hello`", async () => {
    assert.equal(vscode.window.activeTextEditor!.document.lineCount, 1);

    let end = new vscode.Position(0, 5);
    let range = new vscode.Range(new vscode.Position(0, 0), end);

    await TextEditor.delete(range);
    let actualText = TextEditor.readLineAt(0);
    assert.equal(actualText, " Foo Bar");
  });

  test("delete the whole line", async () => {
    assert.equal(vscode.window.activeTextEditor!.document.lineCount, 1);

    let range = vscode.window.activeTextEditor!.document.lineAt(0).range;

    await TextEditor.delete(range);
    let actualText = TextEditor.readLineAt(0);
    assert.equal(actualText, "");
  });

  test("try to read lines that don't exist", () => {
    assert.equal(vscode.window.activeTextEditor!.document.lineCount, 1);
    assert.throws(() => TextEditor.readLineAt(1), RangeError);
    assert.throws(() => TextEditor.readLineAt(2), RangeError);
  });
});
