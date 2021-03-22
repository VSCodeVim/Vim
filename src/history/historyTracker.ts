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
import DiffMatchPatch = require('diff-match-patch');
import * as vscode from 'vscode';

import { Logger } from './../util/logger';
import { VimState } from './../state/vimState';
import { TextEditor } from './../textEditor';
import { StatusBar } from '../statusBar';
import { Position } from 'vscode';
import { Jump } from '../jumps/jump';
import { globalState } from '../state/globalState';

const diffEngine = new DiffMatchPatch.diff_match_patch();
diffEngine.Diff_Timeout = 1; // 1 second

class DocumentChange {
  public readonly start: Position;

  /**
   * true => addition
   * false => deletion
   */
  // TODO: support replacement, which would cut the number of changes for :s/foo/bar in half
  public isAdd: boolean;

  private _end: Position | undefined;
  private _text: string;

  constructor(start: Position, text: string, isAdd: boolean) {
    this.start = start;
    this._text = text;
    this.isAdd = isAdd;
  }

  /**
   * Run this change.
   */
  public async do(editor: vscode.TextEditor, undo = false): Promise<void> {
    if ((this.isAdd && !undo) || (!this.isAdd && undo)) {
      await TextEditor.insert(editor, this.text, this.start, false);
    } else {
      await TextEditor.delete(editor, new vscode.Range(this.start, this.end));
    }
  }

  /**
   * Run this change in reverse.
   */
  public async undo(editor: vscode.TextEditor): Promise<void> {
    return this.do(editor, true);
  }

  /**
   * The position after advancing start by text
   */
  public get end(): Position {
    if (this._end === undefined) {
      this._end = this.start.advancePositionByText(this._text);
    }
    return this._end;
  }

  public get text(): string {
    return this._text;
  }

  public set text(text: string) {
    this._text = text;
    this._end = undefined;
  }
}

export interface IMark {
  name: string;
  position: Position;
  isUppercaseMark: boolean;
  editor?: vscode.TextEditor; // only required when using global marks (isUppercaseMark is true)
}

/**
 * An undo's worth of changes; generally corresponds to a single action.
 */
class HistoryStep {
  /**
   * The insertions and deletions that occured in this history step.
   */
  changes: DocumentChange[];

  /**
   * Whether the user is still inserting or deleting for this history step.
   */
  isFinished: boolean;

  /**
   * When this step was finished.
   * // TODO: we currently set it to the current time upon creation to cover some edge cases, but this is messy.
   */
  timestamp: Date;

  /**
   * The cursor position at the start of this history step.
   */
  cursorStart: Position[] | undefined;

  /**
   * The cursor position at the end of this history step so far.
   */
  cursorEnd: Position[] | undefined;

  /**
   * The position of every mark at the start of this history step.
   */
  marks: IMark[] = [];

  /**
   * "global" marks which operate across files. (when IMark.name is uppercase)
   */
  static globalMarks: IMark[] = [];

  constructor(init: {
    changes?: DocumentChange[];
    isFinished?: boolean;
    cursorStart?: Position[] | undefined;
    cursorEnd?: Position[] | undefined;
    marks?: IMark[];
  }) {
    // This is a bug, but fixing it causes regressions. See PR #2081.
    this.changes = init.changes = [];
    this.isFinished = init.isFinished || false;
    this.cursorStart = init.cursorStart || undefined;
    this.cursorEnd = init.cursorEnd || undefined;
    this.marks = init.marks || [];

    // This will usually be overwritten when the HistoryStep is finished
    this.timestamp = new Date();
  }

  /**
   * Collapse individual character changes into larger blocks of changes
   */
  public merge(): void {
    if (this.changes.length < 2) {
      return;
    }

    // merged will replace this.changes
    const merged: DocumentChange[] = [];
    // manually reduce() this.changes with variables `current` and `next`
    // we can't use reduce() directly because the loop can emit multiple elements
    let current = this.changes[0];
    for (const next of this.changes.slice(1)) {
      if (current.text.length === 0) {
        // current is eliminated, replace it with top of merged, or adopt next as current
        // see also add+del case
        if (merged.length > 0) {
          current = merged.pop()!;
        } else {
          current = next;
          continue;
        }
      }
      // merge logic. also compares start & end Positions to ensure this is the same location
      if (current.isAdd && next.isAdd && current.end.isEqual(next.start)) {
        // merge add+add together
        current.text += next.text;
      } else if (!current.isAdd && !next.isAdd && next.end.isEqual(current.start)) {
        // merge del+del together, but in reverse so it still reads forward
        next.text += current.text;
        current = next;
      } else if (current.isAdd && !next.isAdd && current.end.isEqual(next.end)) {
        // collapse add+del into add. this might make current.text.length === 0, see beginning of loop
        current.text = current.text.slice(0, -next.text.length);
      } else {
        // del+add must be two separate DocumentChanges. e.g. start with "a|b", do `i<BS>x<Esc>` you end up with "|xb"
        // also handles multiple changes in distant locations in the document
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
    this.changes = merged;
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
   * Goes forward in time (redo), if possible
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

  public getCurrentMarkList(): IMark[] {
    const step = this.getCurrentHistoryStep();
    return step?.marks ?? this.initialMarks;
  }

  public removeMarks(marks?: string[]): void {
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

export class HistoryTracker {
  private static readonly logger = Logger.get('DocumentChange');
  public lastContentChanges: vscode.TextDocumentContentChangeEvent[];
  public currentContentChanges: vscode.TextDocumentContentChangeEvent[];

  // Current index in changelist for navigation, resets when a new change is made
  public changelistIndex = 0;

  private undoStack: UndoStack;

  /**
   * The state of the document the last time HistoryTracker.addChange() or HistoryTracker.ignoreChange() was called.
   * This is used to avoid retrieiving the document text and doing a full diff when it isn't necessary.
   */
  private previousDocumentState: {
    text: string;
    versionNumber: number;
  };

  private readonly vimState: VimState;

  constructor(vimState: VimState) {
    this.vimState = vimState;
    this.undoStack = new UndoStack();
    this.previousDocumentState = {
      text: this.getDocumentText(),
      versionNumber: this.getDocumentVersion(),
    };
    this.lastContentChanges = [];
    this.currentContentChanges = [];
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
  private updateAndReturnMarks(): IMark[] {
    const previousMarks = this.getAllCurrentDocumentMarks();
    const newMarks: IMark[] = [];

    // clone old marks into new marks
    for (const mark of previousMarks) {
      newMarks.push({ ...mark });
    }

    for (const change of this.undoStack.getCurrentHistoryStep()?.changes ?? []) {
      for (const newMark of newMarks) {
        // Run through each character added/deleted, and see if it could have
        // affected the position of this mark.

        let pos: Position = change.start;

        if (change.isAdd) {
          // (Yes, I could merge these together, but that would obfusciate the logic.)

          for (const ch of change.text) {
            // Update mark

            if (pos.isBeforeOrEqual(newMark.position)) {
              if (ch === '\n') {
                newMark.position = new Position(
                  newMark.position.line + 1,
                  newMark.position.character
                );
              } else if (ch !== '\n' && pos.line === newMark.position.line) {
                newMark.position = new Position(
                  newMark.position.line,
                  newMark.position.character + 1
                );
              }
            }

            // Advance position

            if (ch === '\n') {
              pos = new Position(pos.line + 1, 0);
            } else {
              pos = new Position(pos.line, pos.character + 1);
            }
          }
        } else {
          for (const ch of change.text) {
            // Update mark

            if (pos.isBefore(newMark.position)) {
              if (ch === '\n') {
                newMark.position = new Position(
                  Math.max(newMark.position.line - 1, 0),
                  newMark.position.character
                );
              } else if (pos.line === newMark.position.line) {
                newMark.position = new Position(
                  newMark.position.line,
                  Math.max(newMark.position.character - 1, 0)
                );
              }
            }

            // De-advance position
            // (What's the opposite of advance? Retreat position?)

            if (ch === '\n') {
              // The 99999 is a bit of a hack here. It's very difficult and
              // completely unnecessary to get the correct position, so we
              // just fake it.
              pos = new Position(Math.max(pos.line - 1, 0), 99999);
            } else {
              pos = new Position(pos.line, Math.max(pos.character - 1, 0));
            }
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
   * Returns the shared static list if isFileMark is true,
   * otherwise returns the currentHistoryStep.marks.
   */
  private getMarkList(isFileMark: boolean): IMark[] {
    return isFileMark ? HistoryStep.globalMarks : this.undoStack.getCurrentMarkList();
  }

  /**
   * @returns all local and global marks in this editor
   */
  private getAllCurrentDocumentMarks(): IMark[] {
    const globalMarks = HistoryStep.globalMarks.filter(
      (mark) => mark.editor === vscode.window.activeTextEditor
    );
    return [...this.getLocalMarks(), ...globalMarks];
  }

  /**
   * Adds a mark.
   */
  public addMark(position: Position, markName: string): void {
    // Sets previous context mark (adds current position to jump list).

    if (markName === "'" || markName === '`') {
      return globalState.jumpTracker.recordJump(Jump.fromStateNow(this.vimState));
    }

    const isUppercaseMark = markName.toUpperCase() === markName;
    const newMark: IMark = {
      position,
      name: markName,
      isUppercaseMark,
      editor: isUppercaseMark ? vscode.window.activeTextEditor : undefined,
    };
    this.putMarkInList(newMark);
  }

  /**
   * Puts the mark into either the global or local marks array depending on
   * mark.isUppercaseMark.
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
   * Retrieves a mark from either the global or local array depending on
   * mark.isUppercaseMark.
   */
  public getMark(markName: string): IMark | undefined {
    const marks = this.getMarkList(markName.toUpperCase() === markName);
    return marks.find((mark) => mark.name === markName);
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
  public removeMarks(markNames: string[]): void {
    if (markNames.length === 0) {
      return;
    }

    this.undoStack.removeMarks(markNames);

    HistoryStep.globalMarks = HistoryStep.globalMarks.filter(
      (mark) => mark.name === '' || !markNames.includes(mark.name)
    );
  }

  /**
   * Gets all local marks.  I.e., marks that are specific for the current
   * editor.
   */
  public getLocalMarks(): IMark[] {
    return [...this.undoStack.getCurrentMarkList()];
  }

  /**
   * Gets all global marks.  I.e., marks that are shared among all editors.
   */
  public getGlobalMarks(): IMark[] {
    return [...HistoryStep.globalMarks];
  }

  public getMarks(): IMark[] {
    return [...this.getLocalMarks(), ...HistoryStep.globalMarks];
  }

  /**
   * Adds an individual Change to the current Step.
   *
   * Determines what changed by diffing the document against what it used to look like.
   */
  public addChange(cursorPosition = [new Position(0, 0)]): void {
    if (this.getDocumentVersion() === this.previousDocumentState.versionNumber) {
      return;
    }

    const newText = this.getDocumentText();
    if (newText === this.previousDocumentState.text) {
      return;
    }

    // TODO: This is actually pretty stupid! Since we already have the cursorPosition,
    // and most diffs are just +/- a few characters, we can just do a direct comparison rather
    // than using jsdiff.

    // The difficulty is with a few rare commands like :%s/one/two/g that make
    // multiple changes in different places simultaneously. For those, we could require
    // them to call addChange manually, I guess...

    const diffs = diffEngine.diff_main(this.previousDocumentState.text, newText);
    diffEngine.diff_cleanupEfficiency(diffs);

    let currentPosition = new Position(0, 0);

    for (const diff of diffs) {
      const [whatHappened, text] = diff;
      const added = whatHappened === DiffMatchPatch.DIFF_INSERT;
      const removed = whatHappened === DiffMatchPatch.DIFF_DELETE;

      let change: DocumentChange;

      if (added || removed) {
        change = new DocumentChange(currentPosition, text, !!added);

        this.undoStack.pushChange(change);

        this.undoStack.getCurrentHistoryStep()!.cursorStart ??= cursorPosition;
      }

      if (!removed) {
        currentPosition = currentPosition.advancePositionByText(text);
      }
    }

    this.undoStack.getCurrentHistoryStep()!.cursorEnd = cursorPosition;
    this.previousDocumentState = {
      text: newText,
      versionNumber: this.getDocumentVersion(),
    };

    // A change has been made, reset the changelist navigation index to the end
    this.changelistIndex = this.undoStack.getStackDepth() - 1;
  }

  /**
   * Both undoes and completely removes the last n changes applied.
   */
  public async undoAndRemoveChanges(n: number): Promise<void> {
    if (this.currentContentChanges.length < n) {
      HistoryTracker.logger.warn('Something bad happened in removeChange');
      return;
    } else if (n === 0) {
      return;
    }

    // Remove the last N elements from the currentContentChanges array.
    const removedChanges = this.currentContentChanges.splice(
      this.currentContentChanges.length - n,
      this.currentContentChanges.length
    );

    // Remove the characters from the editor in reverse order otherwise the characters
    // position would change.
    await vscode.window.activeTextEditor?.edit((edit) => {
      for (const removedChange of removedChanges.reverse()) {
        edit.delete(
          new vscode.Range(
            removedChange.range.start,
            removedChange.range.end.translate({ characterDelta: 1 })
          )
        );
      }
    });

    // Remove the previous deletions from currentContentChanges otherwise the DotCommand
    // or a recorded macro will be deleting a character that wasn't typed.
    this.currentContentChanges.splice(
      this.currentContentChanges.length - removedChanges.length,
      removedChanges.length
    );

    // We can't ignore the change, because that would mean that addChange() doesn't run.
    // In the event of "jj" -> <Esc> remap, that would mean that the second part of the modification
    // does not get added to currentHistoryStep.changes (only the first character).
    // This messes with the undo stack, i.e. if we were to call Undo, only that first character would be erased.

    // this.ignoreChange();
  }

  /**
   * Tells the HistoryTracker that although the document has changed, we should simply
   * ignore that change. Most often used when the change was itself triggered by
   * the HistoryTracker.
   */
  public ignoreChange(): void {
    this.previousDocumentState = {
      text: this.getDocumentText(),
      versionNumber: this.getDocumentVersion(),
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

      currentHistoryStep.merge();

      currentHistoryStep.marks = this.updateAndReturnMarks();
    }
  }

  /**
   * Undo the current HistoryStep, if there is one
   *
   * @returns the new cursor positions, or undefined if there are no steps to undo
   */
  public async goBackHistoryStep(): Promise<Position[] | undefined> {
    const step = this.undoStack.stepBackward();
    if (step === undefined) {
      return undefined;
    }

    for (const change of step.changes.slice(0).reverse()) {
      await change.undo(this.vimState.editor);
    }

    // TODO: if there are more/fewer lines after undoing the change, it should say so
    const changes = step.changes.length === 1 ? `1 change` : `${step.changes.length} changes`;
    StatusBar.setText(
      this.vimState,
      `${changes}; before #${this.undoStack.getCurrentHistoryStepIndex() + 1}  ${step.howLongAgo()}`
    );

    return step.cursorStart;
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
  public async goBackHistoryStepsOnLine(): Promise<Position[] | undefined> {
    const currentHistoryStep = this.undoStack.getCurrentHistoryStep();
    if (currentHistoryStep === undefined) {
      return undefined;
    }

    let done: boolean = false;
    let stepsToUndo: number = 0;
    const changesToUndo: DocumentChange[] = [];

    const changes = currentHistoryStep.changes;

    let lastChange = changes[0];
    let currentLine = changes[changes.length - 1].start.line;

    // Adjusting for the case where the most recent change is newline followed by text
    const mostRecentText = changes[0].text;
    if (mostRecentText.includes('\n') && mostRecentText !== '\n' && mostRecentText !== '\r\n') {
      currentLine++;
    }

    for (let stepIdx = this.undoStack.getCurrentHistoryStepIndex(); stepIdx >= 0; stepIdx--) {
      const step = this.undoStack.getHistoryStepAtIndex(stepIdx);
      for (let change of step!.changes.reverse()) {
        /*
         * This conditional accounts for the behavior where the change is a newline
         * followed by text to undo. Note the line offset behavior that must be compensated.
         */
        if (change.text.includes('\n') && change.start.line + 1 === currentLine) {
          done = true;
          // Modify & replace the change to avoid undoing the newline embedded in the change
          change = new DocumentChange(
            new Position(change.start.line + 1, 0),
            change.text.replace('\n', '').replace('\r', ''),
            change.isAdd
          );
          stepsToUndo++;
        }

        if (change.text.includes('\n') || change.start.line !== currentLine) {
          done = true;
          break;
        }

        changesToUndo.push(change);
        lastChange = change;
        if (done) {
          break;
        }
      }
      if (done) {
        break;
      }
      stepsToUndo++;
    }

    // Note that reverse() is call-by-reference, so the changes are already in reverse order
    for (const change of changesToUndo) {
      await change.undo(this.vimState.editor);
      change.isAdd = !change.isAdd;
    }

    for (let count = stepsToUndo; count > 0; count--) {
      this.undoStack.stepBackward();
    }

    const newStep = new HistoryStep({
      isFinished: true,
      cursorStart: [lastChange.start],
      cursorEnd: [lastChange.start],
    });
    newStep.changes = changesToUndo;

    this.undoStack.pushHistoryStep(newStep);

    /*
     * Unlike the goBackHistoryStep() function, this function does not trust the
     * HistoryStep.cursorStart property. This can lead to invalid cursor position errors.
     * Since this function reverses change-by-change, rather than step-by-step,
     * the cursor position is based on the start of the last change that is undone.
     */
    return lastChange && [lastChange.start];
  }

  /**
   * Redo the next HistoryStep, if there is one
   *
   * @returns the new cursor positions, or undefined if there are no steps to redo
   */
  public async goForwardHistoryStep(): Promise<Position[] | undefined> {
    const step = this.undoStack.stepForward();
    if (step === undefined) {
      return undefined;
    }

    // TODO: do these transformations in a batch
    for (const change of step.changes) {
      await change.do(this.vimState.editor);
    }

    const changes = step.changes.length === 1 ? `1 change` : `${step.changes.length} changes`;
    StatusBar.setText(
      this.vimState,
      `${changes}; after #${this.undoStack.getCurrentHistoryStepIndex()}  ${step.howLongAgo()}`
    );

    return step.cursorStart;
  }

  /**
   * Gets the ending cursor position of the last Change of the last Step.
   *
   * In practice, this sets the cursor position to the end of
   * the most recent text change.
   */
  public getLastChangeEndPosition(): Position | undefined {
    const currentHistoryStep = this.undoStack.getCurrentHistoryStep();
    if (currentHistoryStep === undefined) {
      return undefined;
    }

    const lastChangeIndex = currentHistoryStep.changes.length;
    if (lastChangeIndex === 0) {
      return undefined;
    }

    const lastChange = currentHistoryStep.changes[lastChangeIndex - 1];
    if (lastChange.isAdd) {
      return lastChange.end;
    }

    return lastChange.start;
  }

  public getLastHistoryStartPosition(): Position[] | undefined {
    const currentHistoryStep = this.undoStack.getCurrentHistoryStep();
    if (currentHistoryStep === undefined) {
      return undefined;
    }

    return currentHistoryStep.cursorStart;
  }

  public getLastChangeStartPosition(): Position | undefined {
    const currentHistoryStep = this.undoStack.getCurrentHistoryStep();
    if (currentHistoryStep === undefined) {
      return undefined;
    }

    const changes = currentHistoryStep.changes;
    if (changes.length === 0) {
      return undefined;
    }

    return changes[changes.length - 1].start;
  }

  public setLastHistoryEndPosition(pos: Position[]) {
    const currentHistoryStep = this.undoStack.getCurrentHistoryStep();
    if (currentHistoryStep) {
      currentHistoryStep.cursorEnd = pos;
    }
  }

  public getChangePositionAtIndex(index: number): Position[] | undefined {
    const step = this.undoStack.getHistoryStepAtIndex(index);

    if (step && step.changes.length > 0) {
      const change = step.changes[0];
      return [change.isAdd ? change.end : change.start];
    }

    return undefined;
  }

  /**
   * Handy for debugging the undo/redo stack. + means our current position, check means active.
   */
  public toString(): string {
    let result = '';

    for (let i = 0; i < this.undoStack.getStackDepth(); i++) {
      const step = this.undoStack.getHistoryStepAtIndex(i)!;

      result += step.changes.map((x) => x.text.replace(/\n/g, '\\n')).join('');
      if (i === this.undoStack.getCurrentHistoryStepIndex()) {
        result += '+';
      }
      if (step.isFinished) {
        result += '✓';
      }
      result += '| ';
    }

    return result;
  }
}
