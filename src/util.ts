"use strict";

import * as _ from "lodash";
import * as vscode from 'vscode';
import { Range } from './motion/range';
import { Position } from './motion/position';

export async function showInfo(message : string): Promise<{}> {
  return vscode.window.showInformationMessage("Vim: " + message);
}

export async function showError(message : string): Promise<{}> {
  return vscode.window.showErrorMessage("Vim: " + message);
}

/**
 * This is certainly quite janky! The problem we're trying to solve
 * is that writing editor.selection = new Position() won't immediately
 * update the position of the cursor. So we have to wait!
 */
export async function waitForCursorUpdatesToHappen(): Promise<void> {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 100);

    const disposer = vscode.window.onDidChangeTextEditorSelection(x => {
      disposer.dispose();

      resolve();
    });
  });
}

/**
 * FOR TESTING PURPOSES ONLY
 * Waits for the tabs to change after a command like 'gt' or 'gT' is run.
 * Sometimes it is not immediate, so we must busy wait
 * Caveat: Use only it tests. This promise does not timeout. Awaiting this promise
 * in extension code is dangerous
 */
export async function waitForTabChange(): Promise<void> {
  await new Promise((resolve, reject) => {
    const disposer = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
      disposer.dispose();

      resolve(textEditor);
    });
  });
}

export async function allowVSCodeToPropagateCursorUpdatesAndReturnThem(): Promise<Range[]> {
  await waitForCursorUpdatesToHappen();

  return vscode.window.activeTextEditor.selections.map(x =>
    new Range(Position.FromVSCodePosition(x.start), Position.FromVSCodePosition(x.end)));
}

export async function wait(time: number): Promise<void> {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
}

export function betterEscapeRegex(str: string): string {
  let result = _.escapeRegExp(str);

  return result.replace(/-/g, "\\-");
}