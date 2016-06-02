"use strict";

import * as vscode from "vscode";
import {Position, PositionOptions} from './position';

export enum MotionMode {
    Caret,
    Cursor,
}

export class Motion implements vscode.Disposable {
    private _motionMode : MotionMode;
    private _position : Position;
    private _disposables = new Array<vscode.Disposable>();

    // Caret Styling
    private _caretDecoration = vscode.window.createTextEditorDecorationType(
    {
        dark: {
            // used for dark colored themes
            backgroundColor: 'rgba(224, 224, 224, 0.4)',
            borderColor: 'rgba(240, 240, 240, 0.8)'
        },
        light: {
            // used for light colored themes
            backgroundColor: 'rgba(32, 32, 32, 0.4)',
            borderColor: 'rgba(16, 16, 16, 0.8)'
        },
        borderStyle: 'solid',
        borderWidth: '1px'
    });

    public get position() : Position {
        return this._position;
    }

    public set position(val: Position) {
        this._position = val;
        this.redraw();
    }

    public constructor(mode: MotionMode) {
        // initialize to current position
        let currentPosition = vscode.window.activeTextEditor.selection.active;
        this._position = new Position(currentPosition.line, currentPosition.character, null);

        if (mode !== null) {
            this.changeMode(mode);
        }

        this._disposables.push(vscode.window.onDidChangeTextEditorSelection(e => {
            // handle scenarios where mouse used to change current position
            let selection = e.selections[0];

            if (selection) {
                let line = selection.active.line;
                let char = selection.active.character;

                var newPosition = new Position(line, char, this._position.positionOptions);

                if (char > newPosition.getLineEnd().character) {
                   newPosition = new Position(newPosition.line, newPosition.getLineEnd().character, null);
                }

                this.position = newPosition;
                this.changeMode(this._motionMode);
            }
        }));


    }

    public changeMode(mode : MotionMode) : Motion {
        this._motionMode = mode;
        this.redraw();
        return this;
    }

    public move(): Motion {
        return this.moveTo(null, null);
    }

    public moveTo(line: number, character: number) : Motion {
        if (line !== null && character !== null) {
            this._position = this._position.setLocation(line, character);
        }

        if (!this.position.isValid()) {
            throw new RangeError(`Invalid position. Line=${line}, Character=${character}`);
        }

        let selection = new vscode.Selection(this.position, this.position);
        vscode.window.activeTextEditor.selection = selection;

        if (this._motionMode === MotionMode.Caret) {
            this.highlightBlock(this.position);
        }

        return this;
    }

    private redraw() : void {
        switch (this._motionMode) {
            case MotionMode.Caret:
                // Valid Positions for Caret: [0, eol)
                this._position.positionOptions = PositionOptions.CharacterWiseExclusive;

                this.highlightBlock(this.position);
                break;

            case MotionMode.Cursor:
                // Valid Positions for Caret: [0, eol]
                this.position.positionOptions = PositionOptions.CharacterWiseInclusive;
                vscode.window.activeTextEditor.setDecorations(this._caretDecoration, []);
                break;
        }
    }

    /**
     * Allows us to simulate a block cursor by highlighting a 1 character
     * space at the provided position in a lighter color.
     */
    private highlightBlock(start: Position): void {
        this.highlightRange(start, new Position(start.line, start.character + 1, start.positionOptions));
    }

    /**
     * Highlights the range from start to end in the color of a block cursor.
     */
    private highlightRange(start: Position, end: Position): void {
        let range = new vscode.Range(start, end);
        vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        vscode.window.activeTextEditor.setDecorations(this._caretDecoration, [range]);
    }

    public select(from: Position, to: Position): void {
        let selection = new vscode.Selection(from, to);

        vscode.window.activeTextEditor.selection = selection;

        this.highlightBlock(to);
    }

    public left() : Motion {
        this._position = this.position.getLeft();
        return this;
    }

    public right() : Motion {
        this._position = this.position.getRight();
        return this;
    }

    public down() : Motion {
        this._position = this.position.getDown(0);
        return this;
    }

    public up() : Motion {
        this._position = this.position.getUp(0);
        return this;
    }

    public wordLeft(): Motion {
        this._position = this.position.getWordLeft();
        return this;
    }

    public bigWordLeft(): Motion {
        this._position = this.position.getBigWordLeft();
        return this;
    }

    public wordRight() : Motion {
        this._position = this.position.getWordRight();
        return this;
    }

    public bigWordRight() : Motion {
        this._position = this.position.getBigWordRight();
        return this;
    }

    public lineBegin() : Motion {
        this._position = this.position.getLineBegin();
        return this;
    }

    public lineEnd() : Motion {
        this._position = this.position.getLineEnd();
        return this;
    }

    public firstLineNonBlankChar() : Motion {
        this._position = this.position.setLocation(0, Position.getFirstNonBlankCharAtLine(0));
        return this;
    }

    public lastLineNonBlankChar() : Motion {
        let lastLine = this.position.getDocumentEnd().line;
        let character = Position.getFirstNonBlankCharAtLine(lastLine);

        this._position = this.position.setLocation(lastLine, character);
        return this;
    }

    public documentBegin() : Motion {
        this._position = this.position.getDocumentBegin();
        return this;
    }

    public documentEnd() : Motion {
        this._position = this.position.getDocumentEnd();
        return this;
    }

    public goToEndOfLastWord(): Motion {
        this._position = this.position.getLastWordEnd();
        return this;
    }

    public goToEndOfLastBigWord(): Motion {
        this._position = this.position.getLastBigWordEnd();
        return this;
    }

    public goToEndOfCurrentWord(): Motion {
        this._position = this.position.getCurrentWordEnd();
        return this;
    }

    public goToEndOfCurrentBigWord(): Motion {
        this._position = this.position.getCurrentBigWordEnd();
        return this;
    }

    public goToEndOfCurrentParagraph(): Motion {
      this._position = this.position.getCurrentParagraphEnd();
      return this;
    }

    public goToBeginningOfCurrentParagraph(): Motion {
      this._position = this.position.getCurrentParagraphBeginning();
      return this;
    }

    dispose() {
        _.each(this._disposables, d => {
            d.dispose();
        });
    }
}
