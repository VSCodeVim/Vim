import * as vscode from "vscode";

export default class TextEditor {         
	static insert(text: string, position: vscode.Position = null) : Thenable<boolean> {
		if (position === null) {
			position = vscode.window.activeTextEditor.selection.active;
		}
		
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.insert(position, text);
		});
	}

	static delete(range: vscode.Range) : Thenable<boolean> {
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.delete(range);
		});
	}
	

	static replace(range: vscode.Range, text: string) : Thenable<boolean> {
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.replace(range, text);
		});
	}
	
	static readLine(lineNo: number = null): string {
		if (lineNo === null) {
			lineNo = vscode.window.activeTextEditor.selection.active.line;
		}
		
		if (lineNo >= vscode.window.activeTextEditor.document.lineCount) {
			throw new RangeError();
		}

		return vscode.window.activeTextEditor.document.lineAt(lineNo).text;
	}
	
	static getLineAt(position: vscode.Position): vscode.TextLine {
		return vscode.window.activeTextEditor.document.lineAt(position);
	}
}

