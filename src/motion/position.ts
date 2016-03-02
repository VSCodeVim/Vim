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
    private static WordDelimiters: string[] = ["(", ")", "[", "]", "{", "}", ":", " ",
         "=", "<", ">", "|", "/", "'", "\"", "~", "`", "@", "*", "+", "-", "?", ",", ".", ";"];

    private _nonWordCharRegex : RegExp;
    private _nonBigWordCharRegex : RegExp;

    public positionOptions: PositionOptions = null;

    constructor(line: number, character: number, options: PositionOptions) {
        super(line, character);

        this.positionOptions = options;

        this._nonWordCharRegex = this.makeWordRegex(Position.NonWordCharacters);
        this._nonBigWordCharRegex = this.makeWordRegex(Position.NonBigWordCharacters);
    }

    public setLocation(line: number, character: number) : Position {
        let position = new Position(line, character, this.positionOptions);
        return position;
    }

    public getLeft(count : number) : Position {
        count = count || 1;
        let position : Position = this;
        while (count) {
            if (!position.isLineBeginning()) {
                position = new Position(position.line, position.character - 1, position.positionOptions);
            }
            count--;
        }
        return position;
    }

    public getRight(count : number) : Position {
        count = count || 1;
        let position : Position = this;
        while (count) {
            if (!this.isLineEnd()) {
                return new Position(this.line, this.character + 1, this.positionOptions);
            }
            count--;
        }
        return position;
    }

    /**
     * Get the position of the line directly below the current line.
     */
    public getDown(desiredColumn: number, count : number) : Position {
        count = count || 1;
        let position : Position = this;
        while (count) {
            if (position.getDocumentEnd().line !== position.line) {
                let nextLine = position.line + 1;
                let nextLineLength = Position.getLineLength(nextLine, position.positionOptions);

                position = new Position(nextLine, Math.min(nextLineLength, desiredColumn), position.positionOptions);
            }
            count--;
        }
        return position;
    }

    /**
     * Get the position of the line directly above the current line.
     */
    public getUp(desiredColumn: number, count : number) : Position {
                count = count || 1;
        let position : Position = this;
        while (count) {
            if (position.getDocumentBegin().line !== position.line) {
                let nextLine = position.line - 1;
                let nextLineLength = Position.getLineLength(nextLine, position.positionOptions);

                position = new Position(nextLine, Math.min(nextLineLength, desiredColumn), position.positionOptions);
            }
            count--;
        }
        return position;
    }

    public getWordLeft(count : number) : Position {
        return this.getWordLeftWithRegex(this._nonWordCharRegex);
    }

    public getBigWordLeft(count : number) : Position {
        return this.getWordLeftWithRegex(this._nonBigWordCharRegex);
    }

    public getWordRight(count : number) : Position {
        return this.getWordRightWithRegex(this._nonWordCharRegex);
    }

    public getBigWordRight(count : number) : Position {
        return this.getWordRightWithRegex(this._nonBigWordCharRegex);
    }

    public getCurrentWordEnd(count : number): Position {
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
    public getCurrentParagraphEnd(count : number): Position {
        count = count || 1;
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
    public getCurrentParagraphBeginning(count : number): Position {
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

    public tilForwards(argument : string, count : number) : Position {
        const position = this.findHelper(argument, count, +1);
        return new Position(this.line, position.character - 1, this.positionOptions);
    }

    public tilBackwards(argument : string, count : number) : Position {
        const position = this.findHelper(argument, count, -1);
        return new Position(this.line, position.character + 1, this.positionOptions);
    }

    public findForwards(argument : string, count : number) : Position {
        return this.findHelper(argument, count, +1);
    }

    public findBackwards(argument : string, count : number) : Position {
        return this.findHelper(argument, count, -1);
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

    private findHelper(argument : string, count: number, direction : number) {
        // -1 = backwards, +1 = forwards
        count = count || 1;
        const line = TextEditor.getLineAt(this);
        let index = this.character;
        while (count && index !== -1) {
            if (direction > 0) {
                index = line.text.indexOf(argument, index + direction);
            } else {
                index = line.text.lastIndexOf(argument, index + direction);
            }

            count--;
        }

        if (index > -1) {
            return new Position(this.line, index, this.positionOptions);
        } else {
            return this;
        }
    }

    private makeWordRegex(characterSet: string) : RegExp {
        let escaped = characterSet && _.escapeRegExp(characterSet);
        let segments = ["(^[\t ]*$)"];
        segments.push(`([^\\s${escaped}]+)`);
        segments.push(`[${escaped}]+`);
        return new RegExp(segments.join("|"), "g");
    }

    private getWordLeftWithRegex(regex: RegExp) : Position {
        var workingPosition = new Position(this.line, this.character, this.positionOptions);
        var currentLine = TextEditor.getLineAt(this);
        var currentCharacter = this.character;

        if (!TextEditor.isFirstLine(this) && this.character <= currentLine.firstNonWhitespaceCharacterIndex) {
            // perform search from very end of previous line (after last character)
            workingPosition = new Position(this.line - 1, this.character, this.positionOptions);
            currentLine = TextEditor.getLineAt(workingPosition);
            currentCharacter = workingPosition.getLineEnd().character + 1;
        }

        let positions = [];

        regex.lastIndex = 0;
        while (true) {
            let result = regex.exec(currentLine.text);
            if (result === null) {
                break;
            }
            positions.push(result.index);
        }

        for (var index = 0; index < positions.length; index++) {
            let position = positions[positions.length - 1 - index];
            if (currentCharacter > position) {
                return new Position(workingPosition.line, position, workingPosition.positionOptions);
            }
        }

        if (this.line === 0) {
            return this.getLineBegin();
        } else {
            let prevLine = new Position(this.line - 1, 0, this.positionOptions);
            return prevLine.getLineEnd();
        }
    }

    private getWordRightWithRegex(regex: RegExp) : Position {
        if (!TextEditor.isLastLine(this) && this.character >= this.getLineEnd().character) {
            // go to next line
            let line = TextEditor.getLineAt(this.translate(1));
            return new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex, this.positionOptions);
        }

        let currentLine = TextEditor.getLineAt(this);
        let positions = [];

        regex.lastIndex = 0;
        while (true) {
            let result = regex.exec(currentLine.text);
            if (result === null) {
                break;
            }
            positions.push(result.index);
        }

        for (var index = 0; index < positions.length; index++) {
            let position = positions[index];
            if (this.character < position) {
                return new Position(this.line, position, this.positionOptions);
            }
        }

        if (this.line === this.getDocumentEnd().line) {
            return this.getLineEnd();
        } else {
            // go to next line
            let line = TextEditor.getLineAt(this.translate(1));
            return new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex, this.positionOptions);
        }
    }
}