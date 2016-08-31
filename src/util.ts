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

    let bracketedKey = `<${ key.toLowerCase() }>`;
    for (const searchKey in angleBracketNotationMap) {
      if (angleBracketNotationMap.hasOwnProperty(searchKey)) {
        bracketedKey = bracketedKey.replace(searchKey, angleBracketNotationMap[searchKey]);
      }
    }

    return bracketedKey;
}