import { ErrorCode, VimError } from '../error';
import { VimState } from '../state/vimState';
import { TokenType, Token } from './token';

type LineRefOperation = TokenType.Plus | TokenType.Minus;

/**
 * Represents a range of lines, as expressed on the command line.
 *
 * http://vimdoc.sourceforge.net/htmldoc/cmdline.html#cmdline-ranges
 */
export class LineRange {
  left: Token[];
  separator: Token | undefined;
  right: Token[];

  constructor() {
    this.left = [];
    this.right = [];
  }

  public addToken(tok: Token): void {
    if (tok.type === TokenType.Comma) {
      this.separator = tok;
      return;
    }

    if (!this.separator) {
      if (this.left.length > 0) {
        switch (tok.type) {
          case TokenType.Offset:
          case TokenType.Plus:
          case TokenType.Minus:
            break;
          default:
            throw Error('Trailing characters');
        }
      }
      this.left.push(tok);
    } else {
      if (this.right.length > 0) {
        switch (tok.type) {
          case TokenType.Offset:
          case TokenType.Plus:
          case TokenType.Minus:
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

  public toString(): string {
    return this.left.toString() + (this.separator?.content ?? '') + this.right.toString();
  }

  /**
   * Resolves the line range to concrete line numbers
   *
   * @param vimState
   * @returns Inclusive line number range [start, end]. Will always be in order.
   */
  public resolve(vimState: VimState, boundsCheck: boolean = true): [number, number] {
    if (this.left.length > 0 && this.left[0].type === TokenType.Percent) {
      return [0, vimState.document.lineCount - 1];
    }

    const start =
      LineRange.resolveLineRef(this.left, vimState, boundsCheck) ??
      vimState.cursorStopPosition.line;
    const end = LineRange.resolveLineRef(this.right, vimState, boundsCheck) ?? start;
    return end < start ? [end, start] : [start, end];
  }

  private static resolveLineRef(
    toks: Token[],
    vimState: VimState,
    boundsCheck: boolean
  ): number | undefined {
    if (toks.length === 0) {
      return undefined;
    }

    let currentLineNum: number;
    let currentOperation: LineRefOperation | undefined;

    const firstToken = toks[0];
    // handle first-token special cases (e.g. %, inital line number is "." by default)
    switch (firstToken.type) {
      case TokenType.Percent:
        return vimState.document.lineCount - 1;
      case TokenType.Dollar:
        currentLineNum = vimState.document.lineCount - 1;
        break;
      case TokenType.Plus:
      case TokenType.Minus:
      case TokenType.Dot:
        currentLineNum = vimState.editor.selection.active.line;
        // undocumented: if the first token is plus or minus, vim seems to behave as though there was a "."
        currentOperation = firstToken.type === TokenType.Dot ? undefined : firstToken.type;
        break;
      case TokenType.LineNumber:
        currentLineNum = Number.parseInt(firstToken.content, 10) - 1; // user sees 1-based - everything else is 0-based
        break;
      case TokenType.SelectionFirstLine:
        currentLineNum = Math.min.apply(
          null,
          vimState.editor.selections.map((selection) =>
            selection.start.isBeforeOrEqual(selection.end)
              ? selection.start.line
              : selection.end.line
          )
        );
        break;
      case TokenType.SelectionLastLine:
        currentLineNum = Math.max.apply(
          null,
          vimState.editor.selections.map((selection) =>
            selection.start.isAfter(selection.end) ? selection.start.line : selection.end.line
          )
        );
        break;
      case TokenType.Mark:
        currentLineNum = vimState.historyTracker.getMark(firstToken.content)!.position.line;
        break;
      default:
        throw new Error('Not Implemented');
    }

    // now handle subsequent tokens, offsetting the current candidate line number
    for (let tokenIndex = 1; tokenIndex < toks.length; ++tokenIndex) {
      const currentToken = toks[tokenIndex];

      switch (currentOperation) {
        case TokenType.Plus:
          switch (currentToken.type) {
            case TokenType.Minus:
            case TokenType.Plus:
              // undocumented: when there's two operators in a row, vim behaves as though there's a "1" between them
              currentLineNum += 1;
              currentOperation = currentToken.type;
              break;
            case TokenType.Offset:
              currentLineNum += Number.parseInt(currentToken.content, 10);
              currentOperation = undefined;
              break;
            default:
              throw Error('Trailing characters');
          }
          break;
        case TokenType.Minus:
          switch (currentToken.type) {
            case TokenType.Minus:
            case TokenType.Plus:
              // undocumented: when there's two operators in a row, vim behaves as though there's a "1" between them
              currentLineNum -= 1;
              currentOperation = currentToken.type;
              break;
            case TokenType.Offset:
              currentLineNum -= Number.parseInt(currentToken.content, 10);
              currentOperation = undefined;
              break;
            default:
              throw Error('Trailing characters');
          }
          break;
        case undefined:
          switch (currentToken.type) {
            case TokenType.Minus:
            case TokenType.Plus:
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
      case TokenType.Plus:
        currentLineNum += 1;
        break;
      case TokenType.Minus:
        currentLineNum -= 1;
        break;
    }

    if (boundsCheck) {
      currentLineNum = Math.max(0, currentLineNum);
      currentLineNum = Math.min(vimState.document.lineCount - 1, currentLineNum);
    }

    return currentLineNum;
  }
}

export class CommandLine {
  range: LineRange;
  command: CommandBase | undefined;

  constructor() {
    this.range = new LineRange();
  }

  get isEmpty(): boolean {
    return this.range.isEmpty && !this.command;
  }

  toString(): string {
    return ':' + this.range.toString() + ' ' + (this.command?.toString() ?? '');
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.command) {
      if (this.range.isEmpty) {
        await this.command.execute(vimState);
      } else if (this.command.acceptsRange) {
        await this.command.executeWithRange(vimState, this.range);
      } else {
        throw VimError.fromCode(ErrorCode.NoRangeAllowed);
      }
    } else {
      const [_, end] = this.range.resolve(vimState);
      vimState.cursorStartPosition = vimState.cursorStopPosition = vimState.cursorStopPosition
        .withLine(end)
        .obeyStartOfLine(vimState.document);
    }
  }
}

export interface ICommandArgs {
  bang?: boolean;
  range?: LineRange;
}

export abstract class CommandBase {
  /**
   * If false, trying to use this command with a range will throw E481 ("No range allowed")
   */
  public readonly acceptsRange: boolean = true;

  public neovimCapable(): boolean {
    return false;
  }

  abstract execute(vimState: VimState): Promise<void>;

  async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    // By default, ignore the given range.
    await this.execute(vimState);
  }
}
