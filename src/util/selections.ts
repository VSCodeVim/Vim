import * as vscode from 'vscode';

/**
 * Hashes the given selections array into a string, based on the anchor and active positions of each
 * selection.
 */
export function hashSelectionsArray(selections: readonly vscode.Selection[]): string {
  return selections.reduce((hash, s) => hash + hashSelection(s), '');
}

/**
 * Hashes the given selection into a string, based on its anchor and active positions.
 */
function hashSelection(selection: vscode.Selection): string {
  const { anchor, active } = selection;
  return `[${anchor.line}, ${anchor.character}; ${active.line}, ${active.character}]`;
}

/**
 * Returns whether the two arrays of selections are equal (i.e. have the same number of selections,
 * and the same anchor and active positions at each index).
 */
export function areSelectionArraysEqual(
  selectionsA: readonly vscode.Selection[],
  selectionsB: readonly vscode.Selection[],
): boolean {
  return (
    selectionsA.length === selectionsB.length &&
    selectionsA.every((sA, i) => areSelectionsEqual(sA, selectionsB[i]))
  );
}

/**
 * Returns whether two selections are equal (i.e. have the same anchor and active positions).
 *
 * Note that `{@link vscode.Selection.isEqual}` is not used here because it's derived from
 * `Range.isEqual`, and only checks if the `start` and `end` positions are equal, without
 * considering `anchor` and `active` (i.e. which end of the range the cursor is on).
 */
function areSelectionsEqual(selectionA: vscode.Selection, selectionB: vscode.Selection): boolean {
  return (
    selectionA.anchor.isEqual(selectionB.anchor) && selectionA.active.isEqual(selectionB.active)
  );
}
