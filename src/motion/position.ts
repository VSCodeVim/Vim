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

    public setLocation(line: number, character: number) : Position {
        let position = new Position(line, character, this.positionOptions);
        return position;
    }

    public getLeft(count? : number) : Position {
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

    public getRight(count? : number) : Position {
        count = count || 1;
        let position : Position = this;

        while (count) {
            if (!position.isLineEnd()) {
                position = new Position(position.line, position.character + 1, position.positionOptions);
            }
            count--;
        }
        return position;
    }

    /**
     * Get the position of the line directly below the current line.
     */
    public getDown(desiredColumn: number, count? : number) : Position {
        count = count || 1;
        let position : Position = this;

        while (count) {
            if (position.getDocumentEnd().line !== position.line) {
                let nextLine = position.line + 1;
                let nextLineLength = Position.getLineLength(nextLine, position.positionOptions);

                position = new Position(nextLine, Math.min(nextLineLength, desiredColumn), this.positionOptions);
            }
            count--;
        }
        return position;
    }

    /**
     * Get the position of the line directly above the current line.
     */
    public getUp(desiredColumn: number, count? : number) : Position {
        count = count || 1;
        let position : Position = this;

        while (count) {
            if (position.getDocumentBegin().line !== position.line) {
                let prevLine = position.line - 1;
                let prevLineLength  = Position.getLineLength(prevLine, position.positionOptions);

                position = new Position(prevLine, Math.min(prevLineLength, desiredColumn), position.positionOptions);
            }
            count--;
        }
        return position;
    }

    public getWordLeft(count? : number) : Position {
        return this.getWordLeftWithRegex(this._nonWordCharRegex, count || 1);
    }

    public getBigWordLeft(count? : number) : Position {
        return this.getWordLeftWithRegex(this._nonBigWordCharRegex, count || 1);
    }

    public getWordRight(count? : number) : Position {
        return this.getWordRightWithRegex(this._nonWordCharRegex, count || 1);
    }

    public getBigWordRight(count? : number) : Position {
        return this.getWordRightWithRegex(this._nonBigWordCharRegex, count || 1);
    }

    public getCurrentWordEnd(count? : number): Position {
        return this.getCurrentWordEndWithRegex(this._nonWordCharRegex, count || 1);
    }

    public getCurrentBigWordEnd(count? : number): Position {
        return this.getCurrentWordEndWithRegex(this._nonBigWordCharRegex, count || 1);
    }

    /**
     * Get the end of the current paragraph.
     */
    public getCurrentParagraphEnd(count? : number): Position {
        count = count || 1;
        let pos: Position = this;

        while (count) {
            // If we're not in a paragraph yet, go down until we are.
            while (TextEditor.getLineAt(pos).text === "" && !TextEditor.isLastLine(pos)) {
                pos = pos.getDown(0);
            }

            // Go until we're outside of the paragraph, or at the end of the document.
            while (TextEditor.getLineAt(pos).text !== "" && pos.line < TextEditor.getLineCount() - 1) {
                pos = pos.getDown(0);
            }
            count--;
        }
        return pos.getLineEnd();
    }

    /**
     * Get the beginning of the current paragraph.
     */
    public getCurrentParagraphBeginning(count? : number): Position {
        count = count || 1;
        let pos: Position = this;

        while (count) {
            // If we're not in a paragraph yet, go up until we are.
            while (TextEditor.getLineAt(pos).text === "" && !TextEditor.isFirstLine(pos)) {
                pos = pos.getUp(0);
            }

            // Go until we're outside of the paragraph, or at the beginning of the document.
            while (pos.line > 0 && TextEditor.getLineAt(pos).text !== "") {
                pos = pos.getUp(0);
            }
            count--;
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
        if (!position) {
            return this;
        } if (this.positionOptions === PositionOptions.CharacterWiseInclusive) {
            return new Position(this.line, position.character, this.positionOptions);
        } else {
            return new Position(this.line, position.character - 1, this.positionOptions);
        }
    }

    public tilBackwards(argument : string, count : number) : Position {
        const position = this.findHelper(argument, count, -1);
        if (!position) {
            return this;
        }
        return new Position(this.line, position.character + 1, this.positionOptions);
    }

    public findForwards(argument : string, count : number) : Position {
        const position = this.findHelper(argument, count, +1);
        if (!position) {
            return this;
        } else if (this.positionOptions === PositionOptions.CharacterWiseInclusive) {
            return new Position(this.line, position.character + 1, this.positionOptions);
        } else {
            return new Position(this.line, position.character, this.positionOptions);
        }
    }

    public findBackwards(argument : string, count : number) : Position {
        const position = this.findHelper(argument, count, -1);
        if (!position) {
            return this;
        }
        return position;
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
            return null;
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

    private getWordLeftWithRegex(regex: RegExp, count: number) : Position {
        if (!count) {
            return this;
        }
        for (let currentLine = this.line; currentLine >= 0; currentLine--) {
            let positions    = this.getAllPositions(TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions.reverse(), index => index < this.character || currentLine !== this.line);

            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter, this.positionOptions).getWordLeftWithRegex(regex, count - 1);
            }
        }

        return new Position(0, 0, this.positionOptions).getLineBegin();
    }

    private getWordRightWithRegex(regex: RegExp, count: number): Position {
        if (!count) {
            return this;
        }
        for (let currentLine = this.line; currentLine < TextEditor.getLineCount(); currentLine++) {
            let positions    = this.getAllPositions(TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions, index => index > this.character || currentLine !== this.line);

            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter, this.positionOptions).getWordRightWithRegex(regex, count - 1);
            }
        }

        return new Position(TextEditor.getLineCount() - 1, 0, this.positionOptions).getLineEnd();
    }

    private getCurrentWordEndWithRegex(regex: RegExp, count: number) : Position {
        if (!count) {
            return this;
        }
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

        return new Position(TextEditor.getLineCount() - 1, 0, this.positionOptions)
            .getLineEnd().getCurrentWordEndWithRegex(regex, count - 1);
    }
}