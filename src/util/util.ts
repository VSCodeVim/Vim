import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { Position } from '../common/motion/position';
import { Range } from '../common/motion/range';
import { logger } from './logger';

/**
 * This is certainly quite janky! The problem we're trying to solve
 * is that writing editor.selection = new Position() won't immediately
 * update the position of the cursor. So we have to wait!
 */
export async function waitForCursorSync(
  timeout: number = 0,
  rejectOnTimeout = false
): Promise<void> {
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
    logger.warn(`getCursorsAfterSync: selection not updated within ${timeout}ms. error=${e}.`);
  }

  return vscode.window.activeTextEditor!.selections.map(
    x => new Range(Position.FromVSCodePosition(x.start), Position.FromVSCodePosition(x.end))
  );
}

export function getExtensionDirPath(): string {
  return path.join(os.homedir(), '.VSCodeVim');
}
