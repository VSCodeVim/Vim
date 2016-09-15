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
    if (!(key.startsWith('<') && key.endsWith('>'))) {
      key = `<${ key }>`;
    }

    for (const searchKey in angleBracketNotationMap) {
      if (angleBracketNotationMap.hasOwnProperty(searchKey)) {
        key = key.replace(searchKey, angleBracketNotationMap[searchKey]);
      }
    }

    return key;
}

/**
 * This is certainly quite janky! The problem we're trying to solve
 * is that writing editor.selection = new Position() won't immediately
 * update the position of the cursor. So we have to wait!
 */
export async function waitForCursorUpdatesToHappen(): Promise<void> {
  // TODO - dispose!

  await new Promise((resolve, reject) => {
    setTimeout(resolve, 100);
    vscode.window.onDidChangeTextEditorSelection(x => {
      resolve();
    });
  });
}

export async function wait(time: number): Promise<void> {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  })
}