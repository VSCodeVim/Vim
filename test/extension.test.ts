// For documentation on the test framework see https://mochajs.org/.

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

import * as myExtension from '../extension';

suite("Extension tests", () => {

    test("dummy", () => {
        assert.equal(0, 0);
    });
});
