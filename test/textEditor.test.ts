import * as assert from 'assert';
import * as vscode from 'vscode';
import TextEditor from './../src/textEditor';
import {setupWorkspace, cleanUpWorkspace} from './testUtils';

suite("text editor", () => {
    suiteSetup(setupWorkspace);

    suiteTeardown(cleanUpWorkspace);

    test("insert 'Hello World'", () => {
        let expectedText = "Hello World";

        return TextEditor.insert(expectedText).then(x => {
            assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);
            let actualText = TextEditor.readLine(0);
            assert.equal(actualText, expectedText);
        });
    });

    test("replace 'World' with 'Foo Bar'", () => {
        let newText = "Foo Bar";
        let start = new vscode.Position(0, 6);
        let end = new vscode.Position(0, 11);
        let range : vscode.Range = new vscode.Range(start, end);

        return TextEditor.replace(range, newText).then( x => {
            assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);

            let actualText = TextEditor.readLine(0);
            assert.equal(actualText, "Hello Foo Bar");
        });
    });

    test("delete `Hello`", () => {
        assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);

        var end = new vscode.Position(0, 5);
        var range = new vscode.Range(new vscode.Position(0, 0), end);

        return TextEditor.delete(range).then( x => {
            let actualText = TextEditor.readLine(0);
            assert.equal(actualText, " Foo Bar");
        });
    });

    test("delete the whole line", () => {
        assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);

        var range = vscode.window.activeTextEditor.document.lineAt(0).range;

        return TextEditor.delete(range).then(x => {
            let actualText = TextEditor.readLine(0);
            assert.equal(actualText, "");
        });
    });

    test("try to read lines that don't exist", () => {
        assert.equal(vscode.window.activeTextEditor.document.lineCount, 1);
        assert.throws(() => TextEditor.readLine(1), RangeError);
        assert.throws(() => TextEditor.readLine(2), RangeError);
    });
});
