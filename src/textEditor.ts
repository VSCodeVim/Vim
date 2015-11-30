import * as vscode from "vscode";

export default class TextEditor {         
	static Insert(text: string, position: vscode.Position = null) : Thenable<boolean> {
		if (position === null) {
			position = vscode.window.activeTextEditor.selection.active;
		}
		
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.insert(position, text);
		});
	}

	static Delete(range: vscode.Range) : Thenable<boolean> {
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.delete(range);
		});
	}

	static Replace(range: vscode.Range, text: string) : Thenable<boolean> {
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.replace(range, text);
		});
	}
	
	static ReadLine(lineNo: number = null): string {
		if (lineNo === null) {
			lineNo = vscode.window.activeTextEditor.selection.active.line;
		}
		
		if (vscode.window.activeTextEditor.document.lineCount < lineNo) {
			throw new RangeError();
		}
		
		return vscode.window.activeTextEditor.document.lineAt(lineNo).text;
	}
}

