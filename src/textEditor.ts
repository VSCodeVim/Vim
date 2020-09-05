import * as vscode from 'vscode';

import { Position } from './common/motion/position';
import { configuration } from './configuration/configuration';
import { VimState } from './state/vimState';
import { visualBlockGetTopLeftPosition, visualBlockGetBottomRightPosition } from './mode/mode';
import { Range } from './common/motion/range';

/**
 * Collection of helper functions around vscode.window.activeTextEditor
 */
export class TextEditor {
  static readonly whitespaceRegExp = new RegExp('\\s+');

  // TODO: Refactor args

  /**
   * Verify that a tab is even open for the TextEditor to act upon.
   *
   * This class was designed assuming there will usually be an active editor
   * to act upon, which is usually true with editor hotkeys.
   *
   * But there are cases where an editor won't be active, such as running
   * code on VSCodeVim activation, where you might see the error:
   * > [Extension Host] Here is the error stack:
   * > TypeError: Cannot read property 'document' of undefined
   */
  static get isActive() {
    return vscode.window.activeTextEditor != null;
  }

  /**
   * @deprecated Use InsertTextTransformation (or InsertTextVSCodeTransformation) instead.
   */
  static async insert(
    text: string,
    at: Position | undefined = undefined,
    letVSCodeHandleKeystrokes: boolean | undefined = undefined
  ): Promise<void> {
    // If we insert "blah(" with default:type, VSCode will insert the closing ).
    // We *probably* don't want that to happen if we're inserting a lot of text.
    letVSCodeHandleKeystrokes ??= text.length === 1;

    if (!letVSCodeHandleKeystrokes) {
      // const selections = vscode.window.activeTextEditor!.selections.slice(0);

      await vscode.window.activeTextEditor!.edit((editBuilder) => {
        if (!at) {
          at = Position.FromVSCodePosition(vscode.window.activeTextEditor!.selection.active);
        }

        editBuilder.insert(at, text);
      });

      // maintain all selections in multi-cursor mode.
      // vscode.window.activeTextEditor!.selections = selections;
    } else {
      await vscode.commands.executeCommand('default:type', { text });
    }
  }

  /**
   * @deprecated Use InsertTextTransformation (or InsertTextVSCodeTransformation) instead.
   */
  static async insertAt(text: string, position: vscode.Position): Promise<boolean> {
    return vscode.window.activeTextEditor!.edit((editBuilder) => {
      editBuilder.insert(position, text);
    });
  }

  /**
   * @deprecated Use DeleteTextTransformation or DeleteTextRangeTransformation instead.
   */
  static async delete(range: vscode.Range): Promise<boolean> {
    return vscode.window.activeTextEditor!.edit((editBuilder) => {
      editBuilder.delete(range);
    });
  }

  static getDocumentVersion(): number {
    return vscode.window.activeTextEditor!.document.version;
  }

  static getDocumentName(): String {
    return vscode.window.activeTextEditor!.document.fileName;
  }

  /**
   * @deprecated. Use ReplaceTextTransformation instead.
   */
  static async replace(range: vscode.Range, text: string): Promise<boolean> {
    return vscode.window.activeTextEditor!.edit((editBuilder) => {
      editBuilder.replace(range, text);
    });
  }

  static readLineAt(lineNo: number): string {
    if (lineNo === null) {
      lineNo = vscode.window.activeTextEditor!.selection.active.line;
    }

    if (lineNo >= vscode.window.activeTextEditor!.document.lineCount) {
      throw new RangeError();
    }

    return vscode.window.activeTextEditor!.document.lineAt(lineNo).text;
  }

  static getLineCount(textEditor?: vscode.TextEditor): number {
    textEditor ??= vscode.window.activeTextEditor;
    return textEditor?.document.lineCount ?? -1;
  }

  public static getLineLength(line: number): number {
    if (line < 0 || line > TextEditor.getLineCount()) {
      throw new Error(`getLineLength() called with out-of-bounds line ${line}`);
    }

    return TextEditor.readLineAt(line).length;
  }

  static getLine(lineNumber: number): vscode.TextLine {
    return vscode.window.activeTextEditor!.document.lineAt(lineNumber);
  }

  static getLineAt(position: vscode.Position): vscode.TextLine {
    return vscode.window.activeTextEditor!.document.lineAt(position);
  }

  static getCharAt(position: Position): string {
    const line = TextEditor.getLineAt(position);

    return line.text[position.character];
  }

  static getSelection(): vscode.Range {
    return vscode.window.activeTextEditor!.selection;
  }

  static getText(selection?: vscode.Range): string {
    return vscode.window.activeTextEditor!.document.getText(selection);
  }

  /**
   * Retrieves the word at the given position.
   *
   * Respects `iskeyword`:
   *    - Will go right (but not over line boundaries) until it finds a "real" word
   *    - Will settle for a "fake" word only if it hits the line end
   */
  static getWord(position: Position): string | undefined {
    const line = TextEditor.getLineAt(position).text;

    // Skip over whitespace
    let firstNonBlank = position.character;
    while (this.whitespaceRegExp.test(line[firstNonBlank])) {
      firstNonBlank++;
      if (firstNonBlank === line.length) {
        // Hit end of line without finding a non-whitespace character
        return undefined;
      }
    }

    // Now skip over word separators and whitespace to find a "real" word
    let start = firstNonBlank;
    while (
      configuration.iskeyword.includes(line[start]) ||
      this.whitespaceRegExp.test(line[start])
    ) {
      start++;
      if (start === line.length) {
        // No keyword found - just settle for the word we're on
        start = firstNonBlank;
        break;
      }
    }

    const foundRealWord = !configuration.iskeyword.includes(line[start]);
    const includeInWord = (char: string) =>
      !this.whitespaceRegExp.test(char) && configuration.iskeyword.includes(char) !== foundRealWord;

    // Expand left and right to find the whole word
    let end = start;
    while (start > 0 && includeInWord(line[start - 1])) {
      start--;
    }
    while (end < line.length && includeInWord(line[end + 1])) {
      end++;
    }

    return line.substring(start, end + 1);
  }

  static getTabCharacter(editor: vscode.TextEditor): string {
    if (editor.options.insertSpaces) {
      // This will always be a number when we're getting it from the options
      const tabSize = editor.options.tabSize as number;
      return ' '.repeat(tabSize);
    }
    return '\t';
  }

  static isFirstLine(position: vscode.Position): boolean {
    return position.line === 0;
  }

  static isLastLine(position: vscode.Position): boolean {
    return position.line === vscode.window.activeTextEditor!.document.lineCount - 1;
  }

  /**
   * @returns the number of visible columns that the given line begins with
   */
  static getIndentationLevel(line: string): number {
    let visibleColumn = 0;
    for (const char of line) {
      switch (char) {
        case '\t':
          visibleColumn += configuration.tabstop;
          break;
        case ' ':
          visibleColumn += 1;
          break;
        default:
          return visibleColumn;
      }
    }

    return visibleColumn;
  }

  /**
   * @returns `line` with its indentation replaced with `screenCharacters` visible columns of whitespace
   */
  static setIndentationLevel(line: string, screenCharacters: number): string {
    const tabSize = configuration.tabstop;

    if (screenCharacters < 0) {
      screenCharacters = 0;
    }

    const indentString = configuration.expandtab
      ? ' '.repeat(screenCharacters)
      : '\t'.repeat(screenCharacters / tabSize) + ' '.repeat(screenCharacters % tabSize);

    return line.replace(/^\s*/, indentString);
  }

  static getPositionAt(offset: number): Position {
    const pos = vscode.window.activeTextEditor!.document.positionAt(offset);
    return Position.FromVSCodePosition(pos);
  }

  static getOffsetAt(position: vscode.Position): number {
    return vscode.window.activeTextEditor!.document.offsetAt(position);
  }

  static getDocumentBegin(): Position {
    return new Position(0, 0);
  }

  static getDocumentEnd(textEditor?: vscode.TextEditor): Position {
    const lineCount = TextEditor.getLineCount(textEditor);
    const line = lineCount > 0 ? lineCount - 1 : 0;
    const char = TextEditor.getLineLength(line);

    return new Position(line, char);
  }

  /**
   * @returns the Position of the first character on the given line which is not whitespace.
   * If it's all whitespace, will return the Position of the EOL character.
   */
  public static getFirstNonWhitespaceCharOnLine(line: number): Position {
    return new Position(line, TextEditor.getLine(line).firstNonWhitespaceCharacterIndex);
  }

  /**
   * Iterate over every line in the block defined by the two positions (Range) passed in.
   * If no range is given, the primary cursor will be used as the block.
   *
   * This is intended for visual block mode.
   */
  public static *iterateLinesInBlock(
    vimState: VimState,
    range?: Range,
    options: { reverse?: boolean } = { reverse: false }
  ): Iterable<{ line: string; start: Position; end: Position }> {
    const { reverse } = options;

    range ??= vimState.cursors[0];

    const topLeft = visualBlockGetTopLeftPosition(range.start, range.stop);
    const bottomRight = visualBlockGetBottomRightPosition(range.start, range.stop);

    const [itrStart, itrEnd] = reverse
      ? [bottomRight.line, topLeft.line]
      : [topLeft.line, bottomRight.line];

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
  public static *iterateWords(
    start: Position
  ): Iterable<{ start: Position; end: Position; word: string }> {
    const text = TextEditor.getLineAt(start).text;
    if (/\s/.test(text[start.character])) {
      start = start.getWordRight();
    }
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
}

/**
 * Directions in the view for editor scroll command.
 */
export type EditorScrollDirection = 'up' | 'down';

/**
 * Units for editor scroll 'by' argument
 */
export type EditorScrollByUnit = 'line' | 'wrappedLine' | 'page' | 'halfPage';

/**
 * Positions in the view for cursor move command.
 */
export type CursorMovePosition =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'wrappedLineStart'
  | 'wrappedLineFirstNonWhitespaceCharacter'
  | 'wrappedLineColumnCenter'
  | 'wrappedLineEnd'
  | 'wrappedLineLastNonWhitespaceCharacter'
  | 'viewPortTop'
  | 'viewPortCenter'
  | 'viewPortBottom'
  | 'viewPortIfOutside';

/**
 * Units for Cursor move 'by' argument
 */
export type CursorMoveByUnit = 'line' | 'wrappedLine' | 'character' | 'halfLine';
