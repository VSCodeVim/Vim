import TextEditor from '../src/textEditor';
import * as vscode from "vscode";
import * as assert from 'assert';
import {join} from 'path';
import * as os from 'os';
import * as fs from 'fs';

function rndName() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}

function createRandomFile(contents = ''): Thenable<vscode.Uri> {
    return new Promise((resolve, reject) => {
        const tmpFile = join(os.tmpdir(), rndName());
        fs.writeFile(tmpFile, contents, (error) => {
            if (error) {
                return reject(error);
            }

            resolve(vscode.Uri.file(tmpFile));
        });
    });
}

export function assertEqualLines(expectedLines : string[]) {
    assert.equal(TextEditor.getLineCount(), expectedLines.length);

    for (let i = 0; i < expectedLines.length; i++) {
        assert.equal(TextEditor.readLine(i), expectedLines[i]);
    }
}


export function setupWorkspace() : Thenable<any> {
    return createRandomFile().then(file => {
        return vscode.workspace.openTextDocument(file).then(doc => {
            return vscode.window.showTextDocument(doc).then(editor => {
                const active = vscode.window.activeTextEditor;
                assert.ok(active);
            });
        });
    });
}

export function cleanUpWorkspace(): Thenable<any> {
    // https://github.com/Microsoft/vscode/blob/master/extensions/vscode-api-tests/src/utils.ts
    return new Promise((c, e) => {
        if (vscode.window.visibleTextEditors.length === 0) {
            return c();
        }

        // TODO: the visibleTextEditors variable doesn't seem to be
        // up to date after a onDidChangeActiveTextEditor event, not
        // even using a setTimeout 0... so we MUST poll :(
        const interval = setInterval(() => {
            if (vscode.window.visibleTextEditors.length > 0) {
                return;
            }

            clearInterval(interval);
            c();
        }, 10);

        vscode.commands.executeCommand('workbench.action.closeAllEditors')
            .then(() => vscode.commands.executeCommand('workbench.files.action.closeAllFiles'))
            .then(null, err => {
                clearInterval(interval);
                e(err);
            });
    }).then(() => {
        assert.equal(vscode.window.visibleTextEditors.length, 0);
        assert(!vscode.window.activeTextEditor);
    });
}