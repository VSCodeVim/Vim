import * as vscode from 'vscode';
import * as _ from 'lodash';

import { VimState } from '../../state/vimState';
import { configuration } from './../../configuration/configuration';
import { TextEditor } from './../../textEditor';
import { visualBlockGetTopLeftPosition, visualBlockGetBottomRightPosition } from '../../mode/mode';
import { clamp } from '../../util/util';
import { Range } from './range';

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

  /**
   * Add this PositionDiff to another PositionDiff.
   */
  public addDiff(other: PositionDiff) {
    if (this.type !== PositionDiffType.Offset || other.type !== PositionDiffType.Offset) {
      throw new Error("johnfn hasn't done this case yet and doesnt want to");
    }

    return new PositionDiff({
      line: this.line + other.line,
      character: this.character + other.character,
    });
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

export class Position extends vscode.Position {
  private static NonWordCharacters = configuration.iskeyword!;
  private static NonBigWordCharacters = '';
  private static NonFileCharacters = '"\'`;<>{}[]()';

  private static _nonWordCharRegex: RegExp = Position.makeUnicodeWordRegex(
    Position.NonWordCharacters
  );
  private static _nonBigWordCharRegex: RegExp = Position.makeWordRegex(
    Position.NonBigWordCharacters
  );
  private static _nonCamelCaseWordCharRegex: RegExp = Position.makeCamelCaseWordRegex(
    Position.NonWordCharacters
  );
  private static _sentenceEndRegex: RegExp = /[\.!\?]{1}([ \n\t]+|$)/g;
  private static _nonFileNameRegex: RegExp = Position.makeWordRegex(Position.NonFileCharacters);

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
   * Returns which of the 2 provided Positions comes earlier in the document.
   */
  public static EarlierOf(p1: Position, p2: Position): Position {
    return p1.isBefore(p2) ? p1 : p2;
  }

  /**
   * Returns which of the 2 provided Positions comes later in the document.
   */
  public static LaterOf(p1: Position, p2: Position): Position {
    return p1.isBefore(p2) ? p2 : p1;
  }

  /**
   * Iterates over every position in the document starting at start, returning
   * at every position the current line text, character text, and a position object.
   */
  public static *IterateDocument(
    start: Position,
    forward = true
  ): Iterable<{ line: string; char: string; pos: Position }> {
    if (forward) {
      for (let lineIndex = start.line; lineIndex < TextEditor.getLineCount(); lineIndex++) {
        const line = TextEditor.getLine(lineIndex).text;

        let charIndex = lineIndex === start.line ? start.character : 0;
        for (; charIndex < line.length; charIndex++) {
          yield {
            line: line,
            char: line[charIndex],
            pos: new Position(lineIndex, charIndex),
          };
        }
      }
    } else {
      for (let lineIndex = start.line; lineIndex >= 0; lineIndex--) {
        const line = TextEditor.getLine(lineIndex).text;

        let charIndex = lineIndex === start.line ? start.character : line.length - 1;
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
      const line = TextEditor.getLine(lineIndex).text;

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
      const line = TextEditor.getLine(lineIndex).text;

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

  /**
   * Iterate over every line in the block defined by the two positions (Range) passed in.
   * If no range is given, the primary cursor will be used as the block.
   *
   * This is intended for visual block mode.
   */
  public static *IterateLinesInBlock(
    vimState: VimState,
    range?: Range,
    options: { reverse?: boolean } = { reverse: false }
  ): Iterable<{ line: string; start: Position; end: Position }> {
    const { reverse } = options;

    if (range === undefined) {
      range = vimState.cursors[0];
    }

    const topLeft = visualBlockGetTopLeftPosition(range.start, range.stop);
    const bottomRight = visualBlockGetBottomRightPosition(range.start, range.stop);

    const itrStart = reverse ? bottomRight.line : topLeft.line;
    const itrEnd = reverse ? topLeft.line : bottomRight.line;

    const runToLineEnd = vimState.desiredColumn === Number.POSITIVE_INFINITY;

    for (
      let lineIndex = itrStart;
      reverse ? lineIndex >= itrEnd : lineIndex <= itrEnd;
      reverse ? lineIndex-- : lineIndex++
    ) {
      const line = TextEditor.getLine(lineIndex).text;
      const endCharacter = runToLineEnd
        ? line.length + 1
        : Math.min(line.length, bottomRight.character + 1);

      yield {
        line: line.substring(topLeft.character, endCharacter),
        start: new Position(lineIndex, topLeft.character),
        end: new Position(lineIndex, endCharacter),
      };
    }
  }

  /**
   * Iterates through words on the same line, starting from the current position.
   */
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

  public withLine(line: number): Position {
    line = clamp(line, 0, TextEditor.getLineCount() - 1);
    return new Position(line, this.character);
  }

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
   * Gets the position one or more to the left of this position. Does not go up line
   * breaks.
   */
  public getLeft(count: number = 1): Position {
    let newCharacter = Math.max(this.character - count, 0);
    if (newCharacter !== this.character) {
      return new Position(this.line, newCharacter);
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
      return this.getUp(0).getLineEnd().getLeft();
    }
  }

  public getRightThroughLineBreaks(includeEol = false): Position {
    if (this.isAtDocumentEnd()) {
      // TODO(bell)
      return this;
    }

    if (this.isLineEnd()) {
      return this.getDown(0);
    }

    if (!includeEol && this.getRight().isLineEnd()) {
      return this.getDown(0);
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
      let nextLineLength = TextEditor.getLineLength(nextLine);

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
      let prevLineLength = TextEditor.getLineLength(prevLine);

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
    return Position.getWordLeftWithRegex(text, pos, Position._nonWordCharRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(Position._nonWordCharRegex, inclusive);
  }

  public getBigWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(Position._nonBigWordCharRegex, inclusive);
  }

  public getCamelCaseWordLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(Position._nonCamelCaseWordCharRegex, inclusive);
  }

  public getFilePathLeft(inclusive: boolean = false): Position {
    return this.getWordLeftWithRegex(Position._nonFileNameRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getWordRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(Position._nonWordCharRegex, inclusive);
  }

  public getBigWordRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(Position._nonBigWordCharRegex);
  }

  public getCamelCaseWordRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(Position._nonCamelCaseWordCharRegex);
  }

  public getFilePathRight(inclusive: boolean = false): Position {
    return this.getWordRightWithRegex(Position._nonFileNameRegex, inclusive);
  }

  public getLastWordEnd(): Position {
    return this.getLastWordEndWithRegex(Position._nonWordCharRegex);
  }

  public getLastBigWordEnd(): Position {
    return this.getLastWordEndWithRegex(Position._nonBigWordCharRegex);
  }

  public getLastCamelCaseWordEnd(): Position {
    return this.getLastWordEndWithRegex(Position._nonCamelCaseWordCharRegex);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(Position._nonWordCharRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentBigWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(Position._nonBigWordCharRegex, inclusive);
  }

  /**
   * Inclusive is true if we consider the current position a valid result, false otherwise.
   */
  public getCurrentCamelCaseWordEnd(inclusive: boolean = false): Position {
    return this.getCurrentWordEndWithRegex(Position._nonCamelCaseWordCharRegex, inclusive);
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
  public getCurrentParagraphEnd(trimWhite: boolean = false): Position {
    let pos: Position = this;

    // If we're not in a paragraph yet, go down until we are.
    while (pos.isLineBlank(trimWhite) && !TextEditor.isLastLine(pos)) {
      pos = pos.getDown(0);
    }

    // Go until we're outside of the paragraph, or at the end of the document.
    while (!pos.isLineBlank(trimWhite) && pos.line < TextEditor.getLineCount() - 1) {
      pos = pos.getDown(0);
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
      pos = pos.getUp(0);
    }

    // Go until we're outside of the paragraph, or at the beginning of the document.
    while (pos.line > 0 && !pos.isLineBlank(trimWhite)) {
      pos = pos.getUp(0);
    }

    return pos.getLineBegin();
  }

  public isLineBlank(trimWhite: boolean = false): boolean {
    let text = TextEditor.getLineAt(this).text;
    return (trimWhite ? text.trim() : text) === '';
  }

  /**
   * Returns true if the line this Position is on consists of only whitespace.
   */
  public isLineWhite(): boolean {
    return this.isLineBlank(true);
  }

  public getSentenceBegin(args: { forward: boolean }): Position {
    if (args.forward) {
      return this.getNextSentenceBeginWithRegex(Position._sentenceEndRegex, false);
    } else {
      return this.getPreviousSentenceBeginWithRegex(Position._sentenceEndRegex);
    }
  }

  public getCurrentSentenceEnd(): Position {
    return this.getCurrentSentenceEndWithRegex(Position._sentenceEndRegex, false);
  }

  /**
   * Get the beginning of the current line.
   */
  public getLineBegin(): Position {
    return new Position(this.line, 0);
  }

  /**
   * Get the beginning of the line, excluding preceeding whitespace.
   * This respects the `autoindent` setting, and returns `getLineBegin()` if auto-indent
   * is disabled.
   */
  public getLineBeginRespectingIndent(): Position {
    if (!configuration.autoindent) {
      return this.getLineBegin();
    }
    return this.getFirstLineNonBlankChar();
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
    return new Position(this.line, TextEditor.getLineLength(this.line));
  }

  /**
   * Returns a new position at the end of this position's line, including the
   * invisible newline character.
   */
  public getLineEndIncludingEOL(): Position {
    return new Position(this.line, TextEditor.getLineLength(this.line) + 1);
  }

  public getDocumentBegin(): Position {
    return new Position(0, 0);
  }

  /**
   * Returns a new Position one to the left if this position is on the EOL. Otherwise,
   * returns this position.
   */
  public getLeftIfEOL(): Position {
    if (this.character === TextEditor.getLineLength(this.line)) {
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

  public getDocumentEnd(textEditor?: vscode.TextEditor): Position {
    const lineCount = TextEditor.getLineCount(textEditor);
    const line = lineCount > 0 ? lineCount - 1 : 0;
    const char = TextEditor.getLineLength(line);

    return new Position(line, char);
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
    return Position.getFirstNonBlankCharAtLine(this.line) === this.character;
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

  public static getFirstNonBlankCharAtLine(line: number): number {
    return TextEditor.readLineAt(line).match(/^\s*/)![0].length;
  }

  /**
   * The position of the first character on this line which is not whitespace.
   */
  public getFirstLineNonBlankChar(): Position {
    return new Position(this.line, Position.getFirstNonBlankCharAtLine(this.line));
  }

  /**
   * If `vim.startofline` is set, get first non-blank character's position.
   */
  public obeyStartOfLine(): Position {
    return configuration.startofline ? this.getFirstLineNonBlankChar() : this;
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

  private static makeWordRegex(characterSet: string): RegExp {
    let escaped = characterSet && _.escapeRegExp(characterSet).replace(/-/g, '\\-');
    let segments: string[] = [];

    segments.push(`([^\\s${escaped}]+)`);
    segments.push(`[${escaped}]+`);
    segments.push(`$^`);
    let result = new RegExp(segments.join('|'), 'g');

    return result;
  }

  private static makeCamelCaseWordRegex(characterSet: string): RegExp {
    const escaped = characterSet && _.escapeRegExp(characterSet).replace(/-/g, '\\-');
    const segments: string[] = [];

    // old versions of VSCode before 1.31 will crash when trying to parse a regex with a lookbehind
    let supportsLookbehind = true;
    try {
      // tslint:disable-next-line
      new RegExp('(<=x)');
    } catch {
      supportsLookbehind = false;
    }

    // prettier-ignore
    const firstSegment =
      '(' +                                                // OPEN: group for matching camel case words
      `[^\\s${escaped}]` +                                 //   words can start with any word character
      '(?:' +                                              //   OPEN: group for characters after initial char
      `(?:${supportsLookbehind ? '(?<=[A-Z_])' : ''}` +    //     If first char was a capital
      `[A-Z](?=[\\sA-Z0-9${escaped}_]))+` +                //       the word can continue with all caps
      '|' +                                                //     OR
      `(?:${supportsLookbehind ? '(?<=[0-9_])' : ''}`   +  //     If first char was a digit
      `[0-9](?=[\\sA-Z0-9${escaped}_]))+` +                //       the word can continue with all digits
      '|' +                                                //     OR
      `(?:${supportsLookbehind ? '(?<=[_])' : ''}` +       //     If first char was an underscore
      `[_](?=[\\s${escaped}_]))+`  +                       //       the word can continue with all underscores
      '|' +                                                //     OR
      `[^\\sA-Z0-9${escaped}_]*` +                         //     Continue with regular characters
      ')' +                                                //   END: group for characters after initial char
      ')' +                                                // END: group for matching camel case words
      '';

    segments.push(firstSegment);
    segments.push(`[${escaped}]+`);
    segments.push(`$^`);

    // it can be difficult to grok the behavior of the above regex
    // feel free to check out https://regex101.com/r/mkVeiH/1 as a live example
    const result = new RegExp(segments.join('|'), 'g');

    return result;
  }

  private static makeUnicodeWordRegex(keywordChars: string): RegExp {
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
    const regexp = new RegExp(segments.join('|'), 'ug');
    return regexp;
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
    const positions = Position.getAllPositions(text, regex);
    return positions
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

    return new Position(0, 0).getLineBegin();
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

    return new Position(0, 0).getLineBegin();
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

  private findHelper(
    char: string,
    count: number,
    direction: 'forward' | 'backward'
  ): Position | undefined {
    const line = TextEditor.getLineAt(this);
    let index = this.character;

    while (count && index !== -1) {
      if (direction === 'forward') {
        index = line.text.indexOf(char, index + 1);
      } else {
        index = line.text.lastIndexOf(char, index - 1);
      }
      count--;
    }

    if (index > -1) {
      return new Position(this.line, index);
    }

    return undefined;
  }

  public tilForwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, 'forward');
    if (!position) {
      return null;
    }

    return new Position(this.line, position.character - 1);
  }

  public tilBackwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, 'backward');
    if (!position) {
      return null;
    }

    return new Position(this.line, position.character + 1);
  }

  public findForwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, 'forward');
    if (!position) {
      return null;
    }

    return new Position(this.line, position.character);
  }

  public findBackwards(char: string, count: number = 1): Position | null {
    const position = this.findHelper(char, count, 'backward');
    if (!position) {
      return null;
    }

    return position;
  }
}
