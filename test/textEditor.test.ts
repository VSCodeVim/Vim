import * as assert from 'assert';
import * as vscode from 'vscode';
import TextEditor from './../src/textEditor';
import Cursor from './../src/cursor';

import * as testUtils from './testUtils';

suite("text editor", () => {
	suiteSetup(done => {
        testUtils.clearTextEditor()
			.then(done);
	});

	suiteTeardown(done => {
        testUtils.clearTextEditor()
			.then(done);
	});

	test("insert 'Hello World'", done => {
		let expectedText = "Hello World";

		TextEditor.insert(expectedText).then(x => {
			assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);
			let actualText = TextEditor.readLine(0);
			assert.equal(actualText, expectedText);
		}).then(done, done);
	});

	test("replace 'World' with 'Foo Bar'", done => {
		let newText = "Foo Bar";
		let start = new vscode.Position(0, 6);
		let end = new vscode.Position(0, 11);
		let range : vscode.Range = new vscode.Range(start, end);

		TextEditor.replace(range, newText).then( x => {
			assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);

			let actualText = TextEditor.readLine(0);
			assert.equal(actualText, "Hello Foo Bar");
		}).then(done, done);
	});

	test("delete `Hello`", done => {
		assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);

		var end = new vscode.Position(0, 5);
		var range = new vscode.Range(Cursor.documentBegin(), end);

		TextEditor.delete(range).then( x => {
			let actualText = TextEditor.readLine(0);
			assert.equal(actualText, " Foo Bar");
		}).then(done, done);
	});

	test("delete the whole line", done => {
		assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);

		var range = vscode.window.activeTextEditor.document.lineAt(0).range;

		TextEditor.delete(range).then( x => {
			let actualText = TextEditor.readLine(0);
			assert.equal(actualText, "");
		}).then(done, done);
	});

	test("try to read lines that don't exist", () => {
		assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);
		assert.throws(() => TextEditor.readLine(1), RangeError);
		assert.throws(() => TextEditor.readLine(2), RangeError);
	});
});
