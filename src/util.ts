"use strict";

import * as _ from "lodash";
import * as vscode from 'vscode';
import { Range } from './common/motion/range';
import { Position } from './common/motion/position';

export async function showInfo(message : string): Promise<{}> {
  return vscode.window.showInformationMessage("Vim: " + message) as {};
}

export async function showError(message : string): Promise<{}> {
  return vscode.window.showErrorMessage("Vim: " + message) as {};
}

const clipboardy = require('clipboardy');

export function clipboardCopy(text: string) {
  clipboardy.writeSync(text);
}

export function clipboardPaste(): string {
  return clipboardy.readSync();
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
 * Waits for the tabs to change after a command like 'gt' or 'gT' is run.
 * Sometimes it is not immediate, so we must busy wait
 * On certain versions, the tab changes are synchronous
 * For those, a timeout is given
 */
export async function waitForTabChange(): Promise<void> {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 500);

    const disposer = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
      disposer.dispose();

      resolve(textEditor);
    });
  });
}
export async function allowVSCodeToPropagateCursorUpdatesAndReturnThem(): Promise<Range[]> {
  await waitForCursorUpdatesToHappen();

  return vscode.window.activeTextEditor!.selections.map(x =>
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