"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as token from '../token';
import { ModeHandler } from "../../mode/modeHandler";
import { TextEditor } from "../../textEditor";
import { Register, RegisterMode } from '../../register/register';
import { Position } from '../../common/motion/position';

export interface IDeleteRangeCommandArguments extends node.ICommandArgs {
  register?: string;
}


export class DeleteRangeCommand extends node.CommandBase {
  protected _arguments : IDeleteRangeCommandArguments;

  constructor(args : IDeleteRangeCommandArguments) {
    super();
    this._name = 'delete';
    this._arguments = args;
  }

  get arguments() : IDeleteRangeCommandArguments{
    return this._arguments;
  }

  async deleteRange(start: Position, end: Position, modeHandler: ModeHandler): Promise<string> {
    start = start.getLineBegin();
    end = end.getLineEnd();
    end = Position.FromVSCodePosition(end.with(end.line, end.character + 1));

    const isOnLastLine = end.line === TextEditor.getLineCount() - 1;

    if (end.character === TextEditor.getLineAt(end).text.length + 1) {
      end = end.getDown(0);
    }

    if (isOnLastLine && start.line !== 0) {
      start = start.getPreviousLineBegin().getLineEnd();
    }

    let text = modeHandler.vimState.editor.document.getText(new vscode.Range(start, end));
    text = text.endsWith("\r\n") ? text.slice(0, -2) : text.slice(0, -1);
    await TextEditor.delete(new vscode.Range(start, end));

    let resultPosition = Position.EarlierOf(start, end);
    if (start.character > TextEditor.getLineAt(start).text.length) {
      resultPosition = start.getLeft();
    } else {
      resultPosition = start;
    }

    resultPosition = resultPosition.getLineBegin();
    modeHandler.vimState.editor.selection = new vscode.Selection(resultPosition, resultPosition);
    return text;
  }

  async execute(modeHandler: ModeHandler): Promise<void> {
    if (!modeHandler.vimState.editor) {
      return;
    }

    let cursorPosition = Position.FromVSCodePosition(modeHandler.vimState.editor.selection.active);
    let text = await this.deleteRange(cursorPosition, cursorPosition, modeHandler);
    Register.putByKey(text, this._arguments.register, RegisterMode.LineWise);
  }

  async executeWithRange(modeHandler : ModeHandler, range: node.LineRange) {
    let start: vscode.Position;
    let end: vscode.Position;

    if (range.left[0].type === token.TokenType.Percent) {
      start = new vscode.Position(0, 0);
      end = new vscode.Position(TextEditor.getLineCount() - 1, 0);
    } else {
      start = range.lineRefToPosition(modeHandler.vimState.editor, range.left, modeHandler);
      end = range.lineRefToPosition(modeHandler.vimState.editor, range.right, modeHandler);
    }

    let text = await this.deleteRange(Position.FromVSCodePosition(start), Position.FromVSCodePosition(end), modeHandler);
    Register.putByKey(text, this._arguments.register, RegisterMode.LineWise);
  }
}
