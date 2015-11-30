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
	
	static left() : vscode.Position {
		let pos = this.currentPosition();
		let column = pos.character;
		
		if (column > 0) {
			column--;
		}
		
		this.prevColumn = column;		
		return new vscode.Position(pos.line, column);		
	}

	static right() : vscode.Position {
		let pos = this.currentPosition();
		let column = pos.character;
		
		if (column < TextEditor.ReadLine(pos.line).length) {
			column++;
		}
		
		this.prevColumn = column;
		return new vscode.Position(pos.line, column);
	}
	
	static down() : vscode.Position {
		let pos = this.currentPosition();
		let line = pos.line;
		let column = this.prevColumn;

		if (!Cursor.isLastLine(line)) {
			let nextLineMaxColumn = TextEditor.ReadLine(++line).length - 1;
			
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
			let nextLineMaxColumn = TextEditor.ReadLine(--line).length - 1;

			if (nextLineMaxColumn < 0) {
				nextLineMaxColumn = 0;
			}
			
			if (nextLineMaxColumn < this.prevColumn) {
				column = nextLineMaxColumn;
			}			
		}		

		return new vscode.Position(line, column);
	}
	
	static nonBlankLineBegin() : vscode.Position {
		let pos = this.currentPosition();
		const linetext = TextEditor.ReadLine(pos.line);
		if (linetext.length !==0) {
			var fc = linetext.length - linetext.replace(/^\s+/,"").length;				
			return new vscode.Position(pos.line, fc);
		}
		return new vscode.Position(pos.line, 0);	
	}
	
	static searchLineForward(s : string) : vscode.Position {
		let pos = this.currentPosition();
		const linetext = TextEditor.ReadLine(pos.line);
		let column = pos.character;
		let searchpos = linetext.indexOf(s, column);		
		if (searchpos !== -1) {
			return new vscode.Position(pos.line, searchpos);
		} 
		return new vscode.Position(pos.line, 0);
	}
	
	static searchLineBackward(s : string) : vscode.Position {
		let pos = this.currentPosition();
		let linetext = TextEditor.ReadLine(pos.line);		
		let column = pos.character;
		linetext = linetext.substr(0,column);
		let searchpos = linetext.lastIndexOf(s, column);		
		if (searchpos !== -1) {
			return new vscode.Position(pos.line, searchpos);
		} 
		return new vscode.Position(pos.line, 0);		
	}
			
	static lineBegin() : vscode.Position {
		let pos = this.currentPosition();		
		return new vscode.Position(pos.line, 0);
	}		
	
	static lineEnd() : vscode.Position {
		let pos = this.currentPosition();
		const lineLength = TextEditor.ReadLine(pos.line).length;
		
		return new vscode.Position(pos.line, lineLength);
	}	

	private static isLastLine(line: number): boolean {
		return (vscode.window.activeTextEditor.document.lineCount + 1) === line;
	}
}

