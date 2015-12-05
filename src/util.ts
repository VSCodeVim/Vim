import * as vscode from 'vscode';

export function showInfo(message : string) : Thenable<{}> {
    return vscode.window.showInformationMessage("Vim: " + message);
}

export function showError(message : string) : Thenable<{}> {
    return vscode.window.showErrorMessage("Vim: " + message);
}
