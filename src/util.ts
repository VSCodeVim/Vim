"use strict";

import * as vscode from 'vscode';

export async function showInfo(message : string): Promise<{}> {
  return vscode.window.showInformationMessage("Vim: " + message);
}

export async function showError(message : string): Promise<{}> {
  return vscode.window.showErrorMessage("Vim: " + message);
}

export function translateToAngleBracketNotation(key: string): string {
    const angleBracketNotationMap = {
      'ctrl+' : 'C-',
      'escape': 'Esc',
      'backspace': 'BS',
      'delete': 'Del',
    };

    key = key.toLowerCase();
    if (!(key.startsWith('<') && key.endsWith('>')) && key.length > 1) {
      key = `<${ key }>`;
    }

    for (const searchKey in angleBracketNotationMap) {
      if (angleBracketNotationMap.hasOwnProperty(searchKey)) {
        key = key.replace(searchKey, angleBracketNotationMap[searchKey]);
      }
    }

    return key;
}