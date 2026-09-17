import * as vscode from 'vscode';
import { Cursor } from '../common/motion/cursor';
import { VimError } from '../error';
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
  return editor.selections.map((x) => Cursor.fromSelection(x));
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

export function findTabInActiveTabGroup(name: string): [number, vscode.Tab] {
  const foundBuffers: Array<[number, vscode.Tab]> = [];
  const tabs = vscode.window.tabGroups.activeTabGroup.tabs;
  for (let t = 0; t < tabs.length; t++) {
    const tab = tabs[t];
    if (tab.label.includes(name)) {
      foundBuffers.push([t, tab]);
      if (foundBuffers.length > 1) {
        throw VimError.MultipleMatches(name);
      }
    }
  }
  if (foundBuffers.length === 0) {
    throw VimError.NoMatchingBuffer(name);
  }
  return foundBuffers[0];
}
