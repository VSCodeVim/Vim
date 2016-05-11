"use strict";

import * as vscode from "vscode";
import {copy} from "copy-paste";

export class TextEditor {
    static async insert(text: string): Promise<boolean> {
        return vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(vscode.window.activeTextEditor.selection.active, text);
        });
    }

    static async insertAt(text: string, position: vscode.Position): Promise<boolean> {
        return vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(position, text);
        });
    }
    
    static async copy(range: vscode.Range): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const text = vscode.window.activeTextEditor.document.getText(range); 
            copy(text, (err) => {
                (err) ? reject() : resolve()
            });
        });
    }

    static async delete(range: vscode.Range): Promise<boolean> {
        TextEditor.copy(range);
        return vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.delete(range);
        });
    }

    /**
     * Delete the entire document.
     */
    static async deleteDocument(): Promise<boolean> {
        const start    = new vscode.Position(0, 0);
        const lastLine = vscode.window.activeTextEditor.document.lineCount - 1;
        const end      = vscode.window.activeTextEditor.document.lineAt(lastLine).range.end;
        const range    = new vscode.Range(start, end);

        return vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.delete(range);
        });
    }

    static async replace(range: vscode.Range, text: string): Promise<boolean> {
        return vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.replace(range, text);
        });
    }

    static readFile(): string {
        return vscode.window.activeTextEditor.document.getText();
    }

    static readLine(): string {
        const lineNo = vscode.window.activeTextEditor.selection.active.line;

        return vscode.window.activeTextEditor.document.lineAt(lineNo).text;
    }

    static readLineAt(lineNo: number): string {
        if (lineNo === null) {
            lineNo = vscode.window.activeTextEditor.selection.active.line;
        }

        if (lineNo >= vscode.window.activeTextEditor.document.lineCount) {
            throw new RangeError();
        }

        return vscode.window.activeTextEditor.document.lineAt(lineNo).text;
    }

    static getLineCount(): number {
        return vscode.window.activeTextEditor.document.lineCount;
    }

    static getLineAt(position: vscode.Position): vscode.TextLine {
        return vscode.window.activeTextEditor.document.lineAt(position);
    }

    static getSelection(): vscode.Range {
        return vscode.window.activeTextEditor.selection;
    }
    
    static isFirstLine(position : vscode.Position): boolean {
        return position.line === 0;
    }

    static isLastLine(position : vscode.Position): boolean {
        return position.line === (vscode.window.activeTextEditor.document.lineCount - 1);
    }
}

