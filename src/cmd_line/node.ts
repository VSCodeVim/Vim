import * as token from './token';
import * as vscode from 'vscode';
import { Position } from '../common/motion/position';
import { VimState } from '../state/vimState';

type LineRefOperation = token.TokenType.Plus | token.TokenType.Minus | undefined;

export class LineRange {
  left: token.Token[];
  separator: token.Token;
  right: token.Token[];

  constructor() {
    this.left = [];
    this.right = [];
  }

  addToken(tok: token.Token): void {
    if (tok.type === token.TokenType.Comma) {
      this.separator = tok;
      return;
    }

    if (!this.separator) {
      if (this.left.length > 0) {
        switch (tok.type) {
          case token.TokenType.Offset:
          case token.TokenType.Plus:
          case token.TokenType.Minus:
            break;
          default:
            throw Error('Trailing characters');
        }
      }
      this.left.push(tok);
    } else {
      if (this.right.length > 0) {
        switch (tok.type) {
          case token.TokenType.Offset:
          case token.TokenType.Plus:
          case token.TokenType.Minus:
            break;
          default:
            throw Error('Trailing characters');
        }
      }
      this.right.push(tok);
    }
  }

  get isEmpty(): boolean {
    return this.left.length === 0 && this.right.length === 0 && !this.separator;
  }

  toString(): string {
    return this.left.toString() + this.separator.content + this.right.toString();
  }

  execute(document: vscode.TextEditor, vimState: VimState): void {
    if (this.isEmpty) {
      return;
    }
    const lineRef = this.right.length === 0 ? this.left : this.right;
    const pos = this.lineRefToPosition(document, lineRef, vimState);
    vimState.cursorStartPosition = vimState.cursorStopPosition = Position.FromVSCodePosition(pos);
  }

  lineRefToPosition(
    doc: vscode.TextEditor,
    toks: token.Token[],
    vimState: VimState
  ): vscode.Position {
    let currentLineNum: number;
    let currentColumn = 0; // only mark does this differently
    let currentOperation: LineRefOperation = undefined;

    const firstToken = toks[0];
    // handle first-token special cases (e.g. %, inital line number is "." by default)
    switch (firstToken.type) {
      case token.TokenType.Percent:
        return new vscode.Position(doc.document.lineCount - 1, 0);
      case token.TokenType.Dollar:
        currentLineNum = doc.document.lineCount - 1;
        break;
      case token.TokenType.Plus:
      case token.TokenType.Minus:
      case token.TokenType.Dot:
        currentLineNum = doc.selection.active.line;
        // undocumented: if the first token is plus or minus, vim seems to behave as though there was a "."
        currentOperation = firstToken.type === token.TokenType.Dot ? undefined : firstToken.type;
        break;
      case token.TokenType.LineNumber:
        currentLineNum = Number.parseInt(firstToken.content, 10) - 1; // user sees 1-based - everything else is 0-based
        break;
      case token.TokenType.SelectionFirstLine:
        currentLineNum = Math.min.apply(
          null,
          doc.selections.map(selection =>
            selection.start.isBeforeOrEqual(selection.end)
              ? selection.start.line
              : selection.end.line
          )
        );
        break;
      case token.TokenType.SelectionLastLine:
        currentLineNum = Math.max.apply(
          null,
          doc.selections.map(selection =>
            selection.start.isAfter(selection.end) ? selection.start.line : selection.end.line
          )
        );
        break;
      case token.TokenType.Mark:
        currentLineNum = vimState.historyTracker.getMark(firstToken.content).position.line;
        currentColumn = vimState.historyTracker.getMark(firstToken.content).position.character;
        break;
      default:
        throw new Error('Not Implemented');
    }

    // now handle subsequent tokens, offsetting the current candidate line number
    for (let tokenIndex = 1; tokenIndex < toks.length; ++tokenIndex) {
      let currentToken = toks[tokenIndex];

      switch (currentOperation) {
        case token.TokenType.Plus:
          switch (currentToken.type) {
            case token.TokenType.Minus:
            case token.TokenType.Plus:
              // undocumented: when there's two operators in a row, vim behaves as though there's a "1" between them
              currentLineNum += 1;
              currentColumn = 0;
              currentOperation = currentToken.type;
              break;
            case token.TokenType.Offset:
              currentLineNum += Number.parseInt(currentToken.content, 10);
              currentColumn = 0;
              currentOperation = undefined;
              break;
            default:
              throw Error('Trailing characters');
          }
          break;
        case token.TokenType.Minus:
          switch (currentToken.type) {
            case token.TokenType.Minus:
            case token.TokenType.Plus:
              // undocumented: when there's two operators in a row, vim behaves as though there's a "1" between them
              currentLineNum -= 1;
              currentColumn = 0;
              currentOperation = currentToken.type;
              break;
            case token.TokenType.Offset:
              currentLineNum -= Number.parseInt(currentToken.content, 10);
              currentColumn = 0;
              currentOperation = undefined;
              break;
            default:
              throw Error('Trailing characters');
          }
          break;
        case undefined:
          switch (currentToken.type) {
            case token.TokenType.Minus:
            case token.TokenType.Plus:
              currentOperation = currentToken.type;
              break;
            default:
              throw Error('Trailing characters');
          }
          break;
      }
    }

    // undocumented: when there's a trailing operation in the tank without an RHS, vim uses "1"
    switch (currentOperation) {
      case token.TokenType.Plus:
        currentLineNum += 1;
        currentColumn = 0;
        break;
      case token.TokenType.Minus:
        currentLineNum -= 1;
        currentColumn = 0;
        break;
    }

    // finally, make sure current position is in bounds :)
    currentLineNum = Math.max(0, currentLineNum);
    currentLineNum = Math.min(doc.document.lineCount - 1, currentLineNum);
    return new vscode.Position(currentLineNum, currentColumn);
  }
}

export class CommandLine {
  range: LineRange;
  command: CommandBase;

  constructor() {
    this.range = new LineRange();
  }

  get isEmpty(): boolean {
    return this.range.isEmpty && !this.command;
  }

  toString(): string {
    return ':' + this.range.toString() + ' ' + this.command.toString();
  }

  async execute(document: vscode.TextEditor, vimState: VimState): Promise<void> {
    if (!this.command) {
      this.range.execute(document, vimState);
      return;
    }

    if (this.range.isEmpty) {
      await this.command.execute(vimState);
    } else {
      await this.command.executeWithRange(vimState, this.range);
    }
  }
}

export interface ICommandArgs {
  bang?: boolean;
  range?: LineRange;
}

export abstract class CommandBase {
  protected get activeTextEditor() {
    return vscode.window.activeTextEditor;
  }

  get name(): string {
    return this._name;
  }
  protected _name: string;

  get arguments(): ICommandArgs {
    return this._arguments;
  }
  protected _arguments: ICommandArgs;

  public neovimCapable(): boolean {
    return false;
  }

  abstract execute(vimState: VimState): Promise<void>;

  executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    throw new Error('Not implemented!');
  }
}
