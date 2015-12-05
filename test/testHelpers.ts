import TextEditor from '../src/textEditor';
import * as assert from 'assert';

export default class TestHelpers {

	public static assertEqualLines(expectedLines : string[]) {
		assert.equal(TextEditor.getLineCount(), expectedLines.length);

		for (let i = 0; i < expectedLines.length; i++) {
			assert.equal(TextEditor.readLine(i), expectedLines[i]);
		}
	}

}