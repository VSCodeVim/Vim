import * as _ from 'lodash';
import * as vscode from 'vscode';
import { exec } from 'child_process';

import { Position } from './common/motion/position';
import { Range } from './common/motion/range';
import { Logger } from './util/logger';

export async function showInfo(message: string): Promise<{}> {
  return vscode.window.showInformationMessage('Vim: ' + message) as {};
}

export async function showError(message: string): Promise<{}> {
  return vscode.window.showErrorMessage('Vim: ' + message) as {};
}

/**
 * This function execute a shell command and return the standard output as string.
 */
export function execShell(cmd: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

import * as clipboardy from 'clipboardy';

export class Clipboard {
  public static Copy(text: string) {
    try {
      clipboardy.writeSync(text);
    } catch (e) {
      Logger.error(e, `Clipboard: Error copying to clipboard. Error=${e}`);
    }
  }

  public static Paste(): string {
    return clipboardy.readSync();
  }
}

/**
 * This is certainly quite janky! The problem we're trying to solve
 * is that writing editor.selection = new Position() won't immediately
 * update the position of the cursor. So we have to wait!
 */
export async function waitForCursorUpdatesToHappen(timeout: number): Promise<void> {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);

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

    const disposer = vscode.window.onDidChangeActiveTextEditor(textEditor => {
      disposer.dispose();

      resolve(textEditor);
    });
  });
}
export async function allowVSCodeToPropagateCursorUpdatesAndReturnThem(
  timeout: number
): Promise<Range[]> {
  await waitForCursorUpdatesToHappen(timeout);

  return vscode.window.activeTextEditor!.selections.map(
    x => new Range(Position.FromVSCodePosition(x.start), Position.FromVSCodePosition(x.end))
  );
}

export async function getExternalExtensionDirPath(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const os = require('os');
    const homeDir: string = os.homedir();
    const path = require('path');
    const extensionFolder = path.join(homeDir, '.VSCodeVim');
    const fs = require('fs');

    fs.mkdir(extensionFolder, 0o775, (err: any) => {
      if (!err || err.code === 'EEXIST') {
        resolve(extensionFolder);
      } else {
        Logger.debug(err.message);
        reject(err);
      }
    });
  });
}
