'use strict';

import * as vscode from 'vscode';
import { Position, PositionDiff } from './common/motion/position';
import { Globals } from './globals';

export class TextEditor {
  // TODO: Refactor args

  /**
   * Do not use this method! It has been deprecated. Use InsertTextTransformation
   * (or possibly InsertTextVSCodeTransformation) instead.
   */
  static async insert(
    text: string,
    at: Position | undefined = undefined,
    letVSCodeHandleKeystrokes: boolean | undefined = undefined
  ): Promise<boolean> {
    // If we insert "blah(" with default:type, VSCode will insert the closing ).
    // We *probably* don't want that to happen if we're inserting a lot of text.
    if (letVSCodeHandleKeystrokes === undefined) {
      letVSCodeHandleKeystrokes = text.length === 1;
    }

    if (!letVSCodeHandleKeystrokes) {
      // const selections = vscode.window.activeTextEditor!.selections.slice(0);

      await vscode.window.activeTextEditor!.edit(editBuilder => {
        if (!at) {
          at = Position.FromVSCodePosition(vscode.window.activeTextEditor!.selection.active);
        }

        editBuilder.insert(at!, text);
      });

      // maintain all selections in multi-cursor mode.
      // vscode.window.activeTextEditor!.selections = selections;
    } else {
      await vscode.commands.executeCommand('default:type', { text });
    }

    return true;
  }

  static async insertAt(text: string, position: vscode.Position): Promise<boolean> {
    return vscode.window.activeTextEditor!.edit(editBuilder => {
      editBuilder.insert(position, text);
    });
  }

  static async delete(range: vscode.Range): Promise<boolean> {
    return vscode.window.activeTextEditor!.edit(editBuilder => {
      editBuilder.delete(range);
    });
  }

  static getDocumentVersion(): number {
    return vscode.window.activeTextEditor!.document.version;
  }

  static getDocumentName(): String {
    return vscode.window.activeTextEditor!.document.fileName;
  }

  /**
   * Removes all text in the entire document.
   */
  static async deleteDocument(): Promise<boolean> {
    const start = new vscode.Position(0, 0);
    const lastLine = vscode.window.activeTextEditor!.document.lineCount - 1;
    const end = vscode.window.activeTextEditor!.document.lineAt(lastLine).range.end;
    const range = new vscode.Range(start, end);

    return vscode.window.activeTextEditor!.edit(editBuilder => {
      editBuilder.delete(range);
    });
  }

  /**
   * Do not use this method! It has been deprecated. Use ReplaceTextTransformation.
   * instead.
   */
  static async replace(range: vscode.Range, text: string): Promise<boolean> {
    return vscode.window.activeTextEditor!.edit(editBuilder => {
      editBuilder.replace(range, text);
    });
  }

  static readLine(): string {
    const lineNo = vscode.window.activeTextEditor!.selection.active.line;

    return vscode.window.activeTextEditor!.document.lineAt(lineNo).text;
  }

  static readLineAt(lineNo: number): string {
    if (lineNo === null) {
      lineNo = vscode.window.activeTextEditor!.selection.active.line;
    }

    if (lineNo >= vscode.window.activeTextEditor!.document.lineCount) {
      throw new RangeError();
    }

    return vscode.window.activeTextEditor!.document.lineAt(lineNo).text;
  }

  static getLineCount(): number {
    return vscode.window.activeTextEditor!.document.lineCount;
  }

  static getLineAt(position: vscode.Position): vscode.TextLine {
    return vscode.window.activeTextEditor!.document.lineAt(position);
  }

  static getCharAt(position: Position): string {
    const line = TextEditor.getLineAt(position);

    return line.text[position.character];
  }

  static getLineMaxColumn(lineNumber: number): number {
    if (lineNumber < 0 || lineNumber > TextEditor.getLineCount()) {
      throw new Error('Illegal value ' + lineNumber + ' for `lineNumber`');
    }

    return TextEditor.readLineAt(lineNumber).length;
  }

  static getSelection(): vscode.Range {
    return vscode.window.activeTextEditor!.selection;
  }

  static getText(selection?: vscode.Range): string {
    return vscode.window.activeTextEditor!.document.getText(selection);
  }

  /**
   *  Retrieves the current word at position.
   *  If current position is whitespace, selects the right-closest word
   */
  static getWord(position: Position): string | undefined {
    let start = position;
    let end = position.getRight();

    const char = TextEditor.getText(new vscode.Range(start, end));
    if (Globals.WhitespaceRegExp.test(char)) {
      start = position.getWordRight();
    } else {
      start = position.getWordLeft(true);
    }
    end = start.getCurrentWordEnd(true).getRight();

    const word = TextEditor.getText(new vscode.Range(start, end));

    if (Globals.WhitespaceRegExp.test(word)) {
      return undefined;
    }

    return word;
  }

  static isFirstLine(position: vscode.Position): boolean {
    return position.line === 0;
  }

  static isLastLine(position: vscode.Position): boolean {
    return position.line === vscode.window.activeTextEditor!.document.lineCount - 1;
  }

  static getPositionAt(offset: number): Position {
    const pos = vscode.window.activeTextEditor!.document.positionAt(offset);

    return new Position(pos.line, pos.character);
  }

  static getOffsetAt(position: Position): number {
    return vscode.window.activeTextEditor!.document.offsetAt(position);
  }
}

/**
 * Directions in the view for editor scroll command.
 */
export type EditorScrollDirection = 'up' | 'down';

/**
 * Units for editor scroll 'by' argument
 */
export type EditorScrollByUnit = 'line' | 'wrappedLine' | 'page' | 'halfPage';

/**
 * Values for reveal line 'at' argument
 */
export type RevealLineAtArgument = 'top' | 'center' | 'bottom';
/**
 * Positions in the view for cursor move command.
 */
export type CursorMovePosition =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'wrappedLineStart'
  | 'wrappedLineFirstNonWhitespaceCharacter'
  | 'wrappedLineColumnCenter'
  | 'wrappedLineEnd'
  | 'wrappedLineLastNonWhitespaceCharacter'
  | 'viewPortTop'
  | 'viewPortCenter'
  | 'viewPortBottom'
  | 'viewPortIfOutside';

/**
 * Units for Cursor move 'by' argument
 */
export type CursorMoveByUnit = 'line' | 'wrappedLine' | 'character' | 'halfLine';
