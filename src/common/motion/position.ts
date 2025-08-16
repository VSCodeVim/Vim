import * as vscode from 'vscode';

import { configuration } from './../../configuration/configuration';
import { TextEditor } from './../../textEditor';
import { clamp } from '../../util/util';
import { getSentenceBegin, getSentenceEnd } from '../../textobject/sentence';
import {
  WordType,
  nextWordEnd,
  prevWordEnd,
  prevWordStart,
  nextWordStart,
} from '../../textobject/word';
import { Position } from 'vscode';

/**
 * Controls how a PositionDiff affects the Position it's applied to.
 */
enum PositionDiffType {
  /** Sets both the line and character exactly */
  ExactPosition,
  /** Offsets both the line and character */
  Offset,
  /** Offsets the line and sets the column exactly */
  ExactCharacter,
  /** Brings the Position to the beginning of the line if `vim.startofline` is true */
  ObeyStartOfLine,
  /** Brings the Position to the end of the line */
  EndOfLine,
}

/**
 * Represents a difference between two Positions.
 * Add it to a Position to get another Position.
 */
export class PositionDiff {
  public readonly line: number;
  public readonly character: number;
  public readonly type: PositionDiffType;

  private constructor(type: PositionDiffType, line: number, character: number) {
    this.type = type;
    this.line = line;
    this.character = character;
  }

  /** Has no effect */
  public static identity(): PositionDiff {
    return PositionDiff.offset({ line: 0, character: 0 });
  }

  /** Offsets both the Position's line and character */
  public static offset({ line = 0, character = 0 }): PositionDiff {
    return new PositionDiff(PositionDiffType.Offset, line, character);
  }

  /** Sets the Position's line and character exactly */
  public static exactPosition(position: Position): PositionDiff {
    return new PositionDiff(PositionDiffType.ExactPosition, position.line, position.character);
  }

  /** Brings the Position to the beginning of the line if `vim.startofline` is true */
  public static startOfLine(): PositionDiff {
    return new PositionDiff(PositionDiffType.ObeyStartOfLine, 0, 0);
  }

  /** Brings the Position to the end of the line */
  public static endOfLine(): PositionDiff {
    return new PositionDiff(PositionDiffType.EndOfLine, 0, 0);
  }

  /** Offsets the Position's line and sets its character exactly */
  public static exactCharacter({
    lineOffset,
    character,
  }: {
    lineOffset?: number;
    character: number;
  }): PositionDiff {
    return new PositionDiff(PositionDiffType.ExactCharacter, lineOffset ?? 0, character);
  }

  public toString(): string {
    switch (this.type) {
      case PositionDiffType.Offset:
        return `[ Diff: Offset ${this.line} ${this.character} ]`;
      case PositionDiffType.ExactCharacter:
        return `[ Diff: ExactCharacter ${this.line} ${this.character} ]`;
      case PositionDiffType.ExactPosition:
        return `[ Diff: ExactPosition ${this.line} ${this.character} ]`;
      case PositionDiffType.ObeyStartOfLine:
        return `[ Diff: ObeyStartOfLine ${this.line} ]`;
      case PositionDiffType.EndOfLine:
        return `[ Diff: EndOfLine ${this.line} ]`;
      default:
        const guard: never = this.type;
        throw new Error(`Unknown PositionDiffType: ${this.type}`);
    }
  }
}

/**
 * @returns the Position of the 2 provided which comes earlier in the document.
 */
export function earlierOf(p1: Position, p2: Position): Position {
  return p1.isBefore(p2) ? p1 : p2;
}

/**
 * @returns the Position of the 2 provided which comes later in the document.
 */
export function laterOf(p1: Position, p2: Position): Position {
  return p1.isBefore(p2) ? p2 : p1;
}

/**
 * @returns the given Positions in the order they appear in the document.
 */
export function sorted(p1: Position, p2: Position): [Position, Position] {
  return p1.isBefore(p2) ? [p1, p2] : [p2, p1];
}

declare module 'vscode' {
  interface Position {
    toString(): string;

    add(document: vscode.TextDocument, diff: PositionDiff, boundsCheck?: boolean): Position;
    subtract(other: Position): PositionDiff;

    /**
     * @returns a new Position with the same line and the given character.
     * Does bounds-checking to make sure the result is valid.
     * @deprecated use `Position.with` instead
     */
    withColumn(column: number): Position;

    /**
     * @returns the Position `count` characters to the left of this Position. Does not go over line breaks.
     */
    getLeft(count?: number): Position;
    /**
     * @returns the Position `count` characters to the right of this Position. Does not go over line breaks.
     */
    getRight(count?: number): Position;
    /**
     * @returns the Position `count` lines down from this Position
     */
    getDown(count?: number): Position;
    /**
     * @returns the Position `count` lines up from this Position
     */
    getUp(count?: number): Position;

    getLeftThroughLineBreaks(includeEol?: boolean): Position;
    getRightThroughLineBreaks(includeEol?: boolean): Position;
    getOffsetThroughLineBreaks(offset: number): Position;

    /**
     * @returns the start of the first word to the left of the current position, like `b`
     *
     * @param wordType how word boundaries are determined
     * @param inclusive if true, returns the current position if it's at the start of a word
     */
    prevWordStart(
      document: vscode.TextDocument,
      args?: { wordType?: WordType; inclusive?: boolean },
    ): Position;

    /**
     * @returns the start of the first word to the right of the current position, like `w`
     *
     * @param wordType how word boundaries are determined
     * @param inclusive if true, returns the current position if it's at the start of a word
     */
    nextWordStart(
      document: vscode.TextDocument,
      args?: { wordType?: WordType; inclusive?: boolean },
    ): Position;

    /**
     * @returns the end of the first word to the left of the current position, like `ge`
     *
     * @param wordType how word boundaries are determined
     */
    prevWordEnd(document: vscode.TextDocument, args?: { wordType?: WordType }): Position;

    /**
     * @returns the end of the first word to the right of the current position, like `e`
     *
     * @param wordType how word boundaries are determined
     * @param inclusive if true, returns the current position if it's at the end of a word
     */
    nextWordEnd(
      document: vscode.TextDocument,
      args?: { wordType?: WordType; inclusive?: boolean },
    ): Position;

    getSentenceBegin(args: { forward: boolean }): Position;
    getSentenceEnd(): Position;

    getLineBegin(): Position;

    /**
     * @returns the beginning of the line, excluding preceeding whitespace.
     * This respects the `autoindent` setting, and returns `getLineBegin()` if auto-indent is disabled.
     */
    getLineBeginRespectingIndent(document: vscode.TextDocument): Position;

    /**
     * @returns a new Position at the end of this position's line.
     */
    getLineEnd(): Position;

    /**
     * @returns a new Position at the end of this Position's line, including the invisible newline character.
     */
    getLineEndIncludingEOL(): Position;

    /**
     * @returns a new Position one to the left if this Position is on the EOL. Otherwise, returns this position.
     */
    getLeftIfEOL(): Position;

    /**
     * @returns the position that the cursor would be at if you pasted *text* at the current position.
     */
    advancePositionByText(text: string): Position;

    /**
     * Is this position at the beginning of the line?
     */
    isLineBeginning(): boolean;

    /**
     * Is this position at the end of the line?
     */
    isLineEnd(document: vscode.TextDocument): boolean;

    isFirstWordOfLine(document: vscode.TextDocument): boolean;

    isAtDocumentBegin(): boolean;

    isAtDocumentEnd(document: vscode.TextDocument): boolean;

    /**
     * Returns whether the current position is in the leading whitespace of a line
     */
    isInLeadingWhitespace(document: vscode.TextDocument): boolean;

    /**
     * If `vim.startofline` is set, get first non-blank character's position.
     */
    obeyStartOfLine(document: vscode.TextDocument): Position;

    isValid(textEditor: vscode.TextEditor): boolean;
  }
}

Position.prototype.toString = function (this: Position) {
  return `[${this.line}, ${this.character}]`;
};

Position.prototype.add = function (
  this: Position,
  document: vscode.TextDocument,
  diff: PositionDiff,
  boundsCheck = true,
): Position {
  if (diff.type === PositionDiffType.ExactPosition) {
    return new Position(diff.line, diff.character);
  }

  const resultLine = clamp(this.line + diff.line, 0, document.lineCount - 1);

  let resultChar: number;
  if (diff.type === PositionDiffType.Offset) {
    resultChar = this.character + diff.character;
  } else if (diff.type === PositionDiffType.ExactCharacter) {
    resultChar = diff.character;
  } else if (diff.type === PositionDiffType.ObeyStartOfLine) {
    resultChar = this.obeyStartOfLine(document).character;
  } else if (diff.type === PositionDiffType.EndOfLine) {
    resultChar = this.getLineEnd().character;
  } else {
    throw new Error(`Unknown PositionDiffType: ${diff.type}`);
  }

  const pos = new Position(resultLine, Math.max(resultChar, 0));
  return boundsCheck ? document.validatePosition(pos) : pos;
};

Position.prototype.subtract = function (this: Position, other: Position): PositionDiff {
  return PositionDiff.offset({
    line: this.line - other.line,
    character: this.character - other.character,
  });
};

/**
 * @returns a new Position with the same line and the given character.
 * Does bounds-checking to make sure the result is valid.
 */
Position.prototype.withColumn = function (this: Position, column: number): Position {
  column = clamp(column, 0, TextEditor.getLineLength(this.line));
  return new Position(this.line, column);
};

/**
 * @returns the Position `count` characters to the left of this Position. Does not go over line breaks.
 */
Position.prototype.getLeft = function (this: Position, count = 1): Position {
  return new Position(this.line, Math.max(this.character - count, 0));
};

/**
 * @returns the Position `count` characters to the right of this Position. Does not go over line breaks.
 */
Position.prototype.getRight = function (this: Position, count = 1): Position {
  return new Position(
    this.line,
    Math.min(this.character + count, TextEditor.getLineLength(this.line)),
  );
};

/**
 * @returns the Position `count` lines down from this Position
 */
Position.prototype.getDown = function (this: Position, count = 1): Position {
  if (vscode.window.activeTextEditor) {
    const line = Math.min(this.line + count, TextEditor.getLineCount() - 1);
    return new Position(line, Math.min(this.character, TextEditor.getLineLength(line)));
  } else {
    return this.translate({ lineDelta: count });
  }
};

/**
 * @returns the Position `count` lines up from this Position
 */
Position.prototype.getUp = function (this: Position, count = 1): Position {
  const line = Math.max(this.line - count, 0);
  return new Position(line, Math.min(this.character, TextEditor.getLineLength(line)));
};

/**
 * Same as getLeft, but goes up to the previous line on line breaks.
 * Equivalent to left arrow (in a non-vim editor!)
 */
Position.prototype.getLeftThroughLineBreaks = function (
  this: Position,
  includeEol = true,
): Position {
  if (!this.isLineBeginning()) {
    return this.getLeft();
  }

  // First char on first line, can not go left any more
  if (this.line === 0) {
    return this;
  }

  if (includeEol) {
    return this.getUp().getLineEnd();
  } else {
    return this.getUp().getLineEnd().getLeft();
  }
};

Position.prototype.getRightThroughLineBreaks = function (
  this: Position,
  includeEol = false,
): Position {
  const document = vscode.window.activeTextEditor?.document;
  if (document === undefined) {
    return this;
  }
  if (this.isAtDocumentEnd(document)) {
    return this;
  }

  const lineLength = document.lineAt(this.line).text.length;
  if (this.line < document.lineCount - 1) {
    const pos = includeEol ? this : this.getRight();
    if (pos.character === lineLength) {
      return this.with({ character: 0 }).getDown();
    }
  } else if (!includeEol && this.character === lineLength - 1) {
    // Last character of document, don't go on to non-existent EOL
    return this;
  }

  return this.getRight();
};

Position.prototype.getOffsetThroughLineBreaks = function (
  this: Position,
  offset: number,
): Position {
  let pos = new Position(this.line, this.character);

  if (offset < 0) {
    for (let i = 0; i < -offset; i++) {
      pos = pos.getLeftThroughLineBreaks();
    }
  } else {
    for (let i = 0; i < offset; i++) {
      pos = pos.getRightThroughLineBreaks();
    }
  }

  return pos;
};

Position.prototype.prevWordStart = function (
  this: Position,
  document: vscode.TextDocument,
  args?: { wordType?: WordType; inclusive?: boolean },
): Position {
  return prevWordStart(document, this, args?.wordType ?? WordType.Normal, args?.inclusive ?? false);
};

Position.prototype.nextWordStart = function (
  this: Position,
  document: vscode.TextDocument,
  args?: { wordType?: WordType; inclusive?: boolean },
): Position {
  return nextWordStart(document, this, args?.wordType ?? WordType.Normal, args?.inclusive ?? false);
};

Position.prototype.prevWordEnd = function (
  this: Position,
  document: vscode.TextDocument,
  args?: { wordType?: WordType },
): Position {
  return prevWordEnd(document, this, args?.wordType ?? WordType.Normal);
};

Position.prototype.nextWordEnd = function (
  this: Position,
  document: vscode.TextDocument,
  args?: { wordType?: WordType; inclusive?: boolean },
): Position {
  return nextWordEnd(document, this, args?.wordType ?? WordType.Normal, args?.inclusive ?? false);
};

Position.prototype.getSentenceBegin = function (
  this: Position,
  args: { forward: boolean },
): Position {
  return getSentenceBegin(this, args);
};

Position.prototype.getSentenceEnd = function (this: Position): Position {
  return getSentenceEnd(this);
};

/**
 * @returns a new Position at the beginning of the current line.
 */
Position.prototype.getLineBegin = function (this: Position): Position {
  return new Position(this.line, 0);
};

/**
 * @returns the beginning of the line, excluding preceeding whitespace.
 * This respects the `autoindent` setting, and returns `getLineBegin()` if auto-indent is disabled.
 */
Position.prototype.getLineBeginRespectingIndent = function (
  this: Position,
  document: vscode.TextDocument,
): Position {
  if (!configuration.autoindent) {
    return this.getLineBegin();
  }
  return TextEditor.getFirstNonWhitespaceCharOnLine(document, this.line);
};

/**
 * @returns a new Position at the end of this position's line.
 */
Position.prototype.getLineEnd = function (this: Position): Position {
  return new Position(this.line, TextEditor.getLineLength(this.line));
};

/**
 * @returns a new Position at the end of this Position's line, including the invisible newline character.
 */
Position.prototype.getLineEndIncludingEOL = function (this: Position): Position {
  // TODO: isn't this one too far?
  return new Position(this.line, TextEditor.getLineLength(this.line) + 1);
};

/**
 * @returns a new Position one to the left if this Position is on the EOL. Otherwise, returns this position.
 */
Position.prototype.getLeftIfEOL = function (this: Position): Position {
  return this.character === TextEditor.getLineLength(this.line) ? this.getLeft() : this;
};

/**
 * @returns the position that the cursor would be at if you pasted *text* at the current position.
 */
Position.prototype.advancePositionByText = function (this: Position, text: string): Position {
  const newlines: number[] = [];
  let idx = text.indexOf('\n', 0);
  while (idx >= 0) {
    newlines.push(idx);
    idx = text.indexOf('\n', idx + 1);
  }

  if (newlines.length === 0) {
    return new Position(this.line, this.character + text.length);
  } else {
    return new Position(this.line + newlines.length, text.length - (newlines.at(-1)! + 1));
  }
};

/**
 * Is this position at the beginning of the line?
 */
Position.prototype.isLineBeginning = function (this: Position): boolean {
  return this.character === 0;
};

/**
 * Is this position at the end of the line?
 */
Position.prototype.isLineEnd = function (this: Position, document: vscode.TextDocument): boolean {
  return this.character >= document.lineAt(this.line).range.end.character;
};

Position.prototype.isFirstWordOfLine = function (
  this: Position,
  document: vscode.TextDocument,
): boolean {
  return (
    TextEditor.getFirstNonWhitespaceCharOnLine(document, this.line).character === this.character
  );
};

Position.prototype.isAtDocumentBegin = function (this: Position): boolean {
  return this.line === 0 && this.isLineBeginning();
};

Position.prototype.isAtDocumentEnd = function (
  this: Position,
  document: vscode.TextDocument,
): boolean {
  return this.isEqual(TextEditor.getDocumentEnd(document));
};

/**
 * Returns whether the current position is in the leading whitespace of a line
 * @param allowEmpty : Use true if "" is valid
 */
Position.prototype.isInLeadingWhitespace = function (
  this: Position,
  document: vscode.TextDocument,
): boolean {
  return /^\s+$/.test(document.getText(new vscode.Range(this.getLineBegin(), this)));
};

/**
 * If `vim.startofline` is set, get first non-blank character's position.
 */
Position.prototype.obeyStartOfLine = function (
  this: Position,
  document: vscode.TextDocument,
): Position {
  return configuration.startofline
    ? TextEditor.getFirstNonWhitespaceCharOnLine(document, this.line)
    : this;
};

Position.prototype.isValid = function (this: Position, textEditor: vscode.TextEditor): boolean {
  try {
    // line
    // TODO: this `|| 1` seems dubious...
    const lineCount = TextEditor.getLineCount(textEditor) || 1;
    if (this.line >= lineCount) {
      return false;
    }

    // char
    const charCount = TextEditor.getLineLength(this.line);
    if (this.character > charCount + 1) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
};
