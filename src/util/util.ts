import * as vscode from 'vscode';
import { Cursor } from '../common/motion/cursor';
import { VimState } from '../state/vimState';

/**
 * We used to have an issue where we would do something like execute a VSCode
 * command, and would encounter race conditions because the cursor positions
 * wouldn't yet be updated. So we waited for a selection change event, but
 * this doesn't seem to be necessary any more.
 *
 * @deprecated Calls to this should probably be replaced with calls to `ModeHandler::syncCursors()` or something...
 */
export function getCursorsAfterSync(editor: vscode.TextEditor): Cursor[] {
  return editor.selections.map((x) => Cursor.FromVSCodeSelection(x));
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

export function assertDefined<X>(x: X | undefined, err: string): asserts x {
  if (x === undefined) {
    throw new Error(err);
  }
}

export function isHighSurrogate(charCode: number): boolean {
  return 0xd800 <= charCode && charCode <= 0xdbff;
}

export function isLowSurrogate(charCode: number): boolean {
  return 0xdc00 <= charCode && charCode <= 0xdfff;
}
