/**
 * Pure text-change helpers shared by the undo history tracker.
 *
 * `HistoryTracker` records document edits as `ITextChange`s (`start`, `before`, `after`)
 * and needs to (re)apply them to plain strings in a few places — most notably when merging
 * the changes of a history step, and when reconciling Vim's undo stack with VS Code's
 * native undo/redo. Those operations must not depend on a live editor, so they live here
 * as pure functions operating on strings and `vscode.Position`s.
 *
 * Positions follow the same conventions as the rest of the extension: they are produced
 * with `Position.advancePositionByText` (see `src/common/motion/position.ts`) and offsets
 * are UTF-16 code units, exactly like `TextDocument.offsetAt`.
 */
import * as DiffMatchPatch from 'diff-match-patch';
import { Position } from 'vscode';

import '../common/motion/position';

/**
 * A single contiguous document edit: the text `before` occupied the range starting at
 * `start` (in the pre-change document), and was replaced with the text `after`.
 *
 * `DocumentChange` (in `historyTracker.ts`) implements this structurally; this module
 * only ever needs the data, never the editor-bound behavior.
 */
export interface ITextChange {
  readonly start: Position;
  readonly before: string;
  readonly after: string;
}

const diffEngine = new DiffMatchPatch.diff_match_patch();
diffEngine.Diff_Timeout = 1; // 1 second

/**
 * Equivalent of `TextDocument.offsetAt` for a plain string.
 *
 * Line breaks are `\r\n` (length 2), `\n` and `\r` (length 1 each), matching VS Code.
 */
export function offsetAtText(text: string, position: Position): number {
  let line = 0;
  let offset = 0;
  while (line < position.line && offset < text.length) {
    const ch = text[offset];
    if (ch === '\r') {
      offset += text[offset + 1] === '\n' ? 2 : 1;
      line++;
    } else if (ch === '\n') {
      offset += 1;
      line++;
    } else {
      offset++;
    }
  }
  return offset + position.character;
}

/**
 * Applies a single change to `text` and returns the result.
 */
export function applyTextChange(text: string, change: ITextChange): string {
  const startOffset = offsetAtText(text, change.start);
  // `before.length` counts UTF-16 code units, which is exactly what document offsets count.
  return text.slice(0, startOffset) + change.after + text.slice(startOffset + change.before.length);
}

/**
 * Applies `changes` (oldest first) to `text` and returns the result.
 */
export function applyTextChanges(text: string, changes: readonly ITextChange[]): string {
  let result = text;
  for (const change of changes) {
    result = applyTextChange(result, change);
  }
  return result;
}

/**
 * Undoes `changes` (which must be ordered oldest-first) from `text` and returns the result.
 */
export function unapplyTextChanges(text: string, changes: readonly ITextChange[]): string {
  let result = text;
  for (let i = changes.length - 1; i >= 0; i--) {
    const change = changes[i];
    result = applyTextChange(result, {
      start: change.start,
      before: change.after,
      after: change.before,
    });
  }
  return result;
}

/**
 * Diffs `oldText` into `newText` and returns the canonical change list for that transition.
 *
 * This is the single place where raw diff hunks are translated into `ITextChange`s; both
 * `HistoryTracker.addChange()` and `mergeDocumentChanges()` build on it so that a step
 * accumulated from several diffs ends up shaped exactly like a step recorded in one go.
 */
export function diffTextsToChanges(oldText: string, newText: string): ITextChange[] {
  const diffs = diffEngine.diff_main(oldText, newText);
  diffEngine.diff_cleanupEfficiency(diffs);

  const changes: ITextChange[] = [];
  let currentPosition = new Position(0, 0);

  for (const diff of diffs) {
    const [whatHappened, text] = diff;
    const added = whatHappened === DiffMatchPatch.DIFF_INSERT;
    const removed = whatHappened === DiffMatchPatch.DIFF_DELETE;

    if (added || removed) {
      changes.push({
        start: currentPosition,
        before: removed ? text : '',
        after: added ? text : '',
      });
    }

    if (!removed) {
      currentPosition = currentPosition.advancePositionByText(text);
    }
  }

  return changes;
}

/**
 * Coalesces a pure deletion immediately followed by a pure insertion at the same position
 * into a single replace change.
 *
 * Unlike general change merging this is exactly equivalent by construction — removing `X`
 * at `P` and then inserting `Y` at `P` is precisely the replace `X` → `Y` at `P` — and it
 * preserves the historical single-change shape of steps like `cw`, `s` or `R`-typing, whose
 * consumers (`U`, the status bar change count, `'`/`[` marks) were built around it.
 */
export function coalesceAdjacentReplacePairs(changes: readonly ITextChange[]): ITextChange[] {
  const coalesced: ITextChange[] = [];
  for (const change of changes) {
    const prev = coalesced[coalesced.length - 1];
    if (
      prev !== undefined &&
      prev.after === '' &&
      prev.before !== '' &&
      change.before === '' &&
      change.after !== '' &&
      change.start.isEqual(prev.start)
    ) {
      coalesced[coalesced.length - 1] = {
        start: prev.start,
        before: prev.before,
        after: change.after,
      };
    } else {
      coalesced.push(change);
    }
  }
  return coalesced;
}

/**
 * Merges the changes of one history step into an equivalent, canonical change list.
 *
 * `changes` must be ordered oldest-first and must describe the contiguous transition from
 * some base text to `currentText` (which is exactly what a step's accumulated diffs are).
 *
 * Rather than combining ranges pairwise — which is only correct when every overlap lines
 * up at the tail of the previous change (see VSCodeVim/Vim#2007) — this recovers the base
 * text by un-applying the changes from `currentText` and re-diffs base → current with the
 * same engine `addChange()` uses. The result is therefore, by construction, identical to
 * what recording the whole step in a single diff would have produced.
 *
 * Safety net: if `changes` do not actually span base → `currentText` (which can only happen
 * if a caller passes inconsistent data), the re-derived list is discarded and the input is
 * returned untouched, so merging can never corrupt a step that used to apply cleanly.
 */
export function mergeDocumentChanges(
  changes: readonly ITextChange[],
  currentText: string,
): ITextChange[] {
  if (changes.length < 2) {
    return [...changes];
  }

  const baseText = unapplyTextChanges(currentText, changes);
  const merged = coalesceAdjacentReplacePairs(diffTextsToChanges(baseText, currentText));

  // Validate before trusting the re-derived list: it must map base -> current exactly.
  if (applyTextChanges(baseText, merged) !== currentText) {
    return [...changes];
  }

  return merged;
}
