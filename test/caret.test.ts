import * as assert from 'assert';
import * as vscode from 'vscode';
import TextEditor from './../src/textEditor';
import Caret from './../src/cursor/caret';

suite("caret", () => {
	let text: Array<string> = [
		"mary had",
		"a",
		"little lamb"
	];

	setup(done => {
		TextEditor.insert(text.join('\n')).then(() => done());
	});

	teardown(done => {
		let range = new vscode.Range(Caret.documentBegin(), Caret.documentEnd());
		TextEditor.delete(range).then(() => done());
	});
	
	test("right on right-most column should stay at the same location", () => {
		Caret.move(new vscode.Position(0, 7));

		let current = Caret.currentPosition();
		assert.equal(current.line, 0);
		assert.equal(current.character, 7);

		let right = Caret.right();
		assert.equal(right.line, 0);
		assert.equal(right.character, 7);
	});
});