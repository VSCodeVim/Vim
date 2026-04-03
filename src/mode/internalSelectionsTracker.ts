import * as vscode from 'vscode';

import { Logger } from '../util/logger';
import { areSelectionArraysEqual, hashSelectionsArray } from '../util/selections';

/**
 * Expiry time for our internal selections updates tracking, after which we can reasonably expect an
 * associated VSCode selection change event to have been fired for a given selections update, if one
 * ever will be.
 *
 * We want to be generous enough to allow for delayed VSCode selection change event firings, to
 * avoid treating the delayed event as an external update and re-updating our own selections state
 * based on an internal update we've already accounted for.
 *
 * We also want to discard stale internal updates before too long. Until we untrack them, they will
 * block incoming selection change events (including external ones) from being handled.
 */
const SELECTIONS_UPDATE_TO_IGNORE_EXPIRY_MS = 1000;

/**
 * An internal selections update that we want to track.
 */
export type InternalSelectionsUpdate = {
  /** Hash for the updated selections, based on each selection's anchor and active position. */
  selectionsHash: string;
  /** Timestamp (in ms since Unix epoch) of when this selections update was added to the tracker. */
  trackedAt: number;
};

/**
 * Class that helps with tracking internal selections updates and controlling / determining whether
 * to treat incoming {@link vscode.TextEditorSelectionChangeEvent}s as internal/intermediate
 * selections changes to ignore, or as external selections updates that should update our internal
 * selections state.
 *
 * Methods exposed:
 *
 * - {@link shouldIgnoreAsInternalSelectionChangeEvent} - Determines whether to ignore a given
 * VSCode selection change event as an internal/intermediate selections update's change event
 *
 * - {@link startIgnoringIntermediateSelections} - Start ignoring selection change events while
 * running an action
 *
 * - {@link stopIgnoringIntermediateSelections} - Resume handling selection change events after
 * running an action
 *
 * - {@link maybeTrackSelectionsUpdateToIgnore} - Predicts whether the given selections update will
 * trigger a selection change event, and if so, tracks it
 */
export class InternalSelectionsTracker {
  // #region Determining whether to ignore a selection change event

  /**
   * Determines whether or not to view the given VSCode selection change event as being from an
   * internal or intermediate selections update, and thus ignore it. Removes its associated
   * selections update entry from our tracking, if found.
   *
   * @returns `true` if the event should be ignored, else `false`.
   */
  public shouldIgnoreAsInternalSelectionChangeEvent(
    event: vscode.TextEditorSelectionChangeEvent,
  ): boolean {
    // First remove stale tracked updates that we shouldn't worry about anymore
    this.cleanupStaleSelectionsUpdatesToIgnore();

    const selectionsHash = hashSelectionsArray(event.selections);
    return (
      this.maybeUntrackSelectionsUpdateToIgnore(selectionsHash) ||
      this.shouldIgnoreAsIntermediateSelection(selectionsHash)
    );
  }

  /**
   * Looks for an equivalent selections update in our tracked selections updates to ignore, and
   * removes it if found.
   *
   * @returns `true` if the selection was found and removed, else `false`.
   */
  private maybeUntrackSelectionsUpdateToIgnore(selectionsHash: string): boolean {
    const index = this.selectionsUpdatesToIgnore.findIndex(
      (update) => update.selectionsHash === selectionsHash,
    );
    if (index !== -1) {
      this.selectionsUpdatesToIgnore.splice(index, 1);
      this.logTrace(
        `Ignoring and un-tracking internal selection update's change event ${
          selectionsHash
        }. Remaining internal selections updates to ignore: ${
          this.selectionsUpdatesToIgnore.length
        }`,
      );
      return true;
    }
    return false;
  }

  /**
   * Determines whether or not to view a VSCode selection change event (whose selections hash wasn't
   * found in our tracked selections updates to ignore) as being from an internal action's
   * intermediate selection, and thus ignore it.
   *
   * If `shouldIgnoreIntermediateSelections` is `true`, the answer is an easy yes.
   *
   * If not, but we are still tracking internal selections updates whose change events haven't fired
   * yet, we assume we're just processing intermediate selections' change events that have slipped
   * past the end of an action we just finished, and we return `true`. This may sometimes result in
   * unintentionally ignoring an external selection made during or closely after a series of
   * internal updates, especially if any of those internal updates were misguidedly added to our
   * tracking by {@link maybeTrackSelectionsUpdateToIgnore} even though they don't actually trigger
   * selection change events. For now, we err on the side of allowing false negatives (missing an
   * external update) over false positives (re-applying an internal update), but we may want to
   * revisit this tradeoff in the future.
   *
   * If neither condition is met, we return `false`.
   *
   * Logic originally implemented in: [VSCodeVim/Vim#5015](https://github.com/VSCodeVim/Vim/pull/5015)
   *
   * @param untrackedEventSelectionsHash Hashed selections array from a selection change event, that
   * wasn't found in our tracked selections updates to ignore
   * @returns `true` if we should ignore the event as an intermediate selection, else `false`
   */
  private shouldIgnoreAsIntermediateSelection(untrackedEventSelectionsHash: string): boolean {
    if (this.shouldIgnoreIntermediateSelections) {
      this.logTrace(
        `Ignoring intermediate selection change event ${untrackedEventSelectionsHash} while running action`,
      );
      return true;
    }

    if (this.selectionsUpdatesToIgnore.length > 0) {
      this.logWarn(
        `Treating untracked selection change event ${
          untrackedEventSelectionsHash
        } as an intermediate selection to ignore; assuming it slipped past the end of an action we just ran, since there are still ${
          this.selectionsUpdatesToIgnore.length
        } tracked internal selections updates to ignore`,
      );
      return true;
    }

    return false;
  }

  // #endregion

  // #region Ignoring intermediate selections during an action

  /**
   * Whether or not we should be ignoring all incoming VSCode selection change events.
   */
  private shouldIgnoreIntermediateSelections: boolean = false;

  /**
   * To be called when starting an action, to flag that we should start ignoring all incoming
   * VSCode selection change events until we call `stopIgnoringIntermediateSelections`.
   */
  public startIgnoringIntermediateSelections(): void {
    this.shouldIgnoreIntermediateSelections = true;
    this.logDebug('Now ignoring intermediate selection change events while running action');
  }

  /**
   * To be called after running an action, so we can start handling selection change events again.
   */
  public stopIgnoringIntermediateSelections(): void {
    this.shouldIgnoreIntermediateSelections = false;
    this.logDebug('Resuming handling of selection change events after running action');
  }

  // #endregion

  // #region Tracking internal selections updates

  /**
   * Array of hashed and timestamped internal selections updates, whose incoming VSCode selection
   * change events should be ignored. Each tracked update should be removed when we receive its
   * associated selection change event, or cleaned up after an expiry time if its change event never
   * gets fired, so that we don't indefinitely block incoming selection change events from updating
   * our internal state.
   *
   * Note that we intentionally use an array, rather than a set or map, to account for validly
   * identical selection updates which will each trigger their own vscode selection change events;
   * e.g. if we update selections to [1,1][1,1] then [1,2][1,2] and then [1,1][1,1] again.
   */
  private selectionsUpdatesToIgnore: InternalSelectionsUpdate[] = [];

  /**
   * Checks if the selections update will trigger a {@link vscode.TextEditorSelectionChangeEvent},
   * and if so, tracks it so we know to ignore its incoming selection change event. Note that VSCode
   * only fires a selection change event if the editor's selections actually change in value.
   *
   * However, it should be noted that our check isn't perfect here, and we might misguidedly track
   * an update even if it won't actually trigger a selection change event; hence the need to clean
   * up lingering updates from `selectionsUpdatesToIgnore` after an expiry time.
   *
   * This is because behind the scenes, VSCode seems to quickly reset `editor.selections` after it's
   * been set, before properly processing the update and firing a change event. So it's possible for
   * `editor.selections` to lag behind what we've set it to in the previous `updateView` call,
   * leading us to mistakenly think that the current update will trigger a selection change event,
   * even if it won't actually differ from `editor.selections` when VSCode processes this update.
   * See: [VSCodeVim/Vim#9644](https://github.com/VSCodeVim/Vim/pull/9644)
   */
  public maybeTrackSelectionsUpdateToIgnore({
    updatedSelections,
    currentEditorSelections,
  }: {
    updatedSelections: readonly vscode.Selection[];
    currentEditorSelections: readonly vscode.Selection[];
  }): void {
    if (areSelectionArraysEqual(updatedSelections, currentEditorSelections)) {
      // VSCode won't fire a selection change event for this update, so there's no need to track it
      return;
    }
    this.trackSelectionsUpdateToIgnore(updatedSelections);
  }

  private trackSelectionsUpdateToIgnore(updatedSelections: readonly vscode.Selection[]): void {
    const selectionsHash = hashSelectionsArray(updatedSelections);
    this.selectionsUpdatesToIgnore.push({ selectionsHash, trackedAt: Date.now() });
    this.logTrace(
      `Tracking ${selectionsHash} as an internal selections update to ignore. Total tracked now: ${this.selectionsUpdatesToIgnore.length}`,
    );
  }

  /**
   * Removes stale entries from `selectionsUpdatesToIgnore`. Ideally there shouldn't be any stale
   * updates present, and instead every tracked update is removed before expiration when we handle
   * its associated selection change event. But if there are, we remove them so that we don't
   * indefinitely ignore incoming selection change events under the incorrect assumption that they
   * were triggered by internal updates we've already accounted for.
   */
  private cleanupStaleSelectionsUpdatesToIgnore(): void {
    const now = Date.now();
    this.selectionsUpdatesToIgnore = this.selectionsUpdatesToIgnore.filter((entry) => {
      const { trackedAt, selectionsHash } = entry;
      const age = now - trackedAt;
      const hasExpired = age > SELECTIONS_UPDATE_TO_IGNORE_EXPIRY_MS;
      if (hasExpired) {
        this.logWarn(
          `Un-tracking stale internal selections update ${selectionsHash} after ${
            age
          }ms without a matching selection change event (expiry_ms: ${SELECTIONS_UPDATE_TO_IGNORE_EXPIRY_MS}ms)`,
        );
      }
      return !hasExpired;
    });
  }

  // #endregion

  // #region Logging helpers
  private logTrace(message: string): void {
    Logger.trace(`[InternalSelectionsTracker] ${message}`);
  }
  private logDebug(message: string): void {
    Logger.debug(`[InternalSelectionsTracker] ${message}`);
  }
  private logWarn(message: string): void {
    Logger.warn(`[InternalSelectionsTracker] ${message}`);
  }
  // #endregion
}
