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
    private static NonBigWordCharacters = "";

    private _nonWordCharRegex : RegExp;
    private _nonBigWordCharRegex : RegExp;

    public positionOptions: PositionOptions = null;

    constructor(line: number, character: number, options: PositionOptions) {
        super(line, character);

        this.positionOptions = options;

        this._nonWordCharRegex = this.makeWordRegex(Position.NonWordCharacters);
        this._nonBigWordCharRegex = this.makeWordRegex(Position.NonBigWordCharacters);
    }

    /**
     * Returns which of the 2 provided Positions comes earlier in the document.
     */
    public static EarlierOf(p1: Position, p2: Position): Position {
        if (p1.line < p2.line) { return p1; }
        if (p1.line === p2.line && p1.character < p2.character) { return p1; }

        return p2;
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

    /**
     * Same as getLeft, but goes up to the previous line on line
     * breaks.
     *
     * Equivalent to left arrow (in a non-vim editor!)
     */
    public getLeftThroughLineBreaks(): Position {
        if (!this.isLineBeginning()) {
            return this.getLeft();
        }

        return new Position(this.line - 1, 0, this.positionOptions)
            .getLineEnd();
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
        return this.getWordLeftWithRegex(this._nonWordCharRegex);
    }

    public getBigWordLeft() : Position {
        return this.getWordLeftWithRegex(this._nonBigWordCharRegex);
    }

    public getWordRight() : Position {
        return this.getWordRightWithRegex(this._nonWordCharRegex);
    }

    public getBigWordRight() : Position {
        return this.getWordRightWithRegex(this._nonBigWordCharRegex);
    }

    public getLastWordEnd(): Position {
        return this.getLastWordEndWithRegex(this._nonWordCharRegex);
    }

    public getLastBigWordEnd(): Position {
        return this.getLastWordEndWithRegex(this._nonBigWordCharRegex);
    }

    public getCurrentWordEnd(): Position {
        return this.getCurrentWordEndWithRegex(this._nonWordCharRegex);
    }

    public getCurrentBigWordEnd(): Position {
        return this.getCurrentWordEndWithRegex(this._nonBigWordCharRegex);
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
    public getLineEnd(opts: PositionOptions = null) : Position {
        if (opts === null) { opts = this.positionOptions; }
        return new Position(this.line, Position.getLineLength(this.line, opts), opts);
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

    public isAtDocumentEnd(): boolean {
        return this.line === TextEditor.getLineCount() - 1 && this.isLineEnd();
    }

    public static getFirstNonBlankCharAtLine(line: number): number {
        return TextEditor.readLineAt(line).match(/^\s*/)[0].length;
    }

    public getFirstLineNonBlankChar(): Position {
        return new Position(this.line, Position.getFirstNonBlankCharAtLine(this.line), this.positionOptions);
    }

    public getDocumentStart(): Position {
        return new Position(0, 0, this.positionOptions);
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

    private makeWordRegex(characterSet: string) : RegExp {
        let escaped = characterSet && _.escapeRegExp(characterSet);
        let segments = [];
        segments.push(`([^\\s${escaped}]+)`);
        segments.push(`[${escaped}]+`);
        segments.push(`$^`);
        let result = new RegExp(segments.join("|"), "g");

        return result;
    }

    private getAllPositions(line: string, regex: RegExp): number[] {
        let positions: number[] = [];
        let result = regex.exec(line);

        while (result) {
            positions.push(result.index);

             // Handles the case where an empty string match causes lastIndex not to advance,
             // which gets us in an infinite loop.
            if (result.index === regex.lastIndex) { regex.lastIndex++; }
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
            if (result.index === regex.lastIndex) { regex.lastIndex++; }
            result = regex.exec(line);
        }

        return positions;
    }

    private getWordLeftWithRegex(regex: RegExp) : Position {
        for (let currentLine = this.line; currentLine >= 0; currentLine--) {
            let positions    = this.getAllPositions(TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions.reverse(), index => index < this.character || currentLine !== this.line);

            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter, this.positionOptions);
            }
        }

        return new Position(0, 0, this.positionOptions).getLineBegin();
    }

    private getWordRightWithRegex(regex: RegExp): Position {
        for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
            let positions    = this.getAllPositions(TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions, index => index > this.character || currentLine !== this.line);

            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter, this.positionOptions);
            }
        }

        return new Position(TextEditor.getLineCount() - 1, 0, this.positionOptions).getLineEnd();
    }

    private getLastWordEndWithRegex(regex: RegExp) : Position {
        for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
            let positions    = this.getAllEndPositions(TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let index = _.findIndex(positions, index => index >= this.character || currentLine !== this.line);
            let newCharacter = 0;
            if (index === -1) {
                newCharacter = positions[positions.length - 1];
            } else if (index > 0) {
                newCharacter = positions[index - 1];
            }

            if (newCharacter !== undefined) {
                if (this.positionOptions === PositionOptions.CharacterWiseInclusive) {
                    newCharacter++;
                }
                return new Position(currentLine, newCharacter, this.positionOptions);
            }
        }

        return new Position(TextEditor.getLineCount() - 1, 0, this.positionOptions).getLineEnd();
    }

    private getCurrentWordEndWithRegex(regex: RegExp) : Position {
        for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
            let positions    = this.getAllEndPositions(TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions, index => index > this.character || currentLine !== this.line);

            if (newCharacter !== undefined) {
                if (this.positionOptions === PositionOptions.CharacterWiseInclusive) {
                    newCharacter++;
                }
                return new Position(currentLine, newCharacter, this.positionOptions);
            }
        }

        return new Position(TextEditor.getLineCount() - 1, 0, this.positionOptions).getLineEnd();
    }
}