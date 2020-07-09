import * as vscode from 'vscode';
import * as _ from 'lodash';

import { configuration } from './../../configuration/configuration';
import { TextEditor } from './../../textEditor';
import { clamp } from '../../util/util';

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

  public getLeftTabStop(): Position {
    if (!this.isLineBeginning()) {
      let indentationWidth = TextEditor.getIndentationLevel(TextEditor.getLineAt(this).text);
      let tabSize = vscode.window.activeTextEditor!.options.tabSize as number;

      if (indentationWidth % tabSize > 0) {
        return new Position(this.line, Math.max(0, this.character - (indentationWidth % tabSize)));
      } else {
        return new Position(this.line, Math.max(0, this.character - tabSize));
      }
    }

    return this;
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
   * Get the position of the word counting from the position specified.
   * @param text The string to search from.
   * @param pos The position of text to search from.
   * @param inclusive true if we consider the pos a valid result, false otherwise.
   * @returns The character position of the word to the left relative to the text and the pos.
   *          undefined if there is no word to the left of the postion.
   */
  public static getWordLeft(
    text: string,
    pos: number,
    inclusive: boolean = false
  ): number | undefined {
    return Position.getWordLeftWithRegex(text, pos, nonWordCharRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(nonWordCharRegex, inclusive);
  }

  public getBigWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(nonBigWordCharRegex, inclusive);
  }

  public getCamelCaseWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(nonCamelCaseWordCharRegex, inclusive);
  }

  public getFilePathLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(nonFileNameRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(nonWordCharRegex, inclusive);
  }

  public getBigWordRight(): Position {
    return this.getWordRightWithRegex(nonBigWordCharRegex);
  }

  public getCamelCaseWordRight(): Position {
    return this.getWordRightWithRegex(nonCamelCaseWordCharRegex);
  }

  public getFilePathRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(nonFileNameRegex, inclusive);
  }

  public getLastWordEnd(): Position {
    return this.getLastWordEndWithRegex(nonWordCharRegex);
  }

  public getLastBigWordEnd(): Position {
    return this.getLastWordEndWithRegex(nonBigWordCharRegex);
  }

  public getLastCamelCaseWordEnd(): Position {
    return this.getLastWordEndWithRegex(nonCamelCaseWordCharRegex);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(nonWordCharRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentBigWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(nonBigWordCharRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentCamelCaseWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(nonCamelCaseWordCharRegex, inclusive);
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
    if (args.forward) {
      return this.getNextSentenceBeginWithRegex(sentenceEndRegex, false);
    } else {
      return this.getPreviousSentenceBeginWithRegex(sentenceEndRegex);
    }
  }

  public getCurrentSentenceEnd(): Position {
    return this.getCurrentSentenceEndWithRegex(sentenceEndRegex, false);
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

  private static getAllPositions(line: string, regex: RegExp): number[] {
    let positions: number[] = [];
    let result = regex.exec(line);

    while (result) {
      positions.push(result.index);

      // Handles the case where an empty string match causes lastIndex not to advance,
      // which gets us in an infinite loop.
      if (result.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      result = regex.exec(line);
    }

    return positions;
  }

  private getAllEndPositions(line: string, regex: RegExp): number[] {
    let positions: number[] = [];
    let result = regex.exec(line);

    while (result) {
      if (result[0].length) {
        positions.push(result.index + result[0].length - 1);
      }

      // Handles the case where an empty string match causes lastIndex not to advance,
      // which gets us in an infinite loop.
      if (result.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      result = regex.exec(line);
    }

    return positions;
  }

  private static getWordLeftWithRegex(
    text: string,
    pos: number,
    regex: RegExp,
    forceFirst: boolean = false,
    inclusive: boolean = false
  ): number | undefined {
    return Position.getAllPositions(text, regex)
      .reverse()
      .find((index) => (index < pos && !inclusive) || (index <= pos && inclusive) || forceFirst);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  private getWordLeftWithRegex(regex: RegExp, inclusive: boolean = false): Position {
    for (let currentLine = this.line; currentLine >= 0; currentLine--) {
      const newCharacter = Position.getWordLeftWithRegex(
        TextEditor.getLine(currentLine).text,
        this.character,
        regex,
        currentLine !== this.line,
        inclusive
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }

    return new Position(0, 0);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  private getWordRightWithRegex(regex: RegExp, inclusive: boolean = false): Position {
    for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
      let positions = Position.getAllPositions(TextEditor.getLine(currentLine).text, regex);
      let newCharacter = positions.find(
        (index) =>
          (index > this.character && !inclusive) ||
          (index >= this.character && inclusive) ||
          currentLine !== this.line
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }

    return new Position(TextEditor.getLineCount() - 1, 0).getLineEnd();
  }

  private getLastWordEndWithRegex(regex: RegExp): Position {
    for (let currentLine = this.line; currentLine > -1; currentLine--) {
      let positions = this.getAllEndPositions(TextEditor.getLine(currentLine).text, regex);
      // if one line is empty, use the 0 position as the default value
      if (positions.length === 0) {
        positions.push(0);
      }
      // reverse the list to find the biggest element smaller than this.character
      positions = positions.reverse();
      let index = positions.findIndex((i) => i < this.character || currentLine !== this.line);
      let newCharacter = 0;
      if (index === -1) {
        if (currentLine > -1) {
          continue;
        }
        newCharacter = positions[positions.length - 1];
      } else {
        newCharacter = positions[index];
      }

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }

    return new Position(0, 0);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  private getCurrentWordEndWithRegex(regex: RegExp, inclusive: boolean): Position {
    for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
      let positions = this.getAllEndPositions(TextEditor.getLine(currentLine).text, regex);
      let newCharacter = positions.find(
        (index) =>
          (index > this.character && !inclusive) ||
          (index >= this.character && inclusive) ||
          currentLine !== this.line
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }

    return new Position(TextEditor.getLineCount() - 1, 0).getLineEnd();
  }

  private getPreviousSentenceBeginWithRegex(regex: RegExp): Position {
    let paragraphBegin = this.getCurrentParagraphBeginning();
    for (let currentLine = this.line; currentLine >= paragraphBegin.line; currentLine--) {
      let endPositions = this.getAllEndPositions(TextEditor.getLine(currentLine).text, regex);
      let newCharacter = endPositions.reverse().find((index) => {
        const newPositionBeforeThis = new Position(currentLine, index)
          .getRightThroughLineBreaks()
          .compareTo(this);

        return newPositionBeforeThis && (index < this.character || currentLine < this.line);
      });

      if (newCharacter !== undefined) {
        return new Position(currentLine, <number>newCharacter).getRightThroughLineBreaks();
      }
    }

    if (paragraphBegin.line + 1 === this.line || paragraphBegin.line === this.line) {
      return paragraphBegin;
    } else {
      return new Position(paragraphBegin.line + 1, 0);
    }
  }

  private getNextSentenceBeginWithRegex(regex: RegExp, inclusive: boolean): Position {
    // A paragraph and section boundary is also a sentence boundary.
    let paragraphEnd = this.getCurrentParagraphEnd();
    for (let currentLine = this.line; currentLine <= paragraphEnd.line; currentLine++) {
      let endPositions = this.getAllEndPositions(TextEditor.getLine(currentLine).text, regex);
      let newCharacter = endPositions.find(
        (index) =>
          (index > this.character && !inclusive) ||
          (index >= this.character && inclusive) ||
          currentLine !== this.line
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter).getRightThroughLineBreaks();
      }
    }

    return this.getFirstNonWhitespaceInParagraph(paragraphEnd, inclusive);
  }

  private getCurrentSentenceEndWithRegex(regex: RegExp, inclusive: boolean): Position {
    let paragraphEnd = this.getCurrentParagraphEnd();
    for (let currentLine = this.line; currentLine <= paragraphEnd.line; currentLine++) {
      let allPositions = Position.getAllPositions(TextEditor.getLine(currentLine).text, regex);
      let newCharacter = allPositions.find(
        (index) =>
          (index > this.character && !inclusive) ||
          (index >= this.character && inclusive) ||
          currentLine !== this.line
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }

    return this.getFirstNonWhitespaceInParagraph(paragraphEnd, inclusive);
  }

  private getFirstNonWhitespaceInParagraph(paragraphEnd: Position, inclusive: boolean): Position {
    // If the cursor is at an empty line, it's the end of a paragraph and the begin of another paragraph
    // Find the first non-whitespace character.
    if (TextEditor.getLine(this.line).text) {
      return paragraphEnd;
    } else {
      for (let currentLine = this.line; currentLine <= paragraphEnd.line; currentLine++) {
        const nonWhitePositions = Position.getAllPositions(
          TextEditor.getLine(currentLine).text,
          /\S/g
        );
        const newCharacter = nonWhitePositions.find(
          (index) =>
            (index > this.character && !inclusive) ||
            (index >= this.character && inclusive) ||
            currentLine !== this.line
        );

        if (newCharacter !== undefined) {
          return new Position(currentLine, newCharacter);
        }
      }
    }

    // Only happens at end of document
    return this;
  }
}

const nonWordCharRegex = makeUnicodeWordRegex(configuration.iskeyword!);
const nonBigWordCharRegex = makeWordRegex('');
const nonCamelCaseWordCharRegex = makeCamelCaseWordRegex(configuration.iskeyword!);
const sentenceEndRegex = /[\.!\?]{1}([ \n\t]+|$)/g;
const nonFileNameRegex = makeWordRegex('"\'`;<>{}[]()');

function makeUnicodeWordRegex(keywordChars: string): RegExp {
  // Distinct categories of characters
  enum CharKind {
    Punctuation,
    Superscript,
    Subscript,
    Braille,
    Ideograph,
    Hiragana,
    Katakana,
    Hangul,
  }

  // List of printable characters (code point intervals) and their character kinds.
  // Latin alphabets (e.g., ASCII alphabets and numbers,  Latin-1 Supplement, European Latin) are excluded.
  // Imported from utf_class_buf in src/mbyte.c of Vim.
  const symbolTable: [[number, number], CharKind][] = [
    [[0x00a1, 0x00bf], CharKind.Punctuation], // Latin-1 punctuation
    [[0x037e, 0x037e], CharKind.Punctuation], // Greek question mark
    [[0x0387, 0x0387], CharKind.Punctuation], // Greek ano teleia
    [[0x055a, 0x055f], CharKind.Punctuation], // Armenian punctuation
    [[0x0589, 0x0589], CharKind.Punctuation], // Armenian full stop
    [[0x05be, 0x05be], CharKind.Punctuation],
    [[0x05c0, 0x05c0], CharKind.Punctuation],
    [[0x05c3, 0x05c3], CharKind.Punctuation],
    [[0x05f3, 0x05f4], CharKind.Punctuation],
    [[0x060c, 0x060c], CharKind.Punctuation],
    [[0x061b, 0x061b], CharKind.Punctuation],
    [[0x061f, 0x061f], CharKind.Punctuation],
    [[0x066a, 0x066d], CharKind.Punctuation],
    [[0x06d4, 0x06d4], CharKind.Punctuation],
    [[0x0700, 0x070d], CharKind.Punctuation], // Syriac punctuation
    [[0x0964, 0x0965], CharKind.Punctuation],
    [[0x0970, 0x0970], CharKind.Punctuation],
    [[0x0df4, 0x0df4], CharKind.Punctuation],
    [[0x0e4f, 0x0e4f], CharKind.Punctuation],
    [[0x0e5a, 0x0e5b], CharKind.Punctuation],
    [[0x0f04, 0x0f12], CharKind.Punctuation],
    [[0x0f3a, 0x0f3d], CharKind.Punctuation],
    [[0x0f85, 0x0f85], CharKind.Punctuation],
    [[0x104a, 0x104f], CharKind.Punctuation], // Myanmar punctuation
    [[0x10fb, 0x10fb], CharKind.Punctuation], // Georgian punctuation
    [[0x1361, 0x1368], CharKind.Punctuation], // Ethiopic punctuation
    [[0x166d, 0x166e], CharKind.Punctuation], // Canadian Syl. punctuation
    [[0x169b, 0x169c], CharKind.Punctuation],
    [[0x16eb, 0x16ed], CharKind.Punctuation],
    [[0x1735, 0x1736], CharKind.Punctuation],
    [[0x17d4, 0x17dc], CharKind.Punctuation], // Khmer punctuation
    [[0x1800, 0x180a], CharKind.Punctuation], // Mongolian punctuation
    [[0x200c, 0x2027], CharKind.Punctuation], // punctuation and symbols
    [[0x202a, 0x202e], CharKind.Punctuation], // punctuation and symbols
    [[0x2030, 0x205e], CharKind.Punctuation], // punctuation and symbols
    [[0x2060, 0x27ff], CharKind.Punctuation], // punctuation and symbols
    [[0x2070, 0x207f], CharKind.Superscript], // superscript
    [[0x2080, 0x2094], CharKind.Subscript], // subscript
    [[0x20a0, 0x27ff], CharKind.Punctuation], // all kinds of symbols
    [[0x2800, 0x28ff], CharKind.Braille], // braille
    [[0x2900, 0x2998], CharKind.Punctuation], // arrows, brackets, etc.
    [[0x29d8, 0x29db], CharKind.Punctuation],
    [[0x29fc, 0x29fd], CharKind.Punctuation],
    [[0x2e00, 0x2e7f], CharKind.Punctuation], // supplemental punctuation
    [[0x3001, 0x3020], CharKind.Punctuation], // ideographic punctuation
    [[0x3030, 0x3030], CharKind.Punctuation],
    [[0x303d, 0x303d], CharKind.Punctuation],
    [[0x3040, 0x309f], CharKind.Hiragana], // Hiragana
    [[0x30a0, 0x30ff], CharKind.Katakana], // Katakana
    [[0x3300, 0x9fff], CharKind.Ideograph], // CJK Ideographs
    [[0xac00, 0xd7a3], CharKind.Hangul], // Hangul Syllables
    [[0xf900, 0xfaff], CharKind.Ideograph], // CJK Ideographs
    [[0xfd3e, 0xfd3f], CharKind.Punctuation],
    [[0xfe30, 0xfe6b], CharKind.Punctuation], // punctuation forms
    [[0xff00, 0xff0f], CharKind.Punctuation], // half/fullwidth ASCII
    [[0xff1a, 0xff20], CharKind.Punctuation], // half/fullwidth ASCII
    [[0xff3b, 0xff40], CharKind.Punctuation], // half/fullwidth ASCII
    [[0xff5b, 0xff65], CharKind.Punctuation], // half/fullwidth ASCII
    [[0x20000, 0x2a6df], CharKind.Ideograph], // CJK Ideographs
    [[0x2a700, 0x2b73f], CharKind.Ideograph], // CJK Ideographs
    [[0x2b740, 0x2b81f], CharKind.Ideograph], // CJK Ideographs
    [[0x2f800, 0x2fa1f], CharKind.Ideograph], // CJK Ideographs
  ];

  const codePointRangePatterns: string[][] = [];
  for (let kind in CharKind) {
    if (!isNaN(Number(kind))) {
      codePointRangePatterns[kind] = [];
    }
  }

  for (let [[first, last], kind] of symbolTable) {
    if (first === last) {
      // '\u{hhhh}'
      codePointRangePatterns[kind].push(`\\u{${first.toString(16)}}`);
    } else {
      // '\u{hhhh}-\u{hhhh}'
      codePointRangePatterns[kind].push(`\\u{${first.toString(16)}}-\\u{${last.toString(16)}}`);
    }
  }

  // Symbols in vim.iskeyword or editor.wordSeparators
  // are treated as CharKind.Punctuation
  const escapedKeywordChars = _.escapeRegExp(keywordChars).replace(/-/g, '\\-');
  codePointRangePatterns[Number(CharKind.Punctuation)].push(escapedKeywordChars);

  const codePointRanges = codePointRangePatterns.map((patterns) => patterns.join(''));
  const symbolSegments = codePointRanges.map((range) => `([${range}]+)`);

  // wordSegment matches word characters.
  // A word character is a symbol which is neither
  // - space
  // - a symbol listed in the table
  // - a keyword (vim.iskeyword)
  const wordSegment = `([^\\s${codePointRanges.join('')}]+)`;

  // https://regex101.com/r/X1agK6/2
  const segments = symbolSegments.concat(wordSegment, '$^');
  return new RegExp(segments.join('|'), 'ug');
}

function makeWordRegex(characterSet: string): RegExp {
  const escaped = characterSet && _.escapeRegExp(characterSet).replace(/-/g, '\\-');
  const segments = [`([^\\s${escaped}]+)`, `[${escaped}]+`, `$^`];

  return new RegExp(segments.join('|'), 'g');
}

function makeCamelCaseWordRegex(characterSet: string): RegExp {
  const escaped = characterSet && _.escapeRegExp(characterSet).replace(/-/g, '\\-');
  const segments: string[] = [];

  // prettier-ignore
  const firstSegment =
      '(' +                                 // OPEN: group for matching camel case words
      `[^\\s${escaped}]` +                  //   words can start with any word character
      '(?:' +                               //   OPEN: group for characters after initial char
      `(?:(?<=[A-Z_])` +                    //     If first char was a capital
      `[A-Z](?=[\\sA-Z0-9${escaped}_]))+` + //       the word can continue with all caps
      '|' +                                 //     OR
      `(?:(?<=[0-9_])`   +                  //     If first char was a digit
      `[0-9](?=[\\sA-Z0-9${escaped}_]))+` + //       the word can continue with all digits
      '|' +                                 //     OR
      `(?:(?<=[_])` +                       //     If first char was an underscore
      `[_](?=[\\s${escaped}_]))+`  +        //       the word can continue with all underscores
      '|' +                                 //     OR
      `[^\\sA-Z0-9${escaped}_]*` +          //     Continue with regular characters
      ')' +                                 //   END: group for characters after initial char
      ')' +                                 // END: group for matching camel case words
      '';

  segments.push(firstSegment);
  segments.push(`[${escaped}]+`);
  segments.push(`$^`);

  // it can be difficult to grok the behavior of the above regex
  // feel free to check out https://regex101.com/r/mkVeiH/1 as a live example
  return new RegExp(segments.join('|'), 'g');
}
