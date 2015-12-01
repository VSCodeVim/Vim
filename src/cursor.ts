import * as vscode from "vscode";
import TextEditor from "./textEditor";

export default class Cursor {
	private static prevColumn: number = 0;

	static move(newPosition: vscode.Position) {
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
		
		if (column > 0) {
			column--;
		}
			
		return new vscode.Position(pos.line, column);		
	}

	static right() : vscode.Position {
		let pos = this.currentPosition();
		let column = pos.character;
		
		if (column < TextEditor.readLine(pos.line).length - 1) {
			column++;
		}

		return new vscode.Position(pos.line, column);
	}
	
	static down() : vscode.Position {
		let pos = this.currentPosition();
		let line = pos.line;
		let column = this.prevColumn;

		if (!Cursor.isLastLine(line)) {
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

		if (line !== 0) {			
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
	
	static lineBegin() : vscode.Position {
		let pos = this.currentPosition();		
		return new vscode.Position(pos.line, 0);
	}		
	
	static lineEnd() : vscode.Position {
		let pos = this.currentPosition();
		const lineLength = TextEditor.readLine(pos.line).length;
		
		return new vscode.Position(pos.line, lineLength);
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

	private static isLastLine(line: number): boolean {
		return (vscode.window.activeTextEditor.document.lineCount - 1) === line;
	}
}

