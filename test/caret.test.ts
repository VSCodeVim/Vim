import * as assert from 'assert';
import TextEditor from './../src/textEditor';
import {Caret} from './../src/motion/motion';

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
		TextEditor.delete().then(() => done());
	});

	test("right on right-most column should stay at the same location", () => {
		let cursor = new Caret(0, 7).right();

		assert.equal(cursor.position.line, 0);
		assert.equal(cursor.position.character, 7);
	});
});
