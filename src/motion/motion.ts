import * as vscode from "vscode";
import {Position, PositionOptions} from './position';

export enum MotionMode {
    Caret,
    Cursor,
}

export class Motion implements vscode.Disposable {
    /// Certain motions like j, k, and | record data about the desired column within the span.
    /// This value may or may not be a valid point within the line
    private _desiredColumn: number = 0;
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

    public constructor(mode : MotionMode = null) {
        let currentPosition = vscode.window.activeTextEditor.selection.active;
        this._position = new Position(currentPosition.line, currentPosition.character);
        this._desiredColumn = this._position.character;

        if (mode !== null) {
            this.changeMode(mode);
        }

        this._disposables.push(vscode.window.onDidChangeTextEditorSelection(e => {
            // handle scenarios where mouse used to change current position
            let selection = e.selections[0];

            if (selection) {
                let line = selection.active.line;
                let char = selection.active.character;

                if (this.position.line !== line ||
                    this.position.character !== char) {
                    this._position = new Position(line, char);
                    this._desiredColumn = this._position.character;
                    this.changeMode(this._motionMode);
                }
            }
        }));
    }

    public changeMode(mode : MotionMode) : Motion {
        this._motionMode = mode;

        switch (this._motionMode) {
            case MotionMode.Caret:
                // Valid Positions for Caret: [0, eol)
                this.position.positionOptions = PositionOptions.CharacterWiseExclusive;
                break;

            case MotionMode.Cursor:
                // Valid Positions for Caret: [0, eol]
                this.position.positionOptions = PositionOptions.CharacterWiseInclusive;
                break;
        }

        return this;
    }

    public move(line : number = null, character : number = null) : Motion {
        if (line !== null) {
            this._position = this.position.setLocation(line, character);
        }
        if (character !== null && character > this._desiredColumn) {
            this._desiredColumn = this._position.character;
        }

        if (!this.position.isValid()) {
            throw new RangeError();
        }

        let selection = new vscode.Selection(this.position, this.position);
        vscode.window.activeTextEditor.selection = selection;

        let range = new vscode.Range(this.position, this.position.translate(0, 1));
        vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

        switch (this._motionMode) {
            case MotionMode.Caret:
                // Stylize Caret
                vscode.window.activeTextEditor.setDecorations(this._caretDecoration, [range]);
                break;

            case MotionMode.Cursor:
                // Remove Caret Styling
                vscode.window.activeTextEditor.setDecorations(this._caretDecoration, []);
                break;
        }

        return this;
    }

    public left() : Motion {
        this._position = this.position.getLeft();
        this._desiredColumn = this._position.character;
        return this;
    }

    public right() : Motion {
        this._position = this.position.getRight();
        this._desiredColumn = this._position.character;
        return this;
    }

    public down() : Motion {
        this._position = this.position.getDown(this._desiredColumn);
        return this;
    }

    public up() : Motion {
        this._position = this.position.getUp(this._desiredColumn);
        return this;
    }

    public wordLeft(): Motion {
        this._position = this.position.getWordLeft();
        this._desiredColumn = this._position.character;
        return this;
    }

    public wordRight() : Motion {
        this._position = this.position.getWordRight();
        this._desiredColumn = this._position.character;
        return this;
    }

    public lineBegin() : Motion {
        this._position = this.position.getLineBegin();
        this._desiredColumn = this._position.character;
        return this;
    }

    public lineEnd() : Motion {
        this._position = this.position.getLineEnd();
        this._desiredColumn = this._position.character;
        return this;
    }

    public firstLineNonBlankChar() : Motion {
        this._position = this.position.setLocation(0, Position.getFirstNonBlankCharAtLine(0));
        this._desiredColumn = this._position.character;
        return this;
    }

    public lastLineNonBlankChar() : Motion {
        let lastLine = this.position.getDocumentEnd().line;
        let character = Position.getFirstNonBlankCharAtLine(lastLine);

        this._position = this.position.setLocation(lastLine, character);
        this._desiredColumn = this._position.character;
        return this;
    }

    public documentBegin() : Motion {
        this._position = this.position.getDocumentBegin();
        this._desiredColumn = this._position.character;
        return this;
    }

    public documentEnd() : Motion {
        this._position = this.position.getDocumentEnd();
        this._desiredColumn = this._position.character;
        return this;
    }

    public goToEndOfCurrentWord(): Motion {
        this._position = this.position.getCurrentWordEnd();
        this._desiredColumn = this._position.character;
        return this;
    }

    dispose() {
        _.each(this._disposables, d => {
            d.dispose();
        });
    }
}