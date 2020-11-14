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

export class Position extends vscode.Position {
  constructor(line: number, character: number) {
    super(line, character);
  }

  public toString(): string {
    return `[${this.line}, ${this.character}]`;
  }

  public static FromVSCodePosition(pos: vscode.Position): Position {
    return new Position(pos.line, pos.character);
  }

  /**
   * Subtracts another position from this one, returning the difference between the two.
   */
  public subtract(other: Position): PositionDiff {
    return new PositionDiff({
      line: this.line - other.line,
      character: this.character - other.character,
    });
  }

  /**
   * Adds a PositionDiff to this position, returning a new position.
   */
  public add(diff: PositionDiff, { boundsCheck = true } = {}): Position {
    let resultLine = this.line + diff.line;

    let resultChar: number;
    if (diff.type === PositionDiffType.Offset) {
      resultChar = this.character + diff.character;
    } else if (diff.type === PositionDiffType.ExactCharacter) {
      resultChar = diff.character;
    } else if (diff.type === PositionDiffType.ObeyStartOfLine) {
      resultChar = this.withLine(resultLine).obeyStartOfLine().character;
    } else {
      throw new Error(`Unknown PositionDiffType: ${diff.type}`);
    }

    if (boundsCheck) {
      resultLine = clamp(resultLine, 0, TextEditor.getLineCount() - 1);
      resultChar = clamp(resultChar, 0, TextEditor.getLineLength(resultLine));
    }

    return new Position(resultLine, resultChar);
  }

  /**
   * @returns a new Position with the same character and the given line.
   * Does bounds-checking to make sure the result is valid.
   */
  public withLine(line: number): Position {
    line = clamp(line, 0, TextEditor.getLineCount() - 1);
    return new Position(line, this.character);
  }

  /**
   * @returns a new Position with the same line and the given character.
   * Does bounds-checking to make sure the result is valid.
   */
  public withColumn(column: number): Position {
    column = clamp(column, 0, TextEditor.getLineLength(this.line));
    return new Position(this.line, column);
  }

  /**
   * @returns the Position `count` characters to the left of this Position. Does not go over line breaks.
   */
  public getLeft(count = 1): Position {
    return new Position(this.line, Math.max(this.character - count, 0));
  }

  /**
   * @returns the Position `count` characters to the right of this Position. Does not go over line breaks.
   */
  public getRight(count = 1): Position {
    return new Position(
      this.line,
      Math.min(this.character + count, TextEditor.getLineLength(this.line))
    );
  }

  /**
   * @returns the Position `count` lines down from this Position
   */
  public getDown(count = 1): Position {
    const line = Math.min(this.line + count, TextEditor.getLineCount() - 1);
    return new Position(line, Math.min(this.character, TextEditor.getLineLength(line)));
  }

  /**
   * @returns the Position `count` lines up from this Position
   */
  public getUp(count = 1): Position {
    const line = Math.max(this.line - count, 0);
    return new Position(line, Math.min(this.character, TextEditor.getLineLength(line)));
  }

  /**
   * Same as getLeft, but goes up to the previous line on line breaks.
   * Equivalent to left arrow (in a non-vim editor!)
   */
  public getLeftThroughLineBreaks(includeEol = true): Position {
    if (!this.isLineBeginning()) {
      return this.getLeft();
    }

    // First char on first line, can not go left any more
    if (this.line === 0) {
      return this;
    }

    if (includeEol) {
      return this.getUpWithDesiredColumn(0).getLineEnd();
    } else {
      return this.getUpWithDesiredColumn(0).getLineEnd().getLeft();
    }
  }

  public getRightThroughLineBreaks(includeEol = false): Position {
    if (this.isAtDocumentEnd()) {
      // TODO(bell)
      return this;
    }

    if (this.isLineEnd()) {
      return this.getDownWithDesiredColumn(0);
    }

    if (!includeEol && this.getRight().isLineEnd()) {
      return this.getDownWithDesiredColumn(0);
    }

    return this.getRight();
  }

  public getOffsetThroughLineBreaks(offset: number): Position {
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
  }

  /**
   * Get the position of the line directly below the current line.
   */
  public getDownWithDesiredColumn(desiredColumn: number): Position {
    if (TextEditor.getDocumentEnd().line !== this.line) {
      let nextLine = this.line + 1;
      let nextLineLength = TextEditor.getLineLength(nextLine);

      return new Position(nextLine, Math.min(nextLineLength, desiredColumn));
    }

    return this;
  }

  /**
   * Get the position of the line directly above the current line.
   */
  public getUpWithDesiredColumn(desiredColumn: number): Position {
    if (TextEditor.getDocumentBegin().line !== this.line) {
      let prevLine = this.line - 1;
      let prevLineLength = TextEditor.getLineLength(prevLine);

      return new Position(prevLine, Math.min(prevLineLength, desiredColumn));
    }

    return this;
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordLeft(inclusive: boolean = false): Position {
    return getWordLeft(this, WordType.Normal, inclusive);
  }

  public getBigWordLeft(inclusive: boolean = false): Position {
    return getWordLeft(this, WordType.Big, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordRight(inclusive: boolean = false): Position {
    return getWordRight(this, WordType.Normal, inclusive);
  }

  public getBigWordRight(): Position {
    return getWordRight(this, WordType.Big);
  }

  public getLastWordEnd(): Position {
    return getLastWordEnd(this, WordType.Normal);
  }

  public getLastBigWordEnd(): Position {
    return getLastWordEnd(this, WordType.Big);
  }

  public getLastCamelCaseWordEnd(): Position {
    return getLastWordEnd(this, WordType.CamelCase);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentWordEnd(inclusive: boolean = false): Position {
    return getCurrentWordEnd(this, WordType.Normal, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentBigWordEnd(inclusive: boolean = false): Position {
    return getCurrentWordEnd(this, WordType.Big, inclusive);
  }

  private isLineBlank(trimWhite: boolean = false): boolean {
    let text = TextEditor.getLineAt(this).text;
    return (trimWhite ? text.trim() : text) === '';
  }

  /**
   * Get the end of the current paragraph.
   */
  public getCurrentParagraphEnd(trimWhite: boolean = false): Position {
    let pos: Position = this;

    // If we're not in a paragraph yet, go down until we are.
    while (pos.isLineBlank(trimWhite) && !TextEditor.isLastLine(pos)) {
      pos = pos.getDownWithDesiredColumn(0);
    }

    // Go until we're outside of the paragraph, or at the end of the document.
    while (!pos.isLineBlank(trimWhite) && pos.line < TextEditor.getLineCount() - 1) {
      pos = pos.getDownWithDesiredColumn(0);
    }

    return pos.getLineEnd();
  }

  /**
   * Get the beginning of the current paragraph.
   */
  public getCurrentParagraphBeginning(trimWhite: boolean = false): Position {
    let pos: Position = this;

    // If we're not in a paragraph yet, go up until we are.
    while (pos.isLineBlank(trimWhite) && !TextEditor.isFirstLine(pos)) {
      pos = pos.getUpWithDesiredColumn(0);
    }

    // Go until we're outside of the paragraph, or at the beginning of the document.
    while (pos.line > 0 && !pos.isLineBlank(trimWhite)) {
      pos = pos.getUpWithDesiredColumn(0);
    }

    return pos.getLineBegin();
  }

  public getSentenceBegin(args: { forward: boolean }): Position {
    return getSentenceBegin(this, args);
  }

  public getSentenceEnd(): Position {
    return getSentenceEnd(this);
  }

  /**
   * @returns a new Position at the beginning of the current line.
   */
  public getLineBegin(): Position {
    return new Position(this.line, 0);
  }

  /**
   * @returns the beginning of the line, excluding preceeding whitespace.
   * This respects the `autoindent` setting, and returns `getLineBegin()` if auto-indent is disabled.
   */
  public getLineBeginRespectingIndent(): Position {
    if (!configuration.autoindent) {
      return this.getLineBegin();
    }
    return TextEditor.getFirstNonWhitespaceCharOnLine(this.line);
  }

  /**
   * @return the beginning of the previous line.
   * If already on the first line, return the beginning of this line.
   */
  public getPreviousLineBegin(): Position {
    if (this.line === 0) {
      return this.getLineBegin();
    }

    return new Position(this.line - 1, 0);
  }

  /**
   * @return the beginning of the next line.
   * If already on the last line, return the *end* of this line.
   */
  public getNextLineBegin(): Position {
    if (this.line >= TextEditor.getLineCount() - 1) {
      return this.getLineEnd();
    }

    return new Position(this.line + 1, 0);
  }

  /**
   * @returns a new Position at the end of this position's line.
   */
  public getLineEnd(): Position {
    return new Position(this.line, TextEditor.getLineLength(this.line));
  }

  /**
   * @returns a new Position at the end of this Position's line, including the invisible newline character.
   */
  public getLineEndIncludingEOL(): Position {
    // TODO: isn't this one too far?
    return new Position(this.line, TextEditor.getLineLength(this.line) + 1);
  }

  /**
   * @returns a new Position one to the left if this Position is on the EOL. Otherwise, returns this position.
   */
  public getLeftIfEOL(): Position {
    return this.character === TextEditor.getLineLength(this.line) ? this.getLeft() : this;
  }

  /**
   * @returns the position that the cursor would be at if you pasted *text* at the current position.
   */
  public advancePositionByText(text: string): Position {
    const numberOfLinesSpanned = (text.match(/\n/g) || []).length;

    return new Position(
      this.line + numberOfLinesSpanned,
      numberOfLinesSpanned === 0
        ? this.character + text.length
        : text.length - (text.lastIndexOf('\n') + 1)
    );
  }

  /**
   * Is this position at the beginning of the line?
   */
  public isLineBeginning(): boolean {
    return this.character === 0;
  }

  /**
   * Is this position at the end of the line?
   */
  public isLineEnd(): boolean {
    return this.character >= TextEditor.getLineLength(this.line);
  }

  public isFirstWordOfLine(): boolean {
    return TextEditor.getFirstNonWhitespaceCharOnLine(this.line).character === this.character;
  }

  public isAtDocumentBegin(): boolean {
    return this.line === 0 && this.isLineBeginning();
  }

  public isAtDocumentEnd(): boolean {
    return this.line === TextEditor.getLineCount() - 1 && this.isLineEnd();
  }

  /**
   * Returns whether the current position is in the leading whitespace of a line
   * @param allowEmpty : Use true if "" is valid
   */
  public isInLeadingWhitespace(allowEmpty: boolean = false): boolean {
    if (allowEmpty) {
      return /^\s*$/.test(TextEditor.getText(new vscode.Range(this.getLineBegin(), this)));
    } else {
      return /^\s+$/.test(TextEditor.getText(new vscode.Range(this.getLineBegin(), this)));
    }
  }

  /**
   * If `vim.startofline` is set, get first non-blank character's position.
   */
  public obeyStartOfLine(): Position {
    return configuration.startofline ? TextEditor.getFirstNonWhitespaceCharOnLine(this.line) : this;
  }

  public isValid(textEditor: vscode.TextEditor): boolean {
    try {
      // line
      // TODO: this `|| 1` seems dubious...
      let lineCount = TextEditor.getLineCount(textEditor) || 1;
      if (this.line >= lineCount) {
        return false;
      }

      // char
      let charCount = TextEditor.getLineLength(this.line);
      if (this.character > charCount + 1) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return true;
  }
}
