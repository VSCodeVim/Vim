"use strict";

import * as vscode from 'vscode';

export async function showInfo(message : string): Promise<{}> {
  return vscode.window.showInformationMessage("Vim: " + message);
}

export async function showError(message : string): Promise<{}> {
  return vscode.window.showErrorMessage("Vim: " + message);
}

