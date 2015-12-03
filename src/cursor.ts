import * as _ from "lodash";
import * as vscode from "vscode";
import TextEditor from "./textEditor";

export default class Cursor {
	private static prevColumn: number = 0;

	static move(newPosition: vscode.Position) {
		if (newPosition === null) {
			return;
		}
		let curPosition = this.currentPosition();

		if (newPosition.line === curPosition.line) {
			this.prevColumn = newPosition.character;
		}

		const newSelection = new vscode.Selection(newPosition, newPosition);
		vscode.window.activeTextEditor.selection = newSelection;
	}

	static currentPosition(): vscode.Position {
		return vscode.window.activeTextEditor.selection.active;
	}

	static left() : vscode.Position {
		let pos = this.currentPosition();
		let column = pos.character;

		if (!this.isLineBeginning(pos)) {
			column--;
		}

		return new vscode.Position(pos.line, column);
	}

	static right() : vscode.Position {
		let pos = this.currentPosition();
		let column = pos.character;

		if (!this.isLineEnd(pos)) {
			column++;
		}

		return new vscode.Position(pos.line, column);
	}

	static down() : vscode.Position {
		let pos = this.currentPosition();
		let line = pos.line;
		let column = this.prevColumn;

		if (!Cursor.isLastLine(pos)) {
			let nextLineMaxColumn = TextEditor.readLine(++line).length - 1;

			if (nextLineMaxColumn < 0) {
				nextLineMaxColumn = 0;
			}

			if (nextLineMaxColumn < this.prevColumn) {
				column = nextLineMaxColumn;
			}
		}

		return new vscode.Position(line, column);
	}

	static up() : vscode.Position {
		let pos = this.currentPosition();
		let line = pos.line;
		let column = this.prevColumn;

		if (!this.isFirstLine(pos)) {
			let nextLineMaxColumn = TextEditor.readLine(--line).length - 1;

			if (nextLineMaxColumn < 0) {
				nextLineMaxColumn = 0;
			}

			if (nextLineMaxColumn < this.prevColumn) {
				column = nextLineMaxColumn;
			}
		}

		return new vscode.Position(line, column);
	}

	static wordRight() : vscode.Position {
		let pos = this.currentPosition();
		if (pos.character === this.lineEnd().character) {
			if (this.isLastLine(pos)) {
				return null;
			}
			let line = TextEditor.getLineAt(pos.translate(1));
			return new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
		}
		let nextPos = this.getNextWordPosition();
		if (nextPos === null) {
			return this.lineEnd();
		}
		return nextPos;
	}

	static wordLeft(): vscode.Position {
		let pos = this.currentPosition();
		let currentLine = TextEditor.getLineAt(pos);
		if (pos.character <= currentLine.firstNonWhitespaceCharacterIndex && pos.line !== 0) {
			let line = TextEditor.getLineAt(pos.translate(-1));
			return new vscode.Position(line.lineNumber, line.range.end.character);
		}
		let nextPos = this.getPreviousWordPosition();
		return nextPos;
	}

	static lineBegin() : vscode.Position {
		let pos = this.currentPosition();
		return new vscode.Position(pos.line, 0);
	}

	static lineEnd() : vscode.Position {
		let pos = this.currentPosition();
		const lineLength = TextEditor.readLine(pos.line).length;

		return new vscode.Position(pos.line, lineLength);
	}

	static firstLineNonBlankChar() : vscode.Position {
		let character = Cursor.posOfFirstNonBlankChar(0);
		return new vscode.Position(0, character);
	}

	static lastLineNonBlankChar() : vscode.Position {
		const line = vscode.window.activeTextEditor.document.lineCount - 1;
		let character = Cursor.posOfFirstNonBlankChar(line);
		return new vscode.Position(line, character);
	}

	static documentBegin() : vscode.Position {
		return new vscode.Position(0, 0);
	}

	static documentEnd() : vscode.Position {
		let line = vscode.window.activeTextEditor.document.lineCount - 1;
		if (line < 0) {
			line = 0;
		}

		let column = TextEditor.readLine(line).length;
		return new vscode.Position(line, column);
	}

	private static isLineBeginning(position : vscode.Position) : boolean {
		return position.character === 0;
	}

	private static isLineEnd(position : vscode.Position) : boolean {
		let lineEnd = TextEditor.readLine(position.line).length - 1;
		if (lineEnd < 0) {
			lineEnd = 0;
		}

		if (position.character > lineEnd) {
			throw new RangeError;
		}

		return position.character === lineEnd;
	}

	private static isFirstLine(position : vscode.Position) : boolean {
		return position.line === 0;
	}

	private static isLastLine(position : vscode.Position): boolean {
		return position.line === (vscode.window.activeTextEditor.document.lineCount - 1);
	}

	private static _nonWordCharacters = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-";

	public static getNextWordPosition(): vscode.Position {
		let segments = ["(^[\t ]*$)"];
		segments.push(`([^\\s${_.escapeRegExp(this._nonWordCharacters) }]+)`);
		segments.push(`[\\s${_.escapeRegExp(this._nonWordCharacters) }]+`);
		let reg = new RegExp(segments.join("|"), "g");
		let pos = this.currentPosition();
		let line = TextEditor.getLineAt(pos);
		let words = line.text.match(reg);

		let startWord: number;
		let endWord: number;

		if (words) {
			for (var index = 0; index < words.length; index++) {
				var word = words[index].trim();
				if (word.length > 0) {
					startWord = line.text.indexOf(word, endWord);
					endWord = startWord + word.length;

					if (pos.character < startWord) {
						return new vscode.Position(pos.line, startWord);
					}
				}
			}
		}

		return null;
	}

	public static getPreviousWordPosition(): vscode.Position {
		let segments = ["(^[\t ]*$)"];
		segments.push(`([^\\s${_.escapeRegExp(this._nonWordCharacters) }]+)`);
		segments.push(`[\\s${_.escapeRegExp(this._nonWordCharacters) }]+`);
		let reg = new RegExp(segments.join("|"), "g");
		let pos = this.currentPosition();
		let line = TextEditor.getLineAt(pos);
		let words = line.text.match(reg);

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

					if (startWord !== -1 && pos.character > startWord) {
						return new vscode.Position(pos.line, startWord);
					}
				}
			}
		}

		return null;
	}

	private static posOfFirstNonBlankChar(line: number): number {
		return TextEditor.readLine(line).match(/^\s*/)[0].length;
	}
}
