import * as vscode from 'vscode';

import { Logger } from '../util/logger';

/** Expiry time for our selections updates queue, after which we can reasonably expect a selection
 * update to have triggered a VSCode selection change event resulting in its dequeueing.
 *
 * We want the expiry time to be generous enough to allow for delayed VSCode event firings. If we
 * remove an update too early, we might mistakenly treat its change event as an external change that
 * we should be tracking, rather than an internal one we've already accounted for.
 *
 * We also want the expiry time to be short enough to discard stale internal updates, whose change
 * events have likely already fired, or will never fire. Note that VSCode selectionChange events
 * only fire if the editor's selections have actually changed in value, hence why we compare against
 * `editor.selections` to choose whether to add an update to `ourSelectionsUpdates`. But because we
 * receive VSCode's selection events at a different rate from our own updates, `editor.selections`
 * can be outdated when we do that comparison, and we can mistakenly think an internal update will
 * trigger a selectionChange event when it actually won't. Such an update will be added to
 * `ourSelectionsUpdates`, and will only be removed when we clean it up after the expiry time. */
const SELECTIONS_UPDATE_EXPIRY_MS = 1000;

/**
 * An internally-triggered selections update, which will trigger a VSCode selection change event
 * that we can ignore as an already-tracked change.
 */
export type OurSelectionsUpdate = {
  selectionsHash: string;
  updatedAt: number;
};

/**
 * Removes our selections updates that are older than the expiry time. Ideally there shouldn't be
 * any stale updates present when this is called. But if there are, we remove them so that VSCode
 * selectionChange events aren't being ignored indefinitely under the incorrect assumption that
 * they were triggered by internal updates we've already tracked.
 */
export function cleanupOurSelectionsUpdates(
  ourSelectionsUpdates: OurSelectionsUpdate[],
): OurSelectionsUpdate[] {
  const now = Date.now();
  return ourSelectionsUpdates.filter((entry) => {
    const age = now - entry.updatedAt;
    const shouldKeep = age < SELECTIONS_UPDATE_EXPIRY_MS;
    if (!shouldKeep) {
      Logger.warn(
        `OurSelectionsUpdate ${entry.selectionsHash} still around after ${age}ms; removing now`,
      );
    }
    return shouldKeep;
  });
}

export function hashSelections(selections: readonly vscode.Selection[]): string {
  return selections.reduce(
    (hash, s) =>
      hash + `[${s.anchor.line}, ${s.anchor.character}; ${s.active.line}, ${s.active.character}]`,
    '',
  );
}
