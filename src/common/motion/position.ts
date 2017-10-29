'use strict';

import * as _ from 'lodash';
import * as vscode from 'vscode';
import { TextEditor } from './../../textEditor';
import { betterEscapeRegex } from './../../util';

/**
 * Represents a difference between two positions. Add it to a position
 * to get another position. Create it with the factory methods:
 *
 * - NewDiff
 * - NewBOLDiff
 */
export class PositionDiff {
  private _line: number;
  private _character: number;
  private _isBOLDiff: boolean;

  constructor(line: number, character: number) {
    this._line = line;
    this._character = character;
  }

  /**
   * Creates a new PositionDiff that always brings the cursor to the beginning of the line
   * when applied to a position.
   */
  public static NewBOLDiff(line = 0, character = 0): PositionDiff {
    const result = new PositionDiff(line, character);

    result._isBOLDiff = true;
    return result;
  }

  /**
   * Add this PositionDiff to another PositionDiff.
   */
  public addDiff(other: PositionDiff) {
    if (this._isBOLDiff || other._isBOLDiff) {
      throw new Error("johnfn hasn't done this case yet and doesnt want to");
    }

    return new PositionDiff(this._line + other._line, this._character + other._character);
  }

  /**
   * Adds a Position to this PositionDiff, returning a new PositionDiff.
   */
  public addPosition(other: Position, { boundsCheck = true } = {}): Position {
    let resultChar = this.isBOLDiff() ? 0 : this.character + other.character;
    let resultLine = this.line + other.line;

    if (boundsCheck) {
      if (resultChar < 0) {
        resultChar = 0;
      }
      if (resultLine < 0) {
        resultLine = 0;
      }
    }

    return new Position(resultLine, resultChar);
  }

  /**
   * Difference in lines.
   */
  public get line(): number {
    return this._line;
  }

  /**
   * Difference in characters.
   */
  public get character(): number {
    return this._character;
  }

  /**
   * Does this diff move the position to the beginning of the line?
   */
  public isBOLDiff(): boolean {
    return this._isBOLDiff;
  }

  public toString(): string {
    if (this._isBOLDiff) {
      return `[ Diff: BOL ]`;
    }

    return `[ Diff: ${this._line} ${this._character} ]`;
  }
}

export class Position extends vscode.Position {
  private static NonWordCharacters = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-';
  private static NonBigWordCharacters = '';
  private static NonFileCharacters = '"\'`;<>{}[]()';

  private _nonWordCharRegex: RegExp;
  private _nonBigWordCharRegex: RegExp;
  private _sentenceEndRegex: RegExp;
  private _nonFileNameRegex: RegExp;

  constructor(line: number, character: number) {
    super(line, character);

    this._nonWordCharRegex = this.makeWordRegex(Position.NonWordCharacters);
    this._nonBigWordCharRegex = this.makeWordRegex(Position.NonBigWordCharacters);
    this._sentenceEndRegex = /[\.!\?]{1}([ \n\t]+|$)/g;
    this._nonFileNameRegex = this.makeWordRegex(Position.NonFileCharacters);
  }

  public getRightThroughLineBreaks() {
    if (this.isAtDocumentEnd()) {
      // TODO(bell)
      return this;
    }

    if (this.isLineEnd()) {
      return this.getDown(0);
    }

    return this.getRight();
  }

  public toString(): string {
    return `[${this.line}, ${this.character}]`;
  }

  public static FromVSCodePosition(pos: vscode.Position): Position {
    return new Position(pos.line, pos.character);
  }

  /**
   * Returns which of the 2 provided Positions comes earlier in the document.
   */
  public static EarlierOf(p1: Position, p2: Position): Position {
    if (p1.line < p2.line) {
      return p1;
    }
    if (p1.line === p2.line && p1.character < p2.character) {
      return p1;
    }

    return p2;
  }

  public isEarlierThan(other: Position): boolean {
    if (this.line < other.line) {
      return true;
    }
    if (this.line === other.line && this.character < other.character) {
      return true;
    }

    return false;
  }

  /**
   * Iterates over every position in the document starting at start, returning
   * at every position the current line text, character text, and a position object.
   */
  public static *IterateDocument(
    start: Position,
    forward = true
  ): Iterable<{ line: string; char: string; pos: Position }> {
    let lineIndex: number, charIndex: number;

    if (forward) {
      for (lineIndex = start.line; lineIndex < TextEditor.getLineCount(); lineIndex++) {
        charIndex = lineIndex === start.line ? start.character : 0;
        const line = TextEditor.getLineAt(new Position(lineIndex, 0)).text;

        for (; charIndex < line.length; charIndex++) {
          yield {
            line: line,
            char: line[charIndex],
            pos: new Position(lineIndex, charIndex),
          };
        }
      }
    } else {
      for (lineIndex = start.line; lineIndex >= 0; lineIndex--) {
        const line = TextEditor.getLineAt(new Position(lineIndex, 0)).text;
        charIndex = lineIndex === start.line ? start.character : line.length - 1;

        for (; charIndex >= 0; charIndex--) {
          yield {
            line: line,
            char: line[charIndex],
            pos: new Position(lineIndex, charIndex),
          };
        }
      }
    }
  }

  /**
   * Iterate over every position in the block defined by the two positions passed in.
   */
  public static *IterateBlock(
    topLeft: Position,
    bottomRight: Position
  ): Iterable<{ line: string; char: string; pos: Position }> {
    for (let lineIndex = topLeft.line; lineIndex <= bottomRight.line; lineIndex++) {
      const line = TextEditor.getLineAt(new Position(lineIndex, 0)).text;

      for (let charIndex = topLeft.character; charIndex < bottomRight.character + 1; charIndex++) {
        yield {
          line: line,
          char: line[charIndex],
          pos: new Position(lineIndex, charIndex),
        };
      }
    }
  }

  /**
   * Iterate over every position in the selection defined by the two positions passed in.
   */
  public static *IterateSelection(
    topLeft: Position,
    bottomRight: Position
  ): Iterable<{ line: string; char: string; pos: Position }> {
    for (let lineIndex = topLeft.line; lineIndex <= bottomRight.line; lineIndex++) {
      const line = TextEditor.getLineAt(new Position(lineIndex, 0)).text;

      if (lineIndex === topLeft.line) {
        for (let charIndex = topLeft.character; charIndex < line.length + 1; charIndex++) {
          yield {
            line: line,
            char: line[charIndex],
            pos: new Position(lineIndex, charIndex),
          };
        }
      } else if (lineIndex === bottomRight.line) {
        for (let charIndex = 0; charIndex < bottomRight.character + 1; charIndex++) {
          yield {
            line: line,
            char: line[charIndex],
            pos: new Position(lineIndex, charIndex),
          };
        }
      } else {
        for (let charIndex = 0; charIndex < line.length + 1; charIndex++) {
          yield {
            line: line,
            char: line[charIndex],
            pos: new Position(lineIndex, charIndex),
          };
        }
      }
    }
  }

  // Iterates through words on the same line, starting from the current position.
  public static *IterateWords(
    start: Position
  ): Iterable<{ start: Position; end: Position; word: string }> {
    const text = TextEditor.getLineAt(start).text;
    let wordEnd = start.getCurrentWordEnd(true);
    do {
      const word = text.substring(start.character, wordEnd.character + 1);
      yield {
        start: start,
        end: wordEnd,
        word: word,
      };

      if (wordEnd.getRight().isLineEnd()) {
        return;
      }
      start = start.getWordRight();
      wordEnd = start.getCurrentWordEnd(true);
    } while (true);
  }

  /**
   * Returns which of the 2 provided Positions comes later in the document.
   */
  public static LaterOf(p1: Position, p2: Position): Position {
    if (Position.EarlierOf(p1, p2) === p1) {
      return p2;
    }

    return p1;
  }

  /**
   * Subtracts another position from this one, returning the
   * difference between the two.
   */
  public subtract(other: Position): PositionDiff {
    return new PositionDiff(this.line - other.line, this.character - other.character);
  }

  /**
   * Adds a PositionDiff to this position, returning a new
   * position.
   */
  public add(diff: PositionDiff, { boundsCheck = true } = {}): Position {
    let resultChar = this.character + diff.character;
    let resultLine = this.line + diff.line;

    if (diff.isBOLDiff()) {
      resultChar = diff.character;
    }

    if (boundsCheck) {
      if (resultChar < 0) {
        resultChar = 0;
      }
      if (resultLine < 0) {
        resultLine = 0;
      }
      if (resultLine >= TextEditor.getLineCount() - 1) {
        resultLine = TextEditor.getLineCount() - 1;
      }
    }

    return new Position(resultLine, resultChar);
  }

  public setLocation(line: number, character: number): Position {
    let position = new Position(line, character);
    return position;
  }

  /**
   * Gets the position one to the left of this position. Does not go up line
   * breaks.
   */
  public getLeft(): Position {
    if (!this.isLineBeginning()) {
      return new Position(this.line, this.character - 1);
    }

    return this;
  }

  /**
   * Same as getLeft, but goes up to the previous line on line
   * breaks.
   *
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
      return this.getUp(0).getLineEnd();
    } else {
      return this.getUp(0)
        .getLineEnd()
        .getLeft();
    }
  }

  public getRight(count: number = 1): Position {
    if (!this.isLineEnd()) {
      return new Position(this.line, this.character + count);
    }

    return this;
  }

  /**
   * Get the position of the line directly below the current line.
   */
  public getDown(desiredColumn: number): Position {
    if (this.getDocumentEnd().line !== this.line) {
      let nextLine = this.line + 1;
      let nextLineLength = Position.getLineLength(nextLine);

      return new Position(nextLine, Math.min(nextLineLength, desiredColumn));
    }

    return this;
  }

  /**
   * Get the position of the line directly above the current line.
   */
  public getUp(desiredColumn: number): Position {
    if (this.getDocumentBegin().line !== this.line) {
      let prevLine = this.line - 1;
      let prevLineLength = Position.getLineLength(prevLine);

      return new Position(prevLine, Math.min(prevLineLength, desiredColumn));
    }

    return this;
  }

  /**
   * Get the position *count* lines down from this position, but not lower
   * than the end of the document.
   */
  public getDownByCount(count = 0, { boundsCheck = true } = {}): Position {
    const line = boundsCheck
      ? Math.min(TextEditor.getLineCount() - 1, this.line + count)
      : this.line + count;

    return new Position(line, this.character);
  }

  /**
   * Get the position *count* lines up from this position, but not higher
   * than the end of the document.
   */
  public getUpByCount(count = 0): Position {
    return new Position(Math.max(0, this.line - count), this.character);
  }

  /**
   * Get the position *count* lines left from this position, but not farther
   * than the beginning of the line
   */
  public getLeftByCount(count = 0): Position {
    return new Position(this.line, Math.max(0, this.character - count));
  }

  /**
   * Get the position *count* lines right from this position, but not farther
   * than the end of the line
   */
  public getRightByCount(count = 0): Position {
    return new Position(
      this.line,
      Math.min(TextEditor.getLineAt(this).text.length - 1, this.character + count)
    );
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(this._nonWordCharRegex, inclusive);
  }

  public getBigWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(this._nonBigWordCharRegex, inclusive);
  }

  public getFilePathLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(this._nonFileNameRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(this._nonWordCharRegex, inclusive);
  }

  public getBigWordRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(this._nonBigWordCharRegex);
  }

  public getFilePathRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(this._nonFileNameRegex, inclusive);
  }

  public getLastWordEnd(): Position {
    return this.getLastWordEndWithRegex(this._nonWordCharRegex);
  }

  public getLastBigWordEnd(): Position {
    return this.getLastWordEndWithRegex(this._nonBigWordCharRegex);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(this._nonWordCharRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentBigWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(this._nonBigWordCharRegex, inclusive);
  }

  /**
   * Get the boundary position of the section.
   */
  public getSectionBoundary(args: { forward: boolean; boundary: string }): Position {
    let pos: Position = this;

    if (
      (args.forward && pos.line === TextEditor.getLineCount() - 1) ||
      (!args.forward && pos.line === 0)
    ) {
      return pos.getFirstLineNonBlankChar();
    }

    pos = args.forward ? pos.getDown(0) : pos.getUp(0);

    while (!TextEditor.getLineAt(pos).text.startsWith(args.boundary)) {
      if (args.forward) {
        if (pos.line === TextEditor.getLineCount() - 1) {
          break;
        }

        pos = pos.getDown(0);
      } else {
        if (pos.line === 0) {
          break;
        }

        pos = pos.getUp(0);
      }
    }

    return pos.getFirstLineNonBlankChar();
  }

  /**
   * Get the end of the current paragraph.
   */
  public getCurrentParagraphEnd(): Position {
    let pos: Position = this;

    // If we're not in a paragraph yet, go down until we are.
    while (TextEditor.getLineAt(pos).text === '' && !TextEditor.isLastLine(pos)) {
      pos = pos.getDown(0);
    }

    // Go until we're outside of the paragraph, or at the end of the document.
    while (TextEditor.getLineAt(pos).text !== '' && pos.line < TextEditor.getLineCount() - 1) {
      pos = pos.getDown(0);
    }

    return pos.getLineEnd();
  }

  /**
   * Get the beginning of the current paragraph.
   */
  public getCurrentParagraphBeginning(): Position {
    let pos: Position = this;

    // If we're not in a paragraph yet, go up until we are.
    while (TextEditor.getLineAt(pos).text === '' && !TextEditor.isFirstLine(pos)) {
      pos = pos.getUp(0);
    }

    // Go until we're outside of the paragraph, or at the beginning of the document.
    while (pos.line > 0 && TextEditor.getLineAt(pos).text !== '') {
      pos = pos.getUp(0);
    }

    return pos.getLineBegin();
  }

  public getSentenceBegin(args: { forward: boolean }): Position {
    if (args.forward) {
      return this.getNextSentenceBeginWithRegex(this._sentenceEndRegex, false);
    } else {
      return this.getPreviousSentenceBeginWithRegex(this._sentenceEndRegex, false);
    }
  }

  public getCurrentSentenceEnd(): Position {
    return this.getCurrentSentenceEndWithRegex(this._sentenceEndRegex, false);
  }

  /**
   * Get the beginning of the current line.
   */
  public getLineBegin(): Position {
    return new Position(this.line, 0);
  }

  /**
   * Get the beginning of the next line.
   */
  public getPreviousLineBegin(): Position {
    if (this.line === 0) {
      return this.getLineBegin();
    }

    return new Position(this.line - 1, 0);
  }

  /**
   * Get the beginning of the next line.
   */
  public getNextLineBegin(): Position {
    if (this.line >= TextEditor.getLineCount() - 1) {
      return this.getLineEnd();
    }

    return new Position(this.line + 1, 0);
  }

  /**
   * Returns a new position at the end of this position's line.
   */
  public getLineEnd(): Position {
    return new Position(this.line, Position.getLineLength(this.line));
  }

  /**
   * Returns a new position at the end of this position's line, including the
   * invisible newline character.
   */
  public getLineEndIncludingEOL(): Position {
    return new Position(this.line, Position.getLineLength(this.line) + 1);
  }

  public getDocumentBegin(): Position {
    return new Position(0, 0);
  }

  /**
   * Returns a new Position one to the left if this position is on the EOL. Otherwise,
   * returns this position.
   */
  public getLeftIfEOL(): Position {
    if (this.character === Position.getLineLength(this.line)) {
      return this.getLeft();
    } else {
      return this;
    }
  }

  /**
   * Get the position that the cursor would be at if you
   * pasted *text* at the current position.
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

  public getDocumentEnd(): Position {
    let lineCount = TextEditor.getLineCount();
    let line = lineCount > 0 ? lineCount - 1 : 0;
    let char = Position.getLineLength(line);

    return new Position(line, char);
  }

  public isValid(): boolean {
    try {
      // line
      let lineCount = TextEditor.getLineCount() || 1;
      if (this.line >= lineCount) {
        return false;
      }

      // char
      let charCount = Position.getLineLength(this.line);
      if (this.character > charCount + 1) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return true;
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
    return this.character >= Position.getLineLength(this.line);
  }

  public isFirstWordOfLine(): boolean {
    return Position.getFirstNonBlankCharAtLine(this.line) === this.character;
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

  public static getFirstNonBlankCharAtLine(line: number): number {
    return TextEditor.readLineAt(line).match(/^\s*/)![0].length;
  }

  /**
   * The position of the first character on this line which is not whitespace.
   */
  public getFirstLineNonBlankChar(): Position {
    return new Position(this.line, Position.getFirstNonBlankCharAtLine(this.line));
  }

  public static getLineLength(line: number): number {
    return TextEditor.readLineAt(line).length;
  }

  private makeWordRegex(characterSet: string): RegExp {
    let escaped = characterSet && betterEscapeRegex(characterSet);
    let segments: string[] = [];

    segments.push(`([^\\s${escaped}]+)`);
    segments.push(`[${escaped}]+`);
    segments.push(`$^`);
    let result = new RegExp(segments.join('|'), 'g');

    return result;
  }

  private getAllPositions(line: string, regex: RegExp): number[] {
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

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  private getWordLeftWithRegex(regex: RegExp, inclusive: boolean = false): Position {
    for (let currentLine = this.line; currentLine >= 0; currentLine--) {
      let positions = this.getAllPositions(
        TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
        regex
      );
      let newCharacter = _.find(
        positions.reverse(),
        index =>
          (index < this.character && !inclusive) ||
          (index <= this.character && inclusive) ||
          currentLine !== this.line
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }

    return new Position(0, 0).getLineBegin();
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  private getWordRightWithRegex(regex: RegExp, inclusive: boolean = false): Position {
    for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
      let positions = this.getAllPositions(
        TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
        regex
      );
      let newCharacter = _.find(
        positions,
        index =>
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
    for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
      let positions = this.getAllEndPositions(
        TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
        regex
      );
      let index = _.findIndex(positions, i => i >= this.character || currentLine !== this.line);
      let newCharacter = 0;
      if (index === -1) {
        newCharacter = positions[positions.length - 1];
      } else if (index > 0) {
        newCharacter = positions[index - 1];
      }

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }

    return new Position(TextEditor.getLineCount() - 1, 0).getLineEnd();
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  private getCurrentWordEndWithRegex(regex: RegExp, inclusive: boolean): Position {
    for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
      let positions = this.getAllEndPositions(
        TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
        regex
      );
      let newCharacter = _.find(
        positions,
        index =>
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

  private getPreviousSentenceBeginWithRegex(regex: RegExp, inclusive: boolean): Position {
    let paragraphBegin = this.getCurrentParagraphBeginning();
    for (let currentLine = this.line; currentLine >= paragraphBegin.line; currentLine--) {
      let endPositions = this.getAllEndPositions(
        TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
        regex
      );
      let newCharacter = _.find(
        endPositions.reverse(),
        index =>
          (index < this.character &&
            !inclusive &&
            new Position(currentLine, index).getRightThroughLineBreaks().compareTo(this)) ||
          (index <= this.character && inclusive) ||
          currentLine !== this.line
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter).getRightThroughLineBreaks();
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
      let endPositions = this.getAllEndPositions(
        TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
        regex
      );
      let newCharacter = _.find(
        endPositions,
        index =>
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
      let allPositions = this.getAllPositions(
        TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
        regex
      );
      let newCharacter = _.find(
        allPositions,
        index =>
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
    // Find the first non-whitepsace character.
    if (TextEditor.getLineAt(new vscode.Position(this.line, 0)).text) {
      return paragraphEnd;
    } else {
      for (let currentLine = this.line; currentLine <= paragraphEnd.line; currentLine++) {
        let nonWhitePositions = this.getAllPositions(
          TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text,
          /\S/g
        );
        let newCharacter = _.find(
          nonWhitePositions,
          index =>
            (index > this.character && !inclusive) ||
            (index >= this.character && inclusive) ||
            currentLine !== this.line
        );

        if (newCharacter !== undefined) {
          return new Position(currentLine, newCharacter);
        }
      }
    }

    throw new Error('This should never happen...');
  }

  private findHelper(char: string, count: number, direction: number): Position | undefined {
    // -1 = backwards, +1 = forwards
    const line = TextEditor.getLineAt(this);
    let index = this.character;

    while (count && index !== -1) {
      if (direction > 0) {
        index = line.text.indexOf(char, index + direction);
      } else {
        index = line.text.lastIndexOf(char, index + direction);
      }
      count--;
    }

    if (index > -1) {
      return new Position(this.line, index);
    }

    return undefined;
  }

  public tilForwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, +1);
    if (!position) {
      return null;
    }

    return new Position(this.line, position.character - 1);
  }

  public tilBackwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, -1);
    if (!position) {
      return null;
    }

    return new Position(this.line, position.character + 1);
  }

  public findForwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, +1);
    if (!position) {
      return null;
    }

    return new Position(this.line, position.character);
  }

  public findBackwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, -1);
    if (!position) {
      return null;
    }

    return position;
  }
}
