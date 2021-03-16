import * as vscode from 'vscode';

import { configuration } from './../../configuration/configuration';
import { TextEditor } from './../../textEditor';
import { clamp } from '../../util/util';
import { getSentenceBegin, getSentenceEnd } from '../../textobject/sentence';
import {
  WordType,
  getCurrentWordEnd,
  getLastWordEnd,
  getWordLeft,
  getWordRight,
} from '../../textobject/word';
import { Position } from 'vscode';

/**
 * Controls how a PositionDiff affects the Position it's applied to.
 */
export enum PositionDiffType {
  /** Simple line and column offset */
  Offset,
  /**
   * Sets the Position's column to `PositionDiff.character`
   */
  ExactCharacter,
  /** Brings the Position to the beginning of the line if `vim.startofline` is true */
  ObeyStartOfLine,
}

/**
 * Represents a difference between two Positions.
 * Add it to a Position to get another Position.
 */
export class PositionDiff {
  public readonly line: number;
  public readonly character: number;
  public readonly type: PositionDiffType;

  constructor({ line = 0, character = 0, type = PositionDiffType.Offset } = {}) {
    this.line = line;
    this.character = character;
    this.type = type;
  }

  public static newBOLDiff(lineOffset: number = 0) {
    return new PositionDiff({
      line: lineOffset,
      character: 0,
      type: PositionDiffType.ExactCharacter,
    });
  }

  public toString(): string {
    switch (this.type) {
      case PositionDiffType.Offset:
        return `[ Diff: Offset ${this.line} ${this.character} ]`;
      case PositionDiffType.ExactCharacter:
        return `[ Diff: ExactCharacter ${this.line} ${this.character} ]`;
      case PositionDiffType.ObeyStartOfLine:
        return `[ Diff: ObeyStartOfLine ${this.line} ]`;
      default:
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
     * @returns a new Position with the same character and the given line.
     * Does bounds-checking to make sure the result is valid.
     */
    withLine(line: number): Position;
    /**
     * @returns a new Position with the same line and the given character.
     * Does bounds-checking to make sure the result is valid.
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

    getWordLeft(inclusive?: boolean): Position;
    getWordRight(inclusive?: boolean): Position;
    getCurrentWordEnd(inclusive?: boolean): Position;
    getLastWordEnd(): Position;

    getBigWordLeft(inclusive?: boolean): Position;
    getBigWordRight(): Position;
    getCurrentBigWordEnd(inclusive?: boolean): Position;
    getLastBigWordEnd(): Position;

    getSentenceBegin(args: { forward: boolean }): Position;
    getSentenceEnd(): Position;

    getLineBegin(): Position;

    /**
     * @returns the beginning of the line, excluding preceeding whitespace.
     * This respects the `autoindent` setting, and returns `getLineBegin()` if auto-indent is disabled.
     */
    getLineBeginRespectingIndent(document: vscode.TextDocument): Position;

    /**
     * @return the beginning of the previous line.
     * If already on the first line, return the beginning of this line.
     */
    getPreviousLineBegin(): Position;

    /**
     * @return the beginning of the next line.
     * If already on the last line, return the *end* of this line.
     */
    getNextLineBegin(): Position;

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
    isLineEnd(): boolean;

    isFirstWordOfLine(document: vscode.TextDocument): boolean;

    isAtDocumentBegin(): boolean;

    isAtDocumentEnd(): boolean;

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
  boundsCheck = true
): Position {
  const resultLine = clamp(this.line + diff.line, 0, document.lineCount - 1);

  let resultChar: number;
  if (diff.type === PositionDiffType.Offset) {
    resultChar = this.character + diff.character;
  } else if (diff.type === PositionDiffType.ExactCharacter) {
    resultChar = diff.character;
  } else if (diff.type === PositionDiffType.ObeyStartOfLine) {
    resultChar = this.withLine(resultLine).obeyStartOfLine(document).character;
  } else {
    throw new Error(`Unknown PositionDiffType: ${diff.type}`);
  }

  const pos = new Position(resultLine, Math.max(resultChar, 0));
  return boundsCheck ? document.validatePosition(pos) : pos;
};

Position.prototype.subtract = function (this: Position, other: Position): PositionDiff {
  return new PositionDiff({
    line: this.line - other.line,
    character: this.character - other.character,
  });
};

/**
 * @returns a new Position with the same character and the given line.
 * Does bounds-checking to make sure the result is valid.
 */
Position.prototype.withLine = function (this: Position, line: number): Position {
  line = clamp(line, 0, TextEditor.getLineCount() - 1);
  return new Position(line, this.character);
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
    Math.min(this.character + count, TextEditor.getLineLength(this.line))
  );
};

/**
 * @returns the Position `count` lines down from this Position
 */
Position.prototype.getDown = function (this: Position, count = 1): Position {
  const line = Math.min(this.line + count, TextEditor.getLineCount() - 1);
  return new Position(line, Math.min(this.character, TextEditor.getLineLength(line)));
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
  includeEol = true
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
  includeEol = false
): Position {
  if (this.isAtDocumentEnd()) {
    return this;
  }

  if (this.line < TextEditor.getLineCount() - 1) {
    const pos = includeEol ? this : this.getRight();
    if (pos.isLineEnd()) {
      return this.with({ character: 0 }).getDown();
    }
  } else if (!includeEol && this.character === TextEditor.getLineLength(this.line) - 1) {
    // Last character of document, don't go on to non-existent EOL
    return this;
  }

  return this.getRight();
};

Position.prototype.getOffsetThroughLineBreaks = function (
  this: Position,
  offset: number
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

/**
 * Inclusive is true if we consider the current position a valid result, false otherwise.
 */
Position.prototype.getWordLeft = function (this: Position, inclusive: boolean = false): Position {
  return getWordLeft(this, WordType.Normal, inclusive);
};

Position.prototype.getBigWordLeft = function (
  this: Position,
  inclusive: boolean = false
): Position {
  return getWordLeft(this, WordType.Big, inclusive);
};

/**
 * Inclusive is true if we consider the current position a valid result, false otherwise.
 */
Position.prototype.getWordRight = function (this: Position, inclusive: boolean = false): Position {
  return getWordRight(this, WordType.Normal, inclusive);
};

Position.prototype.getBigWordRight = function (this: Position): Position {
  return getWordRight(this, WordType.Big);
};

Position.prototype.getLastWordEnd = function (this: Position): Position {
  return getLastWordEnd(this, WordType.Normal);
};

Position.prototype.getLastBigWordEnd = function (this: Position): Position {
  return getLastWordEnd(this, WordType.Big);
};

/**
 * Inclusive is true if we consider the current position a valid result, false otherwise.
 */
Position.prototype.getCurrentWordEnd = function (
  this: Position,
  inclusive: boolean = false
): Position {
  return getCurrentWordEnd(this, WordType.Normal, inclusive);
};

/**
 * Inclusive is true if we consider the current position a valid result, false otherwise.
 */
Position.prototype.getCurrentBigWordEnd = function (
  this: Position,
  inclusive: boolean = false
): Position {
  return getCurrentWordEnd(this, WordType.Big, inclusive);
};

Position.prototype.getSentenceBegin = function (
  this: Position,
  args: { forward: boolean }
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
  document: vscode.TextDocument
): Position {
  if (!configuration.autoindent) {
    return this.getLineBegin();
  }
  return TextEditor.getFirstNonWhitespaceCharOnLine(document, this.line);
};

/**
 * @return the beginning of the previous line.
 * If already on the first line, return the beginning of this line.
 */
Position.prototype.getPreviousLineBegin = function (this: Position): Position {
  if (this.line === 0) {
    return this.getLineBegin();
  }

  return new Position(this.line - 1, 0);
};

/**
 * @return the beginning of the next line.
 * If already on the last line, return the *end* of this line.
 */
Position.prototype.getNextLineBegin = function (this: Position): Position {
  if (this.line >= TextEditor.getLineCount() - 1) {
    return this.getLineEnd();
  }

  return new Position(this.line + 1, 0);
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
    return new Position(
      this.line + newlines.length,
      text.length - (newlines[newlines.length - 1] + 1)
    );
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
Position.prototype.isLineEnd = function (this: Position): boolean {
  return this.character >= TextEditor.getLineLength(this.line);
};

Position.prototype.isFirstWordOfLine = function (
  this: Position,
  document: vscode.TextDocument
): boolean {
  return (
    TextEditor.getFirstNonWhitespaceCharOnLine(document, this.line).character === this.character
  );
};

Position.prototype.isAtDocumentBegin = function (this: Position): boolean {
  return this.line === 0 && this.isLineBeginning();
};

Position.prototype.isAtDocumentEnd = function (this: Position): boolean {
  return this.line === TextEditor.getLineCount() - 1 && this.isLineEnd();
};

/**
 * Returns whether the current position is in the leading whitespace of a line
 * @param allowEmpty : Use true if "" is valid
 */
Position.prototype.isInLeadingWhitespace = function (
  this: Position,
  document: vscode.TextDocument
): boolean {
  return /^\s+$/.test(document.getText(new vscode.Range(this.getLineBegin(), this)));
};

/**
 * If `vim.startofline` is set, get first non-blank character's position.
 */
Position.prototype.obeyStartOfLine = function (
  this: Position,
  document: vscode.TextDocument
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
