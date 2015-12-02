import * as assert from 'assert';
import * as vscode from 'vscode';
import TextEditor from './../src/textEditor';
import Cursor from './../src/cursor';

suite("cursor", () => {
	let text: Array<string> = [
		"mary had",
		"a",
		"little lamb"
	];

	setup(done => {
		TextEditor.insert(text.join('\n')).then(() => done());
	});

	teardown(done => {
		let range = new vscode.Range(Cursor.documentBegin(), Cursor.documentEnd());
		TextEditor.delete(range).then(() => done());
	});

	test("left should move cursor one column left", () => {
		Cursor.move(new vscode.Position(0, 5));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 5);

		let left = Cursor.left();
		assert.equal(left.line, 0);
		assert.equal(left.character, 4);
	});

	test("left on left-most column should stay at the same location", () => {
		Cursor.move(new vscode.Position(0, 0));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 0);

		let left = Cursor.left();
		assert.equal(left.line, 0);
		assert.equal(left.character, 0);
	});

	test("right should move cursor one column right", () => {
		Cursor.move(new vscode.Position(0, 5));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 5);

		let right = Cursor.right();
		assert.equal(right.line, 0);
		assert.equal(right.character, 6);
	});

	test("right on right-most column should stay at the same location", () => {
		Cursor.move(new vscode.Position(0, 7));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 7);

		let right = Cursor.right();
		assert.equal(right.line, 0);
		assert.equal(right.character, 7);
	});

	test("down should move cursor one line down", () => {
		Cursor.move(new vscode.Position(1, 0));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 1);
		assert.equal(current.character, 0);

		let down = Cursor.down();
		console.log(down.character);
		assert.equal(down.line, 2);
		assert.equal(down.character, 0);
	});

	test("down on bottom-most line should stay at the same location", () => {
		Cursor.move(new vscode.Position(2, 0));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 2);
		assert.equal(current.character, 0);

		let down = Cursor.down();
		assert.equal(down.line, 2);
		assert.equal(down.character, 0);
	});

	test("up should move cursor one line up", () => {
		Cursor.move(new vscode.Position(1, 0));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 1);
		assert.equal(current.character, 0);

		let up = Cursor.up();
		assert.equal(up.line, 0);
		assert.equal(up.character, 0);
	});

	test("up on top-most line should stay at the same location", () => {
		Cursor.move(new vscode.Position(0, 0));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 0);

		let up = Cursor.up();
		assert.equal(up.line, 0);
		assert.equal(up.character, 0);
	});

	test("keep same column as up/down", () => {
		Cursor.move(new vscode.Position(0, 0));
		Cursor.move(Cursor.right());
		Cursor.move(Cursor.right());

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 2);

		Cursor.move(Cursor.down());

		current = Cursor.currentPosition();
		assert.equal(current.line, 1);
		assert.equal(current.character, 0);

		Cursor.move(Cursor.down());

		current = Cursor.currentPosition();
		assert.equal(current.line, 2);
		assert.equal(current.character, 2);
	});

	test("get line begin cursor", () => {
		Cursor.move(new vscode.Position(0, 0));

		let pos = Cursor.lineBegin();

		assert.equal(pos.line, 0);
		assert.equal(pos.character, 0);

		Cursor.move(Cursor.down());

		pos = Cursor.lineBegin();

		assert.equal(pos.line, 1);
		assert.equal(pos.character, 0);
	});

	test("get line end cursor", () => {
		Cursor.move(new vscode.Position(0, 0));

		let pos = Cursor.lineEnd();

		assert.equal(pos.line, 0);
		assert.equal(pos.character, text[0].length);

		Cursor.move(Cursor.down());

		pos = Cursor.lineEnd();

		assert.equal(pos.line, 1);
		assert.equal(pos.character, text[1].length);
	});

	test("get document begin cursor", () => {
		var cursor = Cursor.documentBegin();

		assert.equal(cursor.line, 0);
		assert.equal(cursor.character, 0);
	});

	test("get document end cursor", () => {
		var cursor = Cursor.documentEnd();

		assert.equal(cursor.line, 2);
		assert.equal(cursor.character, text[2].length);
	});

	test("wordRight should move cursor word right", () => {
		Cursor.move(new vscode.Position(0, 0));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 0);

		var wordRight = Cursor.wordRight();
		assert.equal(wordRight.line, 0);
		assert.equal(wordRight.character, 5);
	});

	test("wordLeft should move cursor word left", () => {
		Cursor.move(new vscode.Position(0, 3));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 3);

		var wordLeft = Cursor.wordLeft();
		assert.equal(wordLeft.line, 0);
		assert.equal(wordLeft.character, 0);
	});
	
	test("wordRight on last word should stay on line at last character", () => {
		Cursor.move(new vscode.Position(0, 6));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 6);

		var pos = Cursor.wordRight();
		assert.equal(pos.line, 0);
		assert.equal(pos.character, 8);
	});
	
	test("wordRight on end of line should move to next word on next line", () => {
		Cursor.move(new vscode.Position(0, 8));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 8);

		var pos = Cursor.wordRight();
		assert.equal(pos.line, 1);
		assert.equal(pos.character, 0);
	});
	
	test("wordLeft on first word should move to previous line of end of line", () => {
		Cursor.move(new vscode.Position(2, 0));

		let current = Cursor.currentPosition();
		assert.equal(current.line, 2);
		assert.equal(current.character, 0);

		var pos = Cursor.wordLeft();
		assert.equal(pos.line, 1);
		assert.equal(pos.character, 1);
	});
});
