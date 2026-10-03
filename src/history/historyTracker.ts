/**
 * HistoryTracker is a handrolled undo/redo tracker for VSC. We currently
 * track history as a list of "steps", each of which consists of 1 or more
 * "changes".
 *
 * A Change is something like adding or deleting a few letters.
 *
 * A Step is multiple Changes.
 *
 * Undo/Redo will advance forward or backwards through Steps.
 */
import * as vscode from 'vscode';

import { Position } from 'vscode';
import { Cursor } from '../common/motion/cursor';
import { earlierOf } from '../common/motion/position';
import { VimError } from '../error';
import { Jump } from '../jumps/jump';
import { Mode } from '../mode/mode';
import { globalState } from '../state/globalState';
import { StatusBar } from '../statusBar';
import { Logger } from '../util/logger';
import { VimState } from './../state/vimState';
import { TextEditor } from './../textEditor';
import {
  applyTextChanges,
  diffTextsToChanges,
  mergeDocumentChanges,
  unapplyTextChanges,
  type ITextChange,
} from './textChange';

class DocumentChange implements ITextChange {
  /**
   * The Position at which this change starts
   */
  public readonly start: Position;

  /**
   * The text that existed before this change
   */
  public readonly before: string;

  /**
   * The text that exists after this change
   */
  public readonly after: string;

  public static insert(start: Position, text: string) {
    return new DocumentChange(start, '', text);
  }

  public static delete(start: Position, text: string) {
    return new DocumentChange(start, text, '');
  }

  public static replace(start: Position, before: string, after: string) {
    return new DocumentChange(start, before, after);
  }

  /**
   * @returns A new DocumentChange that represents undoing this change
   */
  public reversed() {
    return DocumentChange.replace(this.start, this.after, this.before);
  }

  private constructor(start: Position, before: string, after: string) {
    this.start = start;
    this.before = before;
    this.after = after;
  }

  /**
   * Run this change.
   */
  public async do(editor: vscode.TextEditor): Promise<void> {
    await TextEditor.replace(editor, this.beforeRange, this.after);
  }

  /**
   * Run this change in reverse.
   */
  public async undo(editor: vscode.TextEditor): Promise<void> {
    await TextEditor.replace(editor, this.afterRange, this.before);
  }

  /**
   * The Range that the before text occupied
   */
  public get beforeRange(): vscode.Range {
    return new vscode.Range(this.start, this.start.advancePositionByText(this.before));
  }

  /**
   * The Range that the after text occupies
   */
  public get afterRange(): vscode.Range {
    return new vscode.Range(this.start, this.start.advancePositionByText(this.after));
  }
}

interface IMarkBase {
  name: string;
  position: Position;
}

export interface ILocalMark extends IMarkBase {
  isUppercaseMark: false;
}

export interface IGlobalMark extends IMarkBase {
  isUppercaseMark: true;
  document: vscode.TextDocument;
}

export type IMark = ILocalMark | IGlobalMark;

/**
 * An undo's worth of changes; generally corresponds to a single action.
 */
class HistoryStep {
  /**
   * The insertions and deletions that occured in this history step.
   */
  public changes: DocumentChange[];

  /**
   * Whether the user is still inserting or deleting for this history step.
   */
  public isFinished = false;

  /**
   * When this step was finished.
   * // TODO: we currently set it to the current time upon creation to cover some edge cases, but this is messy.
   */
  public timestamp: Date;

  /**
   * The cursor position at the start of this history step.
   * Restored by `u`.
   */
  public cursorsAtStart: readonly Cursor[] | undefined;

  /**
   * The position of every mark at the start of this history step.
   */
  public marks: IMark[] = [];

  /**
   * HACK: true if this step came from `U`.
   * In `UU`, the second `U` should undo the first, and no more.
   */
  public readonly cameFromU: boolean;

  /**
   * "global" marks which operate across files. (when IMark.name is uppercase)
   */
  static globalMarks: IGlobalMark[] = [];

  constructor(init: { marks: IMark[]; changes?: DocumentChange[]; cameFromU?: boolean }) {
    this.changes = init.changes ?? [];
    this.marks = init.marks ?? [];
    this.cameFromU = init.cameFromU ?? false;

    // This will usually be overwritten when the HistoryStep is finished
    this.timestamp = new Date();
  }

  /**
   * Collapse the changes of this step into an equivalent, canonical change list.
   *
   * A step can accumulate changes from several diffs (macros, multi-action remaps,
   * `:normal`, `U`, ...). Merging them pairwise by intersecting ranges is only correct
   * when every overlap lines up at the tail of the previous change; anything else —
   * an edit inside an earlier edit's span, overlapping replaces — silently corrupts
   * the step and breaks later undo/redo (see VSCodeVim/Vim#2007). Instead, delegate to
   * `mergeDocumentChanges()`, which re-derives the step from base to current text.
   */
  public merge(document: vscode.TextDocument): void {
    if (this.changes.length < 2) {
      return;
    }

    const merged = mergeDocumentChanges(this.changes, document.getText());
    this.changes = merged.map((change) =>
      DocumentChange.replace(change.start, change.before, change.after),
    );
  }

  /**
   * The net change in document length produced by applying this step's changes.
   */
  public netLengthDelta(): number {
    return this.changes.reduce(
      (sum, change) => sum + change.after.length - change.before.length,
      0,
    );
  }

  /**
   * Returns, as a string, the time that has passed since this step took place.
   */
  public howLongAgo(): string {
    const now = new Date();
    const timeDiffMillis = now.getTime() - this.timestamp.getTime();
    const timeDiffSeconds = Math.floor(timeDiffMillis / 1000);
    if (timeDiffSeconds === 1) {
      return `1 second ago`;
    } else if (timeDiffSeconds >= 100) {
      const hours = this.timestamp.getHours();
      const minutes = this.timestamp.getMinutes().toString().padStart(2, '0');
      const seconds = this.timestamp.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } else {
      return `${timeDiffSeconds} seconds ago`;
    }
  }
}

/**
 * A simple wrapper around a list of HistorySteps, for sanity's sake
 */
class UndoStack {
  private historySteps: HistoryStep[] = [];
  private currentStepIndex = -1;

  // The marks as they existed before the first HistoryStep
  private initialMarks: IMark[] = [];

  public getHistoryStepAtIndex(idx: number): HistoryStep | undefined {
    return this.historySteps[idx];
  }

  public getCurrentHistoryStepIndex(): number {
    return this.currentStepIndex;
  }

  public getStackDepth(): number {
    return this.historySteps.length;
  }

  /**
   * @returns the current HistoryStep, or undefined if nothing's been done yet
   */
  public getCurrentHistoryStep(): HistoryStep | undefined {
    if (this.currentStepIndex === -1) {
      return undefined;
    }

    return this.historySteps[this.currentStepIndex];
  }

  /**
   * Goes forward in time (redo), if possible
   *
   * @returns the new current HistoryStep, or undefined if none exists
   */
  public stepForward(): HistoryStep | undefined {
    if (this.currentStepIndex === this.historySteps.length - 1) {
      return undefined;
    }

    this.currentStepIndex++;
    return this.getCurrentHistoryStep();
  }

  /**
   * Goes backward in time (undo), if possible
   *
   * @returns the old HistoryStep, or undefined if there was none
   */
  public stepBackward(): HistoryStep | undefined {
    const step = this.getCurrentHistoryStep();
    if (step) {
      this.currentStepIndex--;
    }
    return step;
  }

  /**
   * Adds a change to the current unfinished step if there is one, or a new step if there isn't
   */
  public pushChange(change: DocumentChange): void {
    let step = this.getCurrentHistoryStep();
    if (step === undefined || step.isFinished) {
      this.currentStepIndex++;
      this.historySteps.splice(this.currentStepIndex);
      step = new HistoryStep({
        marks: step?.marks ?? this.initialMarks,
      });
      this.historySteps.push(step);
    }

    step.changes.push(change);
  }

  /**
   * You probably don't want to use this.
   * @see pushChange
   */
  public pushHistoryStep(step: HistoryStep) {
    this.currentStepIndex++;
    this.historySteps.splice(this.currentStepIndex + 1);
    this.historySteps.push(step);
  }

  /**
   * Discards all history. Only used when the tracker is rebound to a different document,
   * in which case none of the recorded steps (nor the local marks versioned with them)
   * can meaningfully apply anymore.
   */
  public clear(): void {
    this.historySteps = [];
    this.currentStepIndex = -1;
    this.initialMarks = [];
  }

  public getCurrentMarkList(): IMark[] {
    const step = this.getCurrentHistoryStep();
    return step?.marks ?? this.initialMarks;
  }

  public removeMarks(marks?: readonly string[]): void {
    const step = this.getCurrentHistoryStep();
    if (marks === undefined) {
      if (step) {
        step.marks = [];
      } else {
        this.initialMarks = [];
      }
    } else {
      if (step) {
        step.marks = step.marks.filter((m) => !marks.includes(m.name));
      } else {
        this.initialMarks = this.initialMarks.filter((m) => !marks.includes(m.name));
      }
    }
  }
}

class ChangeList {
  private readonly changeLocations: Position[] = [];
  private index: number | undefined;

  public addChangePosition(position: Position) {
    if (this.changeLocations.at(-1)?.line === position.line) {
      this.changeLocations[this.changeLocations.length - 1] = position;
    } else {
      this.changeLocations.push(position);
    }

    this.index = undefined;
  }

  public nextChangePosition(): Position | VimError {
    if (this.index === undefined) {
      if (this.changeLocations.length === 0) {
        return VimError.ChangeListIsEmpty();
      }
      this.index = this.changeLocations.length - 1;
    } else if (this.index < this.changeLocations.length - 1) {
      this.index++;
    } else {
      return VimError.AtEndOfChangeList();
    }
    return this.changeLocations[this.index];
  }

  public prevChangePosition(): Position | VimError {
    if (this.index === undefined) {
      if (this.changeLocations.length === 0) {
        return VimError.ChangeListIsEmpty();
      }
      this.index = this.changeLocations.length - 1;
    } else if (this.index > 0) {
      this.index--;
    } else {
      return VimError.AtStartOfChangeList();
    }
    return this.changeLocations[this.index];
  }
}

export class HistoryTracker {
  public currentContentChanges: vscode.TextDocumentContentChangeEvent[] = [];

  private nextStepCursorsAtStart: readonly Cursor[] | undefined;

  private readonly undoStack = new UndoStack();

  private readonly changeList = new ChangeList();

  /**
   * The state of the document the last time HistoryTracker.addChange() or HistoryTracker.ignoreChange() was called.
   * This is used to avoid retrieiving the document text and doing a full diff when it isn't necessary.
   *
   * Besides text and version this also records the document's identity: without it, a
   * handler reused across documents would diff one file's text against another's and
   * record a bogus delete-everything/insert-everything step (see VSCodeVim/Vim#2007).
   */
  private previousDocumentState: {
    text: string;
    versionNumber: number;
    document: vscode.TextDocument | undefined;
    documentUri: string | undefined;
  };

  /**
   * Native (non-Vim) undo/redo operations observed since the last sync, oldest first.
   *
   * Latched by `noteNativeUndoRedo()` from the global `onDidChangeTextDocument` listener
   * (which is the only place that sees the event's `reason`) and consumed by `addChange()`.
   * Capped: beyond `maxPendingNativeUndoRedo` we stop trusting the sequence and fall back
   * to recording the net diff, exactly like before.
   */
  private pendingNativeUndoRedo: Array<'undo' | 'redo'> = [];
  private pendingNativeUndoRedoOverflowed = false;
  private static readonly maxPendingNativeUndoRedo = 100;

  private readonly vimState: VimState;

  constructor(vimState: VimState) {
    this.vimState = vimState;
    const document = this.vimState.editor?.document;
    this.previousDocumentState = {
      text: this.getDocumentText(),
      versionNumber: this.getDocumentVersion(),
      document,
      documentUri: document?.uri.toString(),
    };
  }

  private getDocumentText(): string {
    // vimState.editor can be undefined in some unit tests
    return this.vimState.editor?.document.getText() ?? '';
  }

  private getDocumentVersion(): number {
    // vimState.editor can be undefined in some unit tests
    return this.vimState.editor?.document.version ?? -1;
  }

  /**
   * Marks refer to relative locations in the document, rather than absolute ones.
   *
   * This big gnarly method updates our marks such that they continue to mark
   * the same character when the user does a document edit that would move the
   * text that was marked.
   */
  private updateAndReturnMarks(document: vscode.TextDocument): IMark[] {
    const previousMarks = this.getAllMarksInDocument(document);
    const newMarks: IMark[] = [];

    // clone old marks into new marks
    for (const mark of previousMarks) {
      newMarks.push({ ...mark });
    }

    for (const change of this.undoStack.getCurrentHistoryStep()?.changes ?? []) {
      for (const newMark of newMarks) {
        // Run through each character added/deleted, and see if it could have
        // affected the position of this mark.

        let pos = change.start;

        // Pull mark back with deleted text
        for (const ch of change.before.replace(/\r/g, '')) {
          if (pos.isBefore(newMark.position)) {
            if (ch === '\n') {
              newMark.position = new Position(
                Math.max(newMark.position.line - 1, 0),
                newMark.position.character,
              );
            } else if (pos.line === newMark.position.line) {
              newMark.position = new Position(
                newMark.position.line,
                Math.max(newMark.position.character - 1, 0),
              );
            }
          }

          if (ch === '\n') {
            // The 99999 is a bit of a hack here. It's very difficult and
            // completely unnecessary to get the correct position, so we
            // just fake it.
            pos = new Position(Math.max(pos.line - 1, 0), 99999);
          } else {
            pos = new Position(pos.line, Math.max(pos.character - 1, 0));
          }
        }

        pos = change.start;

        // Push mark forward with added text
        for (const ch of change.after.replace(/\r/g, '')) {
          if (pos.isBeforeOrEqual(newMark.position)) {
            if (ch === '\n') {
              newMark.position = new Position(
                newMark.position.line + 1,
                newMark.position.character,
              );
            } else if (pos.line === newMark.position.line) {
              newMark.position = new Position(
                newMark.position.line,
                newMark.position.character + 1,
              );
            }
          }

          if (ch === '\n') {
            pos = new Position(pos.line + 1, 0);
          } else {
            pos = new Position(pos.line, pos.character + 1);
          }
        }
      }
    }

    // Ensure the position of every mark is within the range of the document.

    const docEnd = TextEditor.getDocumentEnd(this.vimState.document);
    for (const mark of newMarks) {
      if (mark.position.isAfter(docEnd)) {
        mark.position = docEnd;
      }
    }

    return newMarks;
  }

  /**
   * @returns the shared static list if isFileMark is true, otherwise returns the currentHistoryStep.marks.
   */
  private getMarkList(isFileMark: boolean): IMark[] {
    return isFileMark ? HistoryStep.globalMarks : this.undoStack.getCurrentMarkList();
  }

  /**
   * @returns all local and global marks in the given editor
   */
  private getAllMarksInDocument(document: vscode.TextDocument): IMark[] {
    const globalMarks = HistoryStep.globalMarks.filter((mark) => mark.document === document);
    return [...this.getLocalMarks(), ...globalMarks];
  }

  /**
   * Adds a mark.
   */
  public addMark(document: vscode.TextDocument, position: Position, markName: string): void {
    if (markName === "'" || markName === '`') {
      globalState.jumpTracker.recordJump(Jump.fromStateNow(this.vimState));
    } else if (markName === '<') {
      if (this.vimState.lastVisualSelection) {
        this.vimState.lastVisualSelection.start = position;
      } else {
        this.vimState.lastVisualSelection = {
          mode: Mode.Visual,
          start: position,
          end: position,
        };
      }
      if (
        this.vimState.lastVisualSelection.mode === Mode.Visual &&
        this.vimState.lastVisualSelection.end.isBefore(this.vimState.lastVisualSelection.start)
      ) {
        // HACK: Visual mode representation is stupid
        this.vimState.lastVisualSelection.end = this.vimState.lastVisualSelection.start;
      }
    } else if (markName === '>') {
      if (this.vimState.lastVisualSelection) {
        this.vimState.lastVisualSelection.end = position.getRight();
      } else {
        this.vimState.lastVisualSelection = {
          mode: Mode.Visual,
          start: position.getRight(),
          end: position.getRight(),
        };
      }
      if (
        this.vimState.lastVisualSelection.mode === Mode.Visual &&
        this.vimState.lastVisualSelection.start.isAfter(this.vimState.lastVisualSelection.end)
      ) {
        // HACK: Visual mode representation is stupid
        this.vimState.lastVisualSelection.start = this.vimState.lastVisualSelection.end.getLeft();
        this.vimState.lastVisualSelection.end = this.vimState.lastVisualSelection.start;
      }
    } else {
      const isUppercaseMark = markName.toUpperCase() === markName;
      const newMark: IMark = isUppercaseMark
        ? {
            position,
            name: markName,
            isUppercaseMark,
            document,
          }
        : {
            position,
            name: markName,
            isUppercaseMark,
          };
      this.putMarkInList(newMark);
    }
  }

  /**
   * Puts the mark into either the global or local marks array depending on mark.isUppercaseMark.
   */
  private putMarkInList(mark: IMark): void {
    const marks = this.getMarkList(mark.isUppercaseMark);
    const previousIndex = marks.findIndex((existingMark) => existingMark.name === mark.name);
    if (previousIndex !== -1) {
      marks[previousIndex] = mark;
    } else {
      marks.push(mark);
    }
  }

  /**
   * Retrieves a mark from either the global or local array depending on mark.isUppercaseMark.
   */
  public getMark(name: string): IMark | undefined {
    // First, handle "special" marks
    let position: Position | undefined;
    if (name === '<') {
      const lvs = this.vimState.lastVisualSelection;
      const linewise = lvs?.mode === Mode.VisualLine;
      // If start is after end, prefer end (handles inverted visual selections)
      const base = lvs?.start.isAfter(lvs.end) ? lvs.end : lvs?.start;
      position = linewise ? base?.with({ character: 0 }) : base;
    } else if (name === '>') {
      const lvs = this.vimState.lastVisualSelection;
      const linewise = lvs?.mode === Mode.VisualLine;
      // If start is after end, prefer start (handles inverted visual selections)
      const base = lvs?.start.isAfter(lvs.end) ? lvs.start : lvs?.end.getLeft();
      position = linewise ? base?.getLineEnd() : base;
    } else if (name === '[') {
      position = this.getLastChangeStartPosition();
    } else if (name === ']') {
      position = this.getLastChangeEndPosition();
    } else if (name === '.') {
      position = this.getLastHistoryStartPosition();
    } else if (name === "'" || name === '`') {
      position = globalState.jumpTracker.end?.position;
    }
    if (position) {
      return {
        name,
        position,
        isUppercaseMark: false,
      };
    }

    const marks = this.getMarkList(name.toUpperCase() === name);
    return marks.find((mark) => mark.name === name);
  }

  /**
   * Removes all local marks.
   */
  public removeLocalMarks(): void {
    this.undoStack.removeMarks();
  }

  /**
   * Removes all marks matching from either the global or local array.
   */
  public removeMarks(markNames: readonly string[]): void {
    if (markNames.length === 0) {
      return;
    }

    this.undoStack.removeMarks(markNames);

    HistoryStep.globalMarks = HistoryStep.globalMarks.filter(
      (mark) => mark.name === '' || !markNames.includes(mark.name),
    );
  }

  /**
   * Gets all local marks.  I.e., marks that are specific for the current
   * editor.
   */
  public getLocalMarks(): readonly ILocalMark[] {
    return this.undoStack.getCurrentMarkList().filter((mark) => !mark.isUppercaseMark);
  }

  /**
   * Gets all global marks.  I.e., marks that are shared among all editors.
   */
  public getGlobalMarks(): readonly IMark[] {
    return HistoryStep.globalMarks;
  }

  public getMarks(): readonly IMark[] {
    return [...this.getLocalMarks(), ...HistoryStep.globalMarks];
  }

  /**
   * Adds an individual Change to the current Step.
   *
   * Determines what changed by diffing the document against what it used to look like.
   */
  public addChange(force: boolean = false): boolean {
    const document = this.vimState.editor?.document;
    const versionNumber = document?.version ?? -1;

    if (
      document !== this.previousDocumentState.document ||
      document?.uri.toString() !== this.previousDocumentState.documentUri
    ) {
      // The handler is looking at a different document than we last synced (this should
      // barely happen since handlers are keyed by document, but it must never produce a
      // cross-document diff). Rebind instead of recording a bogus whole-file change.
      this.rebindToDocument(document);
      return false;
    }

    if (versionNumber === this.previousDocumentState.versionNumber) {
      // Nothing changed since the last sync. (A document change event always bumps the
      // version, so any latched native undo/redo would be stale — drop it.)
      this.clearPendingNativeUndoRedo();
      return false;
    }

    if (this.nextStepCursorsAtStart === undefined) {
      this.nextStepCursorsAtStart = this.vimState.cursorsInitialState;
      Logger.debug(`Set nextStepCursorsAtStart to ${this.nextStepCursorsAtStart}`);
    }

    if (
      !force &&
      (this.vimState.currentMode === Mode.Insert || this.vimState.currentMode === Mode.Replace)
    ) {
      // We can ignore changes while we're in insert/replace mode, since we can't interact with them (via undo, etc.) until we're back to normal mode
      // This allows us to avoid a little bit of work per keystroke, but more importantly, it means we'll get bigger contiguous edit chunks to merge.
      // This is particularly impactful when there are multiple cursors, which are otherwise difficult to optimize.
      // NOTE: latched native undo/redo is deliberately *not* consumed here; it persists
      // until the insert/replace session is flushed and reconciled below.
      return false;
    }

    const newText = this.getDocumentText();

    if (this.pendingNativeUndoRedo.length > 0) {
      // The document was (at least partially) changed by native undo/redo. If those
      // operations exactly undid/redid our own steps, mirror them onto the stack instead
      // of recording them as new forward changes; otherwise fall through and record the
      // net diff exactly like before.
      if (this.tryMirrorNativeUndoRedo(newText)) {
        return false;
      }
    }

    if (newText === this.previousDocumentState.text) {
      // The version bumped but the text is identical (e.g. something was natively undone
      // and redone). Sync the version so we don't re-diff on every subsequent keypress.
      this.previousDocumentState.versionNumber = versionNumber;
      return false;
    }

    // TODO: This is actually pretty stupid! Since we already have the cursorPosition,
    // and most diffs are just +/- a few characters, we can just do a direct comparison rather
    // than using jsdiff.

    // The difficulty is with a few rare commands like :%s/one/two/g that make
    // multiple changes in different places simultaneously. For those, we could require
    // them to call addChange manually, I guess...

    // Couldn't we also ditch this diffing approach entirely and just use `TextDocumentContentChangeEvent`s?

    for (const change of diffTextsToChanges(this.previousDocumentState.text, newText)) {
      this.undoStack.pushChange(DocumentChange.replace(change.start, change.before, change.after));
    }

    this.previousDocumentState.text = newText;
    this.previousDocumentState.versionNumber = versionNumber;

    return true;
  }

  /**
   * Rebinds the tracker to `document`, which differs from the last synced one.
   *
   * If the text is identical (rename, save-as, or swapping between identical files) the
   * geometry is unchanged, so recorded steps still apply and only the identity is
   * re-stamped. Otherwise all history is dropped — a fresh handler would start empty —
   * instead of recording a bogus delete-everything/insert-everything step.
   */
  private rebindToDocument(document: vscode.TextDocument | undefined): void {
    const newText = document?.getText() ?? '';
    if (newText === this.previousDocumentState.text) {
      this.previousDocumentState.document = document;
      this.previousDocumentState.documentUri = document?.uri.toString();
      this.previousDocumentState.versionNumber = document?.version ?? -1;
    } else {
      this.undoStack.clear();
      this.previousDocumentState = {
        text: newText,
        versionNumber: document?.version ?? -1,
        document,
        documentUri: document?.uri.toString(),
      };
    }
    this.clearPendingNativeUndoRedo();
  }

  /**
   * Records a native (non-Vim) undo/redo of the tracked document.
   *
   * Called from the global `onDidChangeTextDocument` listener in `extensionBase.ts`, which
   * is the only place that observes the change event's `reason`. Anything else (including
   * our own programmatic edits, whose `reason` is `undefined`) is ignored.
   */
  public noteNativeUndoRedo(reason: vscode.TextDocumentChangeReason | undefined): void {
    if (reason === vscode.TextDocumentChangeReason.Undo) {
      this.pushPendingNativeUndoRedo('undo');
    } else if (reason === vscode.TextDocumentChangeReason.Redo) {
      this.pushPendingNativeUndoRedo('redo');
    }
  }

  private pushPendingNativeUndoRedo(op: 'undo' | 'redo'): void {
    if (this.pendingNativeUndoRedo.length >= HistoryTracker.maxPendingNativeUndoRedo) {
      this.pendingNativeUndoRedoOverflowed = true;
      return;
    }
    this.pendingNativeUndoRedo.push(op);
  }

  private clearPendingNativeUndoRedo(): void {
    this.pendingNativeUndoRedo = [];
    this.pendingNativeUndoRedoOverflowed = false;
  }

  /**
   * Attempts to mirror latched native undo/redo operations onto the undo stack.
   *
   * Simulates the latched sequence against the last synced text: an `undo` un-applies the
   * current tip step, a `redo` re-applies the next one. If the simulation lands exactly on
   * `newText`, the stack pointer is silently moved there (as if the user had pressed `u` /
   * `Ctrl-r`), the state is synced, and no phantom forward change is recorded. Marks need
   * no updating: they are versioned per step, so moving the pointer restores them.
   *
   * If anything doesn't line up (mixed with other edits, only partially overlapping our
   * steps, stack boundaries, overflow, ...), returns false and the caller falls back to
   * recording the net diff as a forward change — the previous behavior. Mirroring can
   * therefore never corrupt the stack; it only avoids recording when it is provably exact.
   *
   * @returns true if the operations were mirrored (and the state synced).
   */
  private tryMirrorNativeUndoRedo(newText: string): boolean {
    const ops = this.pendingNativeUndoRedo;
    const overflowed = this.pendingNativeUndoRedoOverflowed;
    this.clearPendingNativeUndoRedo();

    if (overflowed || ops.length === 0) {
      return false;
    }

    // Cheap precheck: simulate only the net length deltas before touching any strings.
    let index = this.undoStack.getCurrentHistoryStepIndex();
    let expectedLength = this.previousDocumentState.text.length;
    for (const op of ops) {
      const step =
        op === 'undo'
          ? this.undoStack.getHistoryStepAtIndex(index)
          : this.undoStack.getHistoryStepAtIndex(index + 1);
      if (step === undefined) {
        return false;
      }
      expectedLength += op === 'undo' ? -step.netLengthDelta() : step.netLengthDelta();
      index += op === 'undo' ? -1 : 1;
    }
    if (expectedLength !== newText.length) {
      return false;
    }

    // Full simulation against the last synced text.
    let simulated = this.previousDocumentState.text;
    index = this.undoStack.getCurrentHistoryStepIndex();
    for (const op of ops) {
      // Existence was verified by the precheck above.
      const step = this.undoStack.getHistoryStepAtIndex(op === 'undo' ? index : index + 1)!;
      simulated =
        op === 'undo'
          ? unapplyTextChanges(simulated, step.changes)
          : applyTextChanges(simulated, step.changes);
      index += op === 'undo' ? -1 : 1;
    }
    if (simulated !== newText) {
      return false;
    }

    for (const op of ops) {
      if (op === 'undo') {
        this.undoStack.stepBackward();
      } else {
        this.undoStack.stepForward();
      }
    }
    this.ignoreChange();
    return true;
  }

  /**
   * Tells the HistoryTracker that although the document has changed, we should simply
   * ignore that change. Most often used when the change was itself triggered by
   * the HistoryTracker.
   */
  public ignoreChange(): void {
    const document = this.vimState.editor?.document;
    this.previousDocumentState = {
      text: this.getDocumentText(),
      versionNumber: this.getDocumentVersion(),
      document,
      documentUri: document?.uri.toString(),
    };
  }

  /**
   * Until we mark it as finished, the active Step will
   * accrue multiple changes. This function will mark it as finished,
   * and the next time we add a change, it'll be added to a new Step.
   */
  public finishCurrentStep(): void {
    const currentHistoryStep = this.undoStack.getCurrentHistoryStep();
    if (currentHistoryStep && !currentHistoryStep.isFinished) {
      currentHistoryStep.isFinished = true;
      currentHistoryStep.timestamp = new Date();

      if (this.nextStepCursorsAtStart !== undefined) {
        currentHistoryStep.cursorsAtStart ??= this.nextStepCursorsAtStart;
        this.nextStepCursorsAtStart = undefined;
      }

      currentHistoryStep.merge(this.vimState.document);

      currentHistoryStep.marks = this.updateAndReturnMarks(this.vimState.document);

      const changes = currentHistoryStep.changes;
      if (changes) {
        const changePos = changes[0].after ? changes[0].afterRange.end.getLeft() : changes[0].start;
        this.changeList.addChangePosition(changePos);
      }

      Logger.debug(`Finished history step with ${changes.length} change(s)`);
    }
  }

  /**
   * Undo the current HistoryStep, if there is one
   *
   * @returns the new cursor positions, or undefined if there are no steps to undo
   */
  public async goBackHistoryStep(): Promise<void> {
    const step = this.undoStack.stepBackward();
    if (step === undefined) {
      StatusBar.setText(this.vimState, 'Already at oldest change');
      return;
    }

    for (const change of step.changes.slice(0).reverse()) {
      await change.undo(this.vimState.editor);
    }

    this.ignoreChange();

    // TODO: if there are more/fewer lines after undoing the change, it should say so
    const changes = step.changes.length === 1 ? `1 change` : `${step.changes.length} changes`;
    StatusBar.setText(
      this.vimState,
      `${changes}; before #${
        this.undoStack.getCurrentHistoryStepIndex() + 1
      }  ${step.howLongAgo()}`,
    );

    const newCursors = step.cursorsAtStart?.map((c) => {
      return Cursor.atPosition(earlierOf(c.start, c.stop));
    });
    if (newCursors) {
      this.vimState.cursors = newCursors;
    }
  }

  /**
   * Redo the next HistoryStep, if there is one
   *
   * @returns the new cursor positions, or undefined if there are no steps to redo
   */
  public async goForwardHistoryStep(): Promise<void> {
    const step = this.undoStack.stepForward();
    if (step === undefined) {
      StatusBar.setText(this.vimState, 'Already at newest change');
      return;
    }

    // TODO: do these transformations in a batch
    for (const change of step.changes) {
      await change.do(this.vimState.editor);
    }

    this.ignoreChange();

    const changes = step.changes.length === 1 ? `1 change` : `${step.changes.length} changes`;
    StatusBar.setText(
      this.vimState,
      `${changes}; after #${this.undoStack.getCurrentHistoryStepIndex()}  ${step.howLongAgo()}`,
    );

    const newCursors = step.cursorsAtStart?.map((c) => {
      return Cursor.atPosition(earlierOf(c.start, c.stop));
    });
    if (newCursors) {
      this.vimState.cursors = newCursors;
    }
  }

  /**
   * Logic for command U.
   *
   * Performs an undo action for all changes which occurred on
   * the same line as the most recent change.
   * Returns undefined if there's no more steps back to go.
   * Only acts upon consecutive changes on the most-recently-changed line.
   * U itself is a change, so all the changes are reversed and added back
   * to the history.
   *
   * This method contains a significant amount of extra logic to account for
   * the difficult scenario where a newline is embedded in a change (ex: '\nhello'), which
   * is created by the 'o' command. Vim behavior for the 'U' command does
   * not undo newlines, so the change text needs to be checked & trimmed.
   * This worst-case scenario tends to offset line values and make it harder to
   * determine the line of the change, so this behavior is also compensated.
   */
  public async goBackHistoryStepsOnLine(): Promise<void> {
    const currentHistoryStep = this.undoStack.getCurrentHistoryStep();
    if (currentHistoryStep === undefined) {
      return;
    }

    let done: boolean = false;
    const changesToUndo: DocumentChange[] = [];

    let lastChange = currentHistoryStep.changes[currentHistoryStep.changes.length - 1];
    const undoLine = lastChange.afterRange.end.line;

    for (let stepIdx = this.undoStack.getCurrentHistoryStepIndex(); stepIdx >= 0; stepIdx--) {
      const step = this.undoStack.getHistoryStepAtIndex(stepIdx)!;
      for (let change of [...step.changes].reverse()) {
        /*
         * This conditional accounts for the behavior where the change is a newline
         * followed by text to undo. Note the line offset behavior that must be compensated.
         */
        const newlines = [...change.after.matchAll(/\n/g)];
        if (newlines.length > 0 && change.start.line + newlines.length === undoLine) {
          // Modify & replace the change to avoid undoing the newline embedded in the change
          change = DocumentChange.insert(
            new Position(change.start.line + 1, 0),
            change.after.slice(change.after.lastIndexOf('\n')),
          );
          done = true;
        } else if (newlines.length > 0 || change.start.line !== undoLine) {
          done = true;
          break;
        }

        changesToUndo.push(change);
        lastChange = change;
        if (done) {
          break;
        }
      }
      if (step.cameFromU) {
        done = true;
      }
      if (done) {
        break;
      }
    }

    if (changesToUndo.length > 0) {
      for (const change of changesToUndo) {
        await change.undo(this.vimState.editor);
      }

      const newStep = new HistoryStep({
        marks: this.undoStack.getCurrentMarkList(),
        changes: changesToUndo.map((change) => change.reversed()).reverse(),
        cameFromU: true,
      });
      this.nextStepCursorsAtStart = [Cursor.atPosition(lastChange.start)];
      this.undoStack.pushHistoryStep(newStep);

      this.finishCurrentStep();
    }

    this.ignoreChange();

    /*
     * Unlike the goBackHistoryStep() function, this function does not trust the
     * HistoryStep.cursorStart property. This can lead to invalid cursor position errors.
     * Since this function reverses change-by-change, rather than step-by-step,
     * the cursor position is based on the start of the last change that is undone.
     */
    if (lastChange) {
      this.vimState.cursors = [Cursor.atPosition(lastChange.start)];
    }
  }

  /**
   * Gets the ending cursor position of the last Change of the last Step.
   *
   * In practice, this sets the cursor position to the end of
   * the most recent text change.
   */
  public getLastChangeEndPosition(): Position | undefined {
    return this.undoStack.getCurrentHistoryStep()?.changes.at(-1)?.afterRange.end;
  }

  public getLastHistoryStartPosition(): Position | undefined {
    return this.undoStack.getCurrentHistoryStep()?.cursorsAtStart?.[0]?.start;
  }

  private getLastChangeStartPosition(): Position | undefined {
    return this.undoStack.getCurrentHistoryStep()?.changes.at(-1)?.start;
  }

  /**
   * Logic for `g,` command
   */
  public nextChangeInChangeList(): Position | VimError {
    return this.changeList.nextChangePosition();
  }

  /**
   * Logic for `g;` command
   */
  public prevChangeInChangeList(): Position | VimError {
    return this.changeList.prevChangePosition();
  }
}
