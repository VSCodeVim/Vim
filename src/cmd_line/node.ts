"use strict";

import * as vscode from "vscode";
import * as token from "./token";
import {ModeHandler} from "../mode/modeHandler";

export class LineRange {
  left : token.Token[];
  separator : token.Token;
  right : token.Token[];

  constructor() {
    this.left = [];
    this.right = [];
  }

  addToken(tok : token.Token) : void  {
    if (tok.type === token.TokenType.Comma) {
      this.separator = tok;
      return;
    }

    if (!this.separator) {
      if (this.left.length > 0 && tok.type !== token.TokenType.Offset) {
        // XXX: is this always this error?
        throw Error("not a Vim command");
      }
      this.left.push(tok);
    } else {
      if (this.right.length > 0 && tok.type !== token.TokenType.Offset) {
        // XXX: is this always this error?
        throw Error("not a Vim command");
      }
      this.right.push(tok);
    }
  }

  get isEmpty() : boolean {
    return this.left.length === 0 && this.right.length === 0 && !this.separator;
  }

  toString() : string {
    return this.left.toString() + this.separator.content + this.right.toString();
  }

  execute(document : vscode.TextEditor, modeHandler: ModeHandler) : void {
    if (this.isEmpty) {
      return;
    }
    var lineRef = this.right.length === 0 ? this.left : this.right;
    var pos = this.lineRefToPosition(document, lineRef, modeHandler);
    let vimState = modeHandler.vimState;
    vimState.cursorPosition = vimState.cursorPosition.setLocation(pos.line, pos.character);
    vimState.cursorStartPosition = vimState.cursorPosition;
    modeHandler.updateView(modeHandler.vimState);
  }

  lineRefToPosition(doc : vscode.TextEditor, toks : token.Token[], modeHandler: ModeHandler) : vscode.Position {
    var first = toks[0];
    switch (first.type) {
      case token.TokenType.Dollar:
      case token.TokenType.Percent:
        return new vscode.Position(doc.document.lineCount, 0);
      case token.TokenType.Dot:
        return new vscode.Position(doc.selection.active.line, 0);
      case token.TokenType.LineNumber:
        var line = Number.parseInt(first.content);
        line = Math.max(0, line - 1);
        line = Math.min(doc.document.lineCount, line);
        return new vscode.Position(line, 0);
      case token.TokenType.SelectionFirstLine:
        let startLine = Math.min.apply(null, doc.selections.map(selection =>
          selection.start.isBeforeOrEqual(selection.end) ? selection.start.line : selection.end.line));
        return new vscode.Position(startLine, 0);
      case token.TokenType.SelectionLastLine:
        let endLine = Math.max.apply(null, doc.selections.map(selection =>
          selection.start.isAfter(selection.end) ? selection.start.line : selection.end.line));
        return new vscode.Position(endLine, 0);
      case token.TokenType.Mark:
        return modeHandler.vimState.historyTracker.getMark(first.content).position;
      default:
        throw new Error("not implemented");
    }
  }
}

export class CommandLine {
  range : LineRange;
  command : CommandBase;

  constructor() {
    this.range = new LineRange();
  }

  get isEmpty() : boolean {
    return this.range.isEmpty && !this.command;
  }

  toString() : string {
    return ":" + this.range.toString() + " " + this.command.toString();
  }

  async execute(document : vscode.TextEditor, modeHandler : ModeHandler) : Promise<void> {
    if (!this.command) {
      this.range.execute(document, modeHandler);
      return;
    }

    if (this.range.isEmpty) {
      await this.command.execute(modeHandler);
    } else {
      await this.command.executeWithRange(modeHandler, this.range);
    }

  }
}

export interface ICommandArgs {
  bang? : boolean;
  range? : LineRange;
}

export abstract class CommandBase {

  public neovimCapable = false;
  protected get activeTextEditor() {
    return vscode.window.activeTextEditor;
  }

  get name() : string {
    return this._name;
  }
  protected _name : string;

  get arguments() : ICommandArgs {
    return this._arguments;
  }
  protected _arguments : ICommandArgs;

  abstract execute(modeHandler : ModeHandler) : void;

  executeWithRange(modeHandler : ModeHandler, range: LineRange) : void {
    throw new Error("Not implemented!");
  }
}
