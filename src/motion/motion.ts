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
    private _disposables: vscode.Disposable[];

    public get position() : Position {
        return this._position;
    }

	public constructor(mode : MotionMode = null) {
        let currentPosition = vscode.window.activeTextEditor.selection.active;
        this.setPosition(new Position(currentPosition.line, currentPosition.character), true);

        if (mode !== null) {
            this.changeMode(mode);
        }

        this._disposables.push(vscode.window.onDidChangeTextEditorSelection(e => {
            let selection = e.selections[0];

            if (selection) {
                let line = selection.active.line;
                let char = selection.active.character;

                this.setPosition(new Position(line, char), true);
                this.changeMode(this._motionMode);
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
        if (line !== null && character != null) {
            this.setPosition(this.position.setLocation(line, character), true);
		}

        if (!this.position.isValid()) {
            throw new RangeError();
        }

		let selection = new vscode.Selection(this.position, this.position);
		vscode.window.activeTextEditor.selection = selection;

		let range = new vscode.Range(this.position, this.position);
		vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
		return this;
	}

	public left() : Motion {
        this.setPosition(this.position.getLeft(), true);
		return this;
	}

	public right() : Motion {
        this.setPosition(this.position.getRight(), true);
		return this;
	}

	public down() : Motion {
        this.setPosition(this.position.getDown(this._desiredColumn));
		return this;
	}

	public up() : Motion {
        this.setPosition(this.position.getUp(this._desiredColumn));
		return this;
	}

	public wordLeft(): Motion {
        this.setPosition(this.position.getWordLeft(), true);
		return this;
	}

	public wordRight() : Motion {
        this.setPosition(this.position.getWordRight(), true);
		return this;
	}

	public lineBegin() : Motion {
        this.setPosition(this.position.getLineBegin(), true);
		return this;
	}

	public lineEnd() : Motion {
        this.setPosition(this.position.getLineEnd(), true);
		return this;
	}

	public firstLineNonBlankChar() : Motion {
        this.setPosition(this.position.setLocation(0, Position.getFirstNonBlankCharAtLine(0)), true);
		return this;
	}

	public lastLineNonBlankChar() : Motion {
        let lastLine = this.position.getDocumentEnd().line;
		let character = Position.getFirstNonBlankCharAtLine(lastLine);

        this.setPosition(this.position.setLocation(lastLine, character), true);
		return this;
	}

	public documentBegin() : Motion {
        this.setPosition(this.position.getDocumentBegin(), true);
		return this;
	}

	public documentEnd() : Motion {
        this.setPosition(this.position.getDocumentEnd(), true);
		return this;
	}

    public goToEndOfCurrentWord(): Motion {
        this.setPosition(this.position.getCurrentWordEnd(), true);
        return this;
    }

    dispose() {
        _.each(this._disposables, d => {
            d.dispose();  
        });
    }

    private setPosition(position: Position, updateDesiredColumn = false) {
        this._position = position;

        if (updateDesiredColumn) {
            this._desiredColumn = this._position.character;
        }
    }

}