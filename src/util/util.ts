import * as vscode from 'vscode';
import { Cursor } from '../common/motion/cursor';
import { VimState } from '../state/vimState';

/**
 * We used to have an issue where we would do something like execute a VSCode
 * command, and would encounter race conditions because the cursor positions
 * wouldn't yet be updated. So we waited for a selection change event, but
 * this doesn't seem to be necessary any more.
 */
export function getCursorsAfterSync(): Cursor[] {
  return vscode.window.activeTextEditor!.selections.map((x) => Cursor.FromVSCodeSelection(x));
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export function scrollView(vimState: VimState, offset: number) {
  if (offset !== 0) {
    vimState.postponedCodeViewChanges.push({
      command: 'editorScroll',
      args: {
        to: offset > 0 ? 'up' : 'down',
        by: 'line',
        value: Math.abs(offset),
        revealCursor: false,
        select: false,
      },
    });
  }
}
