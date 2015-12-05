import * as assert from 'assert';
import * as vscode from 'vscode';
import TextEditor from './../src/textEditor';
import {Cursor} from './../src/motion/motion';


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
		TextEditor.delete().then(() => done());
	});

	test("left should move cursor one column left", () => {
		let cursor = new Cursor(0, 5);
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 5);

		let left = cursor.left();
		assert.equal(left.position.line, 0);
		assert.equal(left.position.character, 4);

		let moveLeft = left.move();
		assert.equal(moveLeft.position.line, 0);
		assert.equal(moveLeft.position.character, 4);

		let curPos = Cursor.getActualPosition();
		assert.equal(moveLeft.position.line, curPos.line);
		assert.equal(moveLeft.position.character, curPos.character);
	});

	test("left on left-most column should stay at the same location", () => {
		let cursor = new Cursor(0, 0);
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 0);

		let left = cursor.left();
		assert.equal(left.position.line, 0);
		assert.equal(left.position.character, 0);

		let moveLeft = left.move();
		assert.equal(moveLeft.position.line, 0);
		assert.equal(moveLeft.position.character, 0);

		let curPos = Cursor.getActualPosition();
		assert.equal(moveLeft.position.line, curPos.line);
		assert.equal(moveLeft.position.character, curPos.character);
	});

	test("right should move cursor one column right", () => {
		let cursor = new Cursor(0, 5);
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 5);

		let next = cursor.right();
		assert.equal(next.position.line, 0);
		assert.equal(next.position.character, 6);

		next = next.move();
		assert.equal(next.position.line, 0);
		assert.equal(next.position.character, 6);

		let curPos = Cursor.getActualPosition();
		assert.equal(next.position.line, curPos.line);
		assert.equal(next.position.character, curPos.character);
	});

	test("right on right-most column should stay at the same location", () => {
		let cursor = new Cursor(0, 8).right();

		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 8);
	});

	test("down should move cursor one line down", () => {
		let cursor = new Cursor(1, 1);
		assert.equal(cursor.position.line, 1);
		assert.equal(cursor.position.character, 1);

		let next = cursor.down();
		assert.equal(next.position.line, 2);
		assert.equal(next.position.character, 1);

		next = next.move();
		assert.equal(next.position.line, 2);
		assert.equal(next.position.character, 1);

		let curPos = Cursor.getActualPosition();
		assert.equal(next.position.line, curPos.line);
		assert.equal(next.position.character, curPos.character);
	});

	test("down on bottom-most line should stay at the same location", () => {
		let cursor = new Cursor(2, 0);
		assert.equal(cursor.position.line, 2);
		assert.equal(cursor.position.character, 0);

		let next = cursor.down();
		assert.equal(next.position.line, 2);
		assert.equal(next.position.character, 0);

		next = next.move();
		assert.equal(next.position.line, 2);
		assert.equal(next.position.character, 0);

		let curPos = Cursor.getActualPosition();
		assert.equal(next.position.line, curPos.line);
		assert.equal(next.position.character, curPos.character);
	});

	test("up should move cursor one line up", () => {
		let cursor = new Cursor(1, 1);
		assert.equal(cursor.position.line, 1);
		assert.equal(cursor.position.character, 1);

		let next = cursor.up();
		assert.equal(next.position.line, 0);
		assert.equal(next.position.character, 1);

		next = next.move();
		assert.equal(next.position.line, 0);
		assert.equal(next.position.character, 1);

		let curPos = Cursor.getActualPosition();
		assert.equal(next.position.line, curPos.line);
		assert.equal(next.position.character, curPos.character);
	});

	test("up on top-most line should stay at the same location", () => {
		let cursor = new Cursor(0, 1);
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 1);

		let next = cursor.up();
		assert.equal(next.position.line, 0);
		assert.equal(next.position.character, 1);

		next = next.move();
		assert.equal(next.position.line, 0);
		assert.equal(next.position.character, 1);

		let curPos = Cursor.getActualPosition();
		assert.equal(next.position.line, curPos.line);
		assert.equal(next.position.character, curPos.character);
	});

	test("keep same column as up/down", () => {
		let cursor = new Cursor(0, 2).down();

		assert.equal(cursor.position.line, 1);
		assert.equal(cursor.position.character, 0);

		cursor = cursor.down();
		assert.equal(cursor.position.line, 2);
		assert.equal(cursor.position.character, 2);
	});

	test("get line begin cursor", () => {
		let cursor = new Cursor(0, 2).lineBegin();
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 0);
	});

	test("get line end cursor", () => {
		let cursor = new Cursor(0, 0).lineEnd();
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, text[0].length);

		cursor = new Cursor(2, 0).lineEnd();
		assert.equal(cursor.position.line, 2);
		assert.equal(cursor.position.character, text[2].length);
	});

	test("get document begin cursor", () => {
		let cursor = new Cursor(1, 1).documentBegin();
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 0);
	});

	test("get document end cursor", () => {
		let cursor = new Cursor(1, 1).documentEnd();
		assert.equal(cursor.position.line, text.length - 1);
		assert.equal(cursor.position.character, text[text.length - 1].length);
	});

	test("wordRight should move cursor word right", () => {
		let cursor = new Cursor(0, 0).wordRight();
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 5);
	});

	test("wordLeft should move cursor word left", () => {
		let cursor = new Cursor(0, 3).wordLeft();
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 0);
	});

	test("wordRight on last word should stay on line at last character", () => {
		let cursor = new Cursor(0, 6).wordRight();
		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 8);
	});

	test("wordRight on end of line should move to next word on next line", () => {
		let cursor = new Cursor(0, 8).wordRight();
		assert.equal(cursor.position.line, 1);
		assert.equal(cursor.position.character, 0);
	});

	test("wordLeft on first word should move to previous line of end of line", () => {
		let cursor = new Cursor(2, 0).wordLeft();
		assert.equal(cursor.position.line, 1);
		assert.equal(cursor.position.character, 1);
	});

	test("get first line begin cursor on first non-blank character", (done) => {
		TextEditor.insert("  ", new vscode.Position(0, 0)).then(() => {
			let cursor = new Cursor(0, 0).firstLineNonBlankChar();
			assert.equal(cursor.position.line, 0);
			assert.equal(cursor.position.character, 2);
		}).then(done, done);
	});

	test("get last line begin cursor on first non-blank character", (done) => {
		let lastLine = new Cursor().documentEnd().position.line;
		TextEditor.insert("  ", new vscode.Position(lastLine, 0)).then(() => {
			let cursor = new Cursor(0, 0).lastLineNonBlankChar();
			assert.equal(cursor.position.line, lastLine);
			assert.equal(cursor.position.character, 2);
		}).then(done, done);
	});
});
