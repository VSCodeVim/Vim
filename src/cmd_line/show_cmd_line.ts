import * as vscode from 'vscode';

export function showCmdLine(initialText?: string) {
	initialText = initialText !== null ? initialText : '';
	var opts = { "prompt": "Vim command line", value: initialText };	
	vscode.window.showInputBox(opts).then(
		(s) => vscode.window.showInformationMessage(s),
		(_) => vscode.window.showErrorMessage("cancelled") // not triggered on Escape?
	);
}