"use strict";

import * as _ from "lodash";
import * as vscode from "vscode";
import {TextEditor} from "./../textEditor";

export enum PositionOptions {
    CharacterWiseInclusive,
    CharacterWiseExclusive,
}

export class Position extends vscode.Position {
    private static NonWordCharacters = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-";
    private static WordDelimiters: string[] = ["(", ")", "[", "]", "{", "}", ":", " ",
         "=", "<", ">", "|", "/", "'", "\"", "~", "`", "@", "*", "+", "-", "?", ",", ".", ";"];

    private _nonWordCharRegex : RegExp;

    public positionOptions: PositionOptions = null;

    constructor(line: number, character: number, options: PositionOptions) {
        super(line, character);

        let segments = ["(^[\t ]*$)"];
        segments.push(`([^\\s${_.escapeRegExp(Position.NonWordCharacters) }]+)`);
        segments.push(`[\\s${_.escapeRegExp(Position.NonWordCharacters) }]+`);

        this.positionOptions = options;
        this._nonWordCharRegex = new RegExp(segments.join("|"), "g");
    }

    public setLocation(line: number, character: number) : Position {
        let position = new Position(line, character, this.positionOptions);
        return position;
    }

    public getLeft() : Position {
        if (!this.isLineBeginning()) {
            return new Position(this.line, this.character - 1, this.positionOptions);
        }

        return this;
    }

    public getRight() : Position {
        if (!this.isLineEnd()) {
            return new Position(this.line, this.character + 1, this.positionOptions);
        }

        return this;
    }

    /**
     * Get the position of the line directly below the current line.
     */
    public getDown(desiredColumn: number) : Position {
        if (this.getDocumentEnd().line !== this.line) {
            let nextLine = this.line + 1;
            let nextLineLength = Position.getLineLength(nextLine, this.positionOptions);

            return new Position(nextLine, Math.min(nextLineLength, desiredColumn), this.positionOptions);
        }

        return this;
    }

    /**
     * Get the position of the line directly above the current line.
     */
    public getUp(desiredColumn: number) : Position {
        if (this.getDocumentBegin().line !== this.line) {
            let prevLine = this.line - 1;
            let prevLineLength  = Position.getLineLength(prevLine, this.positionOptions);

            return new Position(prevLine, Math.min(prevLineLength, desiredColumn), this.positionOptions);
        }

        return this;
    }

    public getWordLeft() : Position {
        let currentLine = TextEditor.getLineAt(this);

        if (!TextEditor.isFirstLine(this) && this.character <= currentLine.firstNonWhitespaceCharacterIndex) {
            // go to previous line
            let prevLine = new Position(this.line - 1, this.character, this.positionOptions);
            return prevLine.getLineEnd();
        }

        let line = TextEditor.getLineAt(this);
        let words = line.text.match(this._nonWordCharRegex);

        let startWord: number;
        let endWord: number;

        if (words) {
            words = words.reverse();
            endWord = line.range.end.character;
            for (var index = 0; index < words.length; index++) {
                endWord = endWord - words[index].length;
                var word = words[index].trim();
                if (word.length > 0) {
                    startWord = line.text.indexOf(word, endWord);

                    if (startWord !== -1 && this.character > startWord) {
                        return new Position(this.line, startWord, this.positionOptions);
                    }
                }
            }
        }

        if (this.line === 0) {
            return this.getLineBegin();
        } else {
            return new Position(this.line - 1, 0, this.positionOptions);
        }
    }

    public getWordRight() : Position {
        if (!TextEditor.isLastLine(this) && this.character === this.getLineEnd().character) {
            // go to next line
            let line = TextEditor.getLineAt(this.translate(1));
            return new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex, this.positionOptions);
        }

        let line  = TextEditor.getLineAt(this);
        let words = line.text.match(this._nonWordCharRegex);

        let startWord: number;
        let endWord  : number;

        if (words) {
            for (var index = 0; index < words.length; index++) {
                var word = words[index].trim();
                if (word.length > 0) {
                    startWord = line.text.indexOf(word, endWord);
                    endWord = startWord + word.length;

                    if (this.character < startWord) {
                        return new Position(this.line, startWord, this.positionOptions);
                    }
                }
            }
        }

        if (this.line === this.getDocumentEnd().line) {
            return this.getLineEnd();
        } else {
            return new Position(this.line + 1, 0, this.positionOptions);
        }
    }

    public getCurrentWordEnd(): Position {
        if (!TextEditor.isLastLine(this) && this.character === this.getLineEnd().character) {
            // go to next line
            let line = TextEditor.getLineAt(this.translate(1));
            return new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex, this.positionOptions);
        }

        let line = TextEditor.getLineAt(this);

        if (Position.WordDelimiters.indexOf(line.text.charAt(this.character)) !== -1) {
            return new Position(this.line, this.character + 1, this.positionOptions);
        }

        for (var index = this.character; index < line.text.length; index++) {
            if (Position.WordDelimiters.indexOf(line.text.charAt(index)) !== -1) {
                return new Position(this.line, index, this.positionOptions);
            }
        }

        return this.getLineEnd();
    }

    /**
     * Get the end of the current paragraph.
     */
    public getCurrentParagraphEnd(): Position {
      let pos: Position = this;

      // If we're not in a paragraph yet, go down until we are.
      while (TextEditor.getLineAt(pos).text === "" && !TextEditor.isLastLine(pos)) {
        pos = pos.getDown(0);
      }

      // Go until we're outside of the paragraph, or at the end of the document.
      while (TextEditor.getLineAt(pos).text !== "" && pos.line < TextEditor.getLineCount() - 1) {
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
      while (TextEditor.getLineAt(pos).text === "" && !TextEditor.isFirstLine(pos)) {
          pos = pos.getUp(0);
      }

      // Go until we're outside of the paragraph, or at the beginning of the document.
      while (pos.line > 0 && TextEditor.getLineAt(pos).text !== "") {
          pos = pos.getUp(0);
      }

      return pos.getLineBegin();
    }

    public getLineBegin() : Position {
        return new Position(this.line, 0, this.positionOptions);
    }

    /**
     * Returns a new position at the end of this position's line.
     */
    public getLineEnd() : Position {
        return new Position(this.line, Position.getLineLength(this.line, this.positionOptions), this.positionOptions);
    }

    public getDocumentBegin() : Position {
        return new Position(0, 0, this.positionOptions);
    }

    public getDocumentEnd() : Position {
        let lineCount = TextEditor.getLineCount();
        let line = lineCount > 0 ? lineCount - 1 : 0;
        let char = Position.getLineLength(line, this.positionOptions);

        return new Position(line, char, this.positionOptions);
    }

    public isValid() : boolean {
        // line
        let lineCount = TextEditor.getLineCount();
        if (this.line > lineCount) {
            return false;
        }

        // char
        let charCount = Position.getLineLength(this.line, this.positionOptions);
        if (this.character > charCount) {
            return false;
        }

        // options
        if (this.positionOptions === null) {
            return false;
        }

        return true;
    }

    /**
     * Is this position at the beginning of the line?
     */
    public isLineBeginning() : boolean {
        return this.character === 0;
    }

    /**
     * Is this position at the end of the line?
     */
    public isLineEnd() : boolean {
        return this.character === Position.getLineLength(this.line, this.positionOptions);
    }

    public static getFirstNonBlankCharAtLine(line: number): number {
        return TextEditor.readLineAt(line).match(/^\s*/)[0].length;
    }

    private static getLineLength(line: number, options: PositionOptions) : number {
        switch (options) {
            case PositionOptions.CharacterWiseExclusive:
                // Valid Positions for Caret: [0, eol)
                var len = TextEditor.readLineAt(line).length;
                return len > 0 ? len - 1 : len;
            case PositionOptions.CharacterWiseInclusive:
                // Valid Positions for Caret: [0, eol]
                return TextEditor.readLineAt(line).length;

            default:
                throw new Error("Unhandled PositionOptions: " + options);
        }
    }
}