import * as vscode from 'vscode';

// Shows the vim command line.
export function showCmdLine(initialText = "") {
	const options : vscode.InputBoxOptions = {
		prompt: "Vim command line",
		value: initialText
	};	
	vscode.window.showInputBox(options).then(
		(s) => vscode.window.showInformationMessage(s),
		(e) => vscode.window.showErrorMessage(e)
	);
}