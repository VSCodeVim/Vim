import * as vscode from "vscode";
import TextEditor from "./textEditor";

export default class Cursor {
	private static prevColumn: number = 0;

	static move(position: vscode.Position) {
		const newSelection = new vscode.Selection(position, position);
		vscode.window.activeTextEditor.selection = newSelection;
	}

	static currentPosition(): vscode.Position {
		return vscode.window.activeTextEditor.selection.active;
	}	
	
	static left(n = 1) : vscode.Position {
		let pos = this.currentPosition();
		let column = pos.character;

		column -= n;
		if (column < 0) {
			column = 0;
		}
		
		this.prevColumn = column;		
		return new vscode.Position(pos.line, column);		
	}

	static right(n = 1, addFlag = false) : vscode.Position {
		let pos = this.currentPosition();
		let column = pos.character;
		
		column += n;
		let max = TextEditor.ReadLine(pos.line).length - 1;
		if (addFlag) {
			max += 1;
		}		
		if (column >= max) {
			column = max;
		}
		
		this.prevColumn = column;
		return new vscode.Position(pos.line, column);
	}
	
	static down(n = 1) : vscode.Position {
		let pos = this.currentPosition();
		let line = pos.line;
		let column = this.prevColumn;

		let max = vscode.window.activeTextEditor.document.lineCount - 1;
		line += n;
		if (line >= max) {
			line = max;
		}
		
		let nextLineMaxColumn = TextEditor.ReadLine(line).length - 1;
			
		if (nextLineMaxColumn < 0) {
			nextLineMaxColumn = 0;
		}

		if (nextLineMaxColumn < this.prevColumn) {
			column = nextLineMaxColumn;
		}

		return new vscode.Position(line, column);
	}

	static up(n = 1) : vscode.Position {
		let pos = this.currentPosition();
		let line = pos.line;
		let column = this.prevColumn;

		line -= n;
		if (line < 0) {
			line = 0;
		}
				
		let nextLineMaxColumn = TextEditor.ReadLine(line).length - 1;

		if (nextLineMaxColumn < 0) {
			nextLineMaxColumn = 0;
		}
			
		if (nextLineMaxColumn < this.prevColumn) {
			column = nextLineMaxColumn;
		}			

		return new vscode.Position(line, column);
	}
	
	static lineBegin() : vscode.Position {
		let pos = this.currentPosition();		
		return new vscode.Position(pos.line, 0);
	}		

	static lineEnd(addFlag = false) : vscode.Position {
		let pos = this.currentPosition();
		let lineLength = TextEditor.ReadLine(pos.line).length - 1;
		if (addFlag) {
			lineLength += 1;
		}
		
		return new vscode.Position(pos.line, lineLength);
	}	
/*
	private static isLastLine(line: number): boolean {
		return (vscode.window.activeTextEditor.document.lineCount - 1) === line;
	}
*/	
	static checkLineEnd() : void {
		let pos = this.currentPosition();
		const lineLength = TextEditor.ReadLine(pos.line).length;
		if (pos.character === 0 || lineLength === 0) {
			return;
		} else if (pos.character >= lineLength) {
			this.move(pos.translate(0, -1));
		}
	}
}

