import * as vscode from 'vscode';

export function showInfo(message : string) : void {
	vscode.window.showInformationMessage("Vim: " + message);
}