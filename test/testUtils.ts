import TextEditor from '../src/textEditor';
import * as assert from 'assert';

export function assertTextEditorText(expected: string, lineNo?: number) {
	let actual: string;
	if (isNaN(lineNo) || typeof lineNo === 'undefined') {
		actual = TextEditor.readFile();
	} else {
		actual = TextEditor.readLine(lineNo);
	}

	assert.equal(actual, expected);
}
