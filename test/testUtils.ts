"use strict";

import {TextEditor} from '../src/textEditor';
import * as vscode from "vscode";
import * as assert from 'assert';
import {join} from 'path';
import * as os from 'os';
import * as fs from 'fs';

function rndName() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}

async function createRandomFile(contents: string): Promise<vscode.Uri> {
    const tmpFile = join(os.tmpdir(), rndName());
    
    try {
        fs.writeFileSync(tmpFile, contents);
        return vscode.Uri.file(tmpFile);
    } catch (error) {
        throw error;
    }
}

export function assertEqualLines(expectedLines: string[]) {
    assert.equal(TextEditor.getLineCount(), expectedLines.length);

    for (let i = 0; i < expectedLines.length; i++) {
        assert.equal(TextEditor.readLineAt(i), expectedLines[i]);
    }
}

export async function setupWorkspace(): Promise<any> {
    const file   = await createRandomFile("");
    const doc    = await vscode.workspace.openTextDocument(file);

    await vscode.window.showTextDocument(doc);

    assert.ok(vscode.window.activeTextEditor);
}

export async function cleanUpWorkspace(): Promise<any> {
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