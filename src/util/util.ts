import * as vscode from 'vscode';

import { Position } from '../common/motion/position';
import { Range } from '../common/motion/range';
import { logger } from './logger';

/**
 * This is certainly quite janky! The problem we're trying to solve
 * is that writing editor.selection = new Position() won't immediately
 * update the position of the cursor. So we have to wait!
 */
export async function waitForCursorSync(timeout: number = 0, rejectOnTimeout = false): Promise<void> {
  await new Promise((resolve, reject) => {
    let timer = setTimeout(rejectOnTimeout ? reject : resolve, timeout);

    const disposable = vscode.window.onDidChangeTextEditorSelection(x => {
      disposable.dispose();
      clearTimeout(timer);
      resolve();
    });
  });
}

export async function getCursorsAfterSync(timeout: number = 0): Promise<Range[]> {
  try {
    await waitForCursorSync(timeout, true);
  } catch (e) {
    logger.warn(`getCursorsAfterSync: expected selection to have updated within ${timeout}ms. error=${e.message}.`);
  }

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
        logger.error(`getExternalExtensionDirPath: ${err.message}`);
        reject(err);
      }
    });
  });
}
