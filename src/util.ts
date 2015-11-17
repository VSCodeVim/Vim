import * as vscode from 'vscode';

export function showInfo(message : string) : void {
    vscode.window.showInformationMessage("Vim: " + message);
}

export function showError(message : string) : void {
    vscode.window.showErrorMessage("Vim: " + message);
}
