"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as token from "../token";
import { ModeHandler } from "../../mode/modeHandler";
import { TextEditor } from "../../textEditor";

export interface ISortCommandArguments extends node.ICommandArgs {
  reverse: boolean;
}


export class SortCommand extends node.CommandBase {

  protected _arguments : ISortCommandArguments;

  constructor(args: ISortCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments() : ISortCommandArguments {
    return this._arguments;
  }

  async execute(modeHandler : ModeHandler): Promise<void> {
    await this.sortLines(new vscode.Position(0, 0), new vscode.Position(TextEditor.getLineCount() - 1, 0));
  }

  async sortLines(startLine: vscode.Position, endLine: vscode.Position) {
    let originalLines: String[] = [];

    for (let currentLine = startLine.line; currentLine <= endLine.line && currentLine < TextEditor.getLineCount(); currentLine++) {
      originalLines.push(TextEditor.readLineAt(currentLine));
    }

    let lastLineLength = originalLines[originalLines.length - 1].length;
    let sortedLines = originalLines.sort();

    if (this._arguments.reverse) {
      sortedLines.reverse();
    }

    let sortedContent = sortedLines.join("\n");

    await TextEditor.replace(new vscode.Range(startLine.line, 0, endLine.line, lastLineLength), sortedContent);
  }

  async executeWithRange(modeHandler : ModeHandler, range: node.LineRange) {
    let startLine: vscode.Position;
    let endLine: vscode.Position;

    if (range.left[0].type === token.TokenType.Percent) {
      startLine = new vscode.Position(0, 0);
      endLine = new vscode.Position(TextEditor.getLineCount() - 1, 0);
    } else {
      startLine = range.lineRefToPosition(vscode.window.activeTextEditor, range.left, modeHandler);
      endLine = range.lineRefToPosition(vscode.window.activeTextEditor, range.right, modeHandler);
    }

    await this.sortLines(startLine, endLine);
  }
}
