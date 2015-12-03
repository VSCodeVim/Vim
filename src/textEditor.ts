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

	static delete(range: vscode.Range = null) : Thenable<boolean> {
		if (range === null) {
			let start = new vscode.Position(0, 0);
			let lastLine = vscode.window.activeTextEditor.document.lineCount - 1;
			let end = vscode.window.activeTextEditor.document.lineAt(lastLine).range.end;

			range = new vscode.Range(start, end);
		}
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.delete(range);
		});
	}


	static replace(range: vscode.Range, text: string) : Thenable<boolean> {
		return vscode.window.activeTextEditor.edit((editBuilder) => {
			editBuilder.replace(range, text);
		});
	}

	static readFile(): string {
		return vscode.window.activeTextEditor.document.getText();
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

	static getLineCount() {
		return vscode.window.activeTextEditor.document.lineCount;
	}

	static getLineAt(position: vscode.Position): vscode.TextLine {
		return vscode.window.activeTextEditor.document.lineAt(position);
	}

	static isFirstLine(position : vscode.Position) : boolean {
		return position.line === 0;
	}

	static isLastLine(position : vscode.Position): boolean {
		return position.line === (vscode.window.activeTextEditor.document.lineCount - 1);
	}
}

