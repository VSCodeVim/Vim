import * as vscode from 'vscode';
import TextEditor from '../src/textEditor';
import Cursor from '../src/cursor';
import * as assert from 'assert';

export function clearTextEditor(): Thenable<void> {
	let range = new vscode.Range(Cursor.documentBegin(), Cursor.documentEnd());
	return TextEditor.delete(range).then(() => {
		return;
	});
}

export function assertTextEditorText(expected: string, lineNo?: number) {
	let actual: string;
	if (isNaN(lineNo) || typeof lineNo === 'undefined') {
		actual = TextEditor.readFile();
	} else {
		actual = TextEditor.readLine(lineNo);
	}

	assert.equal(actual, expected);
}
