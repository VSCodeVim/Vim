"use strict";

import * as vscode from "vscode";
import { ModeHandler } from './mode/modeHandler';
import { Position } from './motion/position';

export class TextEditor {
  // TODO: Refactor args

  static async insert(text: string, at: Position | undefined = undefined,
            letVSCodeHandleKeystrokes: boolean | undefined = undefined): Promise<boolean> {
    // If we insert "blah(" with default:type, VSCode will insert the closing ).
    // We *probably* don't want that to happen if we're inserting a lot of text.
    if (letVSCodeHandleKeystrokes === undefined) {
      letVSCodeHandleKeystrokes = text.length === 1;
    }

    if (at) {
      vscode.window.activeTextEditor.selection = new vscode.Selection(at, at);
    }

    if (ModeHandler.IsTesting || !letVSCodeHandleKeystrokes) {
      return vscode.window.activeTextEditor.edit(editBuilder => {
        editBuilder.insert(vscode.window.activeTextEditor.selection.active, text);
      });
    } else {
      await vscode.commands.executeCommand('default:type', { text });
    }

    return true;
  }

  static async insertAt(text: string, position: vscode.Position): Promise<boolean> {
    return vscode.window.activeTextEditor.edit(editBuilder => {
      editBuilder.insert(position, text);
    });
  }

  static async delete(range: vscode.Range): Promise<boolean> {
    return vscode.window.activeTextEditor.edit(editBuilder => {
      editBuilder.delete(range);
    });
  }

  /**
   * Removes all text in the entire document.
   */
  static async deleteDocument(): Promise<boolean> {
    const start  = new vscode.Position(0, 0);
    const lastLine = vscode.window.activeTextEditor.document.lineCount - 1;
    const end    = vscode.window.activeTextEditor.document.lineAt(lastLine).range.end;
    const range  = new vscode.Range(start, end);

    return vscode.window.activeTextEditor.edit(editBuilder => {
      editBuilder.delete(range);
    });
  }

  static async replace(range: vscode.Range, text: string): Promise<boolean> {
    return vscode.window.activeTextEditor.edit(editBuilder => {
      editBuilder.replace(range, text);
    });
  }

  static getAllText(): string {
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

  static getText(selection: vscode.Range): string {
    return vscode.window.activeTextEditor.document.getText(selection);
  }

  static isFirstLine(position : vscode.Position): boolean {
    return position.line === 0;
  }

  static isLastLine(position : vscode.Position): boolean {
    return position.line === (vscode.window.activeTextEditor.document.lineCount - 1);
  }

  static getIndentationLevel(line: string): number {
    let tabSize = vscode.workspace.getConfiguration("editor").get<number>("tabSize");
    let firstNonWhiteSpace = line.match(/^\s*/)[0].length;
    let visibleColumn: number = 0;

    if (firstNonWhiteSpace >= 0) {
      for (const char of line.substring(0, firstNonWhiteSpace)) {
        switch (char) {
          case '\t':
            visibleColumn += tabSize;
            break;
          case ' ':
            visibleColumn += 1;
            break;
          default:
            break;
        }
      }
    } else {
      return -1;
    }

    return visibleColumn;
  }

  static setIndentationLevel(line: string, screenCharacters: number): string {
    let tabSize = <number> vscode.window.activeTextEditor.options.tabSize;
    let insertTabAsSpaces = <boolean> vscode.window.activeTextEditor.options.insertSpaces;

    if (screenCharacters < 0) {
      screenCharacters = 0;
    }

    let indentString = "";

    if (insertTabAsSpaces) {
      indentString += new Array(screenCharacters + 1).join(" ");
    } else {
      if (screenCharacters / tabSize > 0) {
        indentString += new Array(Math.floor(screenCharacters / tabSize) + 1).join("\t");
      }

      indentString += new Array(screenCharacters % tabSize + 1).join(" ");
    }

    let firstNonWhiteSpace = line.match(/^\s*/)[0].length;
    return indentString + line.substring(firstNonWhiteSpace, line.length);
  }
}

