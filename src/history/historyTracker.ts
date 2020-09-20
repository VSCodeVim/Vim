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

import { Position } from './../common/motion/position';
import { RecordedState } from './../state/recordedState';
import { Logger } from './../util/logger';
import { VimState } from './../state/vimState';
import { TextEditor } from './../textEditor';
import { StatusBar } from '../statusBar';
import { Mode } from '../mode/mode';

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

  private _end: Position;
  private _text: string;

  constructor(start: Position, text: string, isAdd: boolean) {
    this.start = start;
    this.text = text;
    this.isAdd = isAdd;
  }

  /**
   * Run this change.
   */
  public async do(undo = false): Promise<void> {
    if ((this.isAdd && !undo) || (!this.isAdd && undo)) {
      await TextEditor.insert(this.text, this.start, false);
    } else {
      await TextEditor.delete(new vscode.Range(this.start, this.end));
    }
  }

  /**
   * Run this change in reverse.
   */
  public async undo(): Promise<void> {
    return this.do(true);
  }

  /**
   * The position after advancing start by text
   */
  public get end(): Position {
    return this._end;
  }

  public get text(): string {
    return this._text;
  }

  public set text(text: string) {
    this._text = text;
    this._end = this.start.advancePositionByText(this.text);
  }
}

export interface IMark {
  name: string;
  position: Position;
  isUppercaseMark: boolean;
  editor?: vscode.TextEditor; // only required when using global marks (isUppercaseMark is true)
}

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
   * merge collapses individual character changes into larger blocks of changes
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

export class HistoryTracker {
  private static readonly logger = Logger.get('DocumentChange');
  public lastContentChanges: vscode.TextDocumentContentChangeEvent[];
  public currentContentChanges: vscode.TextDocumentContentChangeEvent[];

  // Current index in changelist for navigation, resets when a new change is made
  public changelistIndex = 0;

  public lastInvokedMacro: RecordedState;

  /**
   * The entire Undo/Redo stack.
   */
  private historySteps: HistoryStep[] = [];

  /**
   * Our index in the Undo/Redo stack.
   */
  private currentHistoryStepIndex = 0;

  /**
   * The state of the document the last time HistoryTracker.addChange() or HistoryTracker.ignoreChange() was called.
   * This is used to avoid retrieiving the document text and doing a full diff when it isn't necessary.
   */
  private previousDocumentState: {
    text: string;
    versionNumber: number;
  };

  private readonly vimState: VimState;

  private currentMode: Mode;

  private get currentHistoryStep(): HistoryStep {
    if (this.currentHistoryStepIndex === -1) {
      const msg = 'Tried to modify history at index -1';
      HistoryTracker.logger.warn(msg);
      throw new Error('HistoryTracker:' + msg);
    }

    return this.historySteps[this.currentHistoryStepIndex];
  }

  constructor(vimState: VimState) {
    this.vimState = vimState;
    this._initialize();
  }

  public clear() {
    this.historySteps = [];
    this.currentHistoryStepIndex = 0;
    this._initialize();
  }

  /**
   * We add an initial, unrevertable step, which inserts the entire document.
   */
  private _initialize() {
    this.historySteps.push(
      new HistoryStep({
        changes: [new DocumentChange(new Position(0, 0), this._getDocumentText(), true)],
        isFinished: true,
        cursorStart: [new Position(0, 0)],
        cursorEnd: [new Position(0, 0)],
      })
    );

    this.finishCurrentStep();

    this.previousDocumentState = {
      text: this._getDocumentText(),
      versionNumber: this._getDocumentVersion(),
    };
    this.currentContentChanges = [];
    this.lastContentChanges = [];
  }

  private _getDocumentText(): string {
    // vimState.editor can be undefined in some unit tests
    return this.vimState.editor?.document.getText() ?? '';
  }

  private _getDocumentVersion(): number {
    // vimState.editor can be undefined in some unit tests
    return this.vimState.editor?.document.version ?? -1;
  }

  private _addNewHistoryStep(): void {
    this.historySteps.push(
      new HistoryStep({
        marks: this.currentHistoryStep.marks,
      })
    );

    this.currentHistoryStepIndex++;
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
    let newMarks: IMark[] = [];

    // clone old marks into new marks
    for (const mark of previousMarks) {
      newMarks.push({ ...mark });
    }

    for (const change of this.currentHistoryStep.changes) {
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
                  newMark.position.line - 1,
                  newMark.position.character
                );
              } else if (pos.line === newMark.position.line) {
                newMark.position = new Position(
                  newMark.position.line,
                  newMark.position.character - 1
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

    for (const mark of newMarks) {
      if (mark.position.isAfter(TextEditor.getDocumentEnd())) {
        mark.position = TextEditor.getDocumentEnd();
      }
    }

    return newMarks;
  }

  /**
   * Updates all marks affecting the active text editor.
   * Since all currentHistoryStep's marks are affected, just update the
   * array.  Global marks might not be from the active editor, so the
   * global mark collection is mutated with the new element in place.
   */
  private updateMarks(): void {
    const newMarks = this.updateAndReturnMarks();
    this.currentHistoryStep.marks = newMarks.filter((mark) => !mark.isUppercaseMark);

    newMarks.filter((mark) => mark.isUppercaseMark).forEach(this.putMarkInList.bind);
  }

  /**
   * Returns the shared static list if isFileMark is true,
   * otherwise returns the currentHistoryStep.marks.
   */
  private getMarkList(isFileMark: boolean): IMark[] {
    return isFileMark ? HistoryStep.globalMarks : this.currentHistoryStep.marks;
  }

  /**
   * Gets all local and global marks targeting the current editor.
   */
  private getAllCurrentDocumentMarks(): IMark[] {
    const globalMarks = HistoryStep.globalMarks.filter(
      (mark) => mark.editor === vscode.window.activeTextEditor
    );
    return [...this.currentHistoryStep.marks, ...globalMarks];
  }

  /**
   * Adds a mark.
   */
  public addMark(position: Position, markName: string): void {
    const isUppercaseMark = markName.toUpperCase() === markName;
    const newMark: IMark = {
      position,
      name: markName,
      isUppercaseMark: isUppercaseMark,
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
   * Gets all local marks.  I.e., marks that are specific for the current
   * editor.
   */
  public getLocalMarks(): IMark[] {
    return [...this.currentHistoryStep.marks];
  }

  /**
   * Gets all global marks.  I.e., marks that are shared among all editors.
   */
  public getGlobalMarks(): IMark[] {
    return [...HistoryStep.globalMarks];
  }

  public getMarks(): IMark[] {
    return [...this.currentHistoryStep.marks, ...HistoryStep.globalMarks];
  }

  /**
   * Returns true if we need to get the entire document's text
   * to process an individual change
   */
  private _isDocumentTextNeeded(): boolean {
    if (this._getDocumentVersion() === this.previousDocumentState.versionNumber) {
      return false;
    }

    // Determine if we just switched modes.
    // This prevents recording steps in between start-end of a historyStep.
    const isModeDiff = this.currentMode !== this.vimState.currentMode;

    const isNewHistoryStep =
      (this.currentHistoryStepIndex === this.historySteps.length - 1 &&
        this.currentHistoryStep.isFinished) ||
      this.currentHistoryStepIndex !== this.historySteps.length - 1;

    if (isModeDiff) {
      this.currentMode = this.vimState.currentMode;
    }

    // If these are false we can avoid requesting the entire doc.
    return isNewHistoryStep || isModeDiff;
  }

  /**
   * Adds an individual Change to the current Step.
   *
   * Determines what changed by diffing the document against what it used to look like.
   */
  public addChange(cursorPosition = [new Position(0, 0)]): void {
    if (!this._isDocumentTextNeeded()) {
      return;
    }

    const newText = this._getDocumentText();
    if (newText === this.previousDocumentState.text) {
      return;
    }

    // Determine if we should add a new Step.

    if (
      this.currentHistoryStepIndex === this.historySteps.length - 1 &&
      this.currentHistoryStep.isFinished
    ) {
      this._addNewHistoryStep();
    } else if (this.currentHistoryStepIndex !== this.historySteps.length - 1) {
      this.historySteps = this.historySteps.slice(0, this.currentHistoryStepIndex + 1);

      this._addNewHistoryStep();
    }

    // TODO: This is actually pretty stupid! Since we already have the cursorPosition,
    // and most diffs are just +/- a few characters, we can just do a direct comparison rather
    // than using jsdiff.

    // The difficulty is with a few rare commands like :%s/one/two/g that make
    // multiple changes in different places simultaneously. For those, we could require
    // them to call addChange manually, I guess...

    const diffs = diffEngine.diff_main(this.previousDocumentState.text, newText);
    diffEngine.diff_cleanupEfficiency(diffs);

    /*
    this.historySteps.push(new HistoryStep({
      changes  : [new DocumentChange(new Position(0, 0), TextEditor._getDocumentText(), true)],
      isFinished : true,
      cursorStart: new Position(0, 0)
    }));
    */

    let currentPosition = new Position(0, 0);

    for (const diff of diffs) {
      const [whatHappened, text] = diff;
      const added = whatHappened === DiffMatchPatch.DIFF_INSERT;
      const removed = whatHappened === DiffMatchPatch.DIFF_DELETE;

      let change: DocumentChange;
      // let lastChange = this.currentHistoryStep.changes.length > 1 &&
      //   this.currentHistoryStep.changes[this.currentHistoryStep.changes.length - 2];

      if (added || removed) {
        change = new DocumentChange(currentPosition, text, !!added);

        this.currentHistoryStep.changes.push(change);

        if (change && this.currentHistoryStep.cursorStart === undefined) {
          this.currentHistoryStep.cursorStart = cursorPosition;
        }
      }

      if (!removed) {
        currentPosition = currentPosition.advancePositionByText(text);
      }
    }

    this.currentHistoryStep.cursorEnd = cursorPosition;
    this.previousDocumentState = {
      text: newText,
      versionNumber: this._getDocumentVersion(),
    };

    // A change has been made, reset the changelist navigation index to the end
    this.changelistIndex = this.historySteps.length - 1;
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
      text: this._getDocumentText(),
      versionNumber: this._getDocumentVersion(),
    };
  }

  /**
   * Until we mark it as finished, the active Step will
   * accrue multiple changes. This function will mark it as finished,
   * and the next time we add a change, it'll be added to a new Step.
   */
  public finishCurrentStep(): void {
    if (this.currentHistoryStep.changes.length === 0 || this.currentHistoryStep.isFinished) {
      return;
    }

    this.currentHistoryStep.isFinished = true;
    this.currentHistoryStep.timestamp = new Date();

    this.currentHistoryStep.merge();

    this.currentHistoryStep.marks = this.updateAndReturnMarks();
  }

  /**
   * Essentially Undo or ctrl+z. Returns undefined if there's no more steps
   * back to go.
   */
  public async goBackHistoryStep(): Promise<Position[] | undefined> {
    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    if (this.currentHistoryStep.changes.length === 0) {
      this.currentHistoryStepIndex--;

      if (this.currentHistoryStepIndex === 0) {
        return undefined;
      }
    }

    const step = this.currentHistoryStep;

    for (const change of step.changes.slice(0).reverse()) {
      await change.undo();
    }

    // TODO: if there are more/fewer lines after undoing the change, it should say so
    const changes = step.changes.length === 1 ? `1 change` : `${step.changes.length} changes`;
    StatusBar.setText(
      this.vimState,
      `${changes}; before #${this.currentHistoryStepIndex}  ${step.howLongAgo()}`
    );

    this.currentHistoryStepIndex--;

    return step && step.cursorStart;
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
    let done: boolean = false;
    let stepsToUndo: number = 0;
    let changesToUndo: DocumentChange[] = [];

    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    if (this.currentHistoryStep.changes.length === 0) {
      this.currentHistoryStepIndex--;

      if (this.currentHistoryStepIndex === 0) {
        return undefined;
      }
    }

    let lastChange = this.currentHistoryStep.changes[0];
    let currentLine = this.currentHistoryStep.changes[this.currentHistoryStep.changes.length - 1]
      .start.line;

    // Adjusting for the case where the most recent change is newline followed by text
    const mostRecentText = this.currentHistoryStep.changes[0].text;
    if (mostRecentText.includes('\n') && mostRecentText !== '\n' && mostRecentText !== '\r\n') {
      currentLine++;
    }

    for (const step of this.historySteps.slice(1, this.currentHistoryStepIndex + 1).reverse()) {
      for (let change of step.changes.reverse()) {
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
      await change.undo();
      change.isAdd = !change.isAdd;
    }

    for (let count = stepsToUndo; count > 0; count--) {
      this.historySteps.pop();
    }

    const newStep = new HistoryStep({
      isFinished: true,
      cursorStart: [lastChange.start],
      cursorEnd: [lastChange.start],
    });
    newStep.changes = changesToUndo;

    this.historySteps.push(newStep);

    this.currentHistoryStepIndex = this.currentHistoryStepIndex - stepsToUndo + 1;

    /*
     * Unlike the goBackHistoryStep() function, this function does not trust the
     * HistoryStep.cursorStart property. This can lead to invalid cursor position errors.
     * Since this function reverses change-by-change, rather than step-by-step,
     * the cursor position is based on the start of the last change that is undone.
     */
    return lastChange && [lastChange.start];
  }

  /**
   * Essentially Redo or ctrl+y. Returns undefined if there's no more steps
   * forward to go.
   */
  public async goForwardHistoryStep(): Promise<Position[] | undefined> {
    if (this.currentHistoryStepIndex === this.historySteps.length - 1) {
      return undefined;
    }

    this.currentHistoryStepIndex++;

    const step = this.currentHistoryStep;

    // TODO: do these transformations in a bacth
    for (const change of step.changes) {
      await change.do();
    }

    const changes = step.changes.length === 1 ? `1 change` : `${step.changes.length} changes`;
    StatusBar.setText(
      this.vimState,
      `${changes}; after #${this.currentHistoryStepIndex}  ${step.howLongAgo()}`
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
    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    const lastChangeIndex = this.currentHistoryStep.changes.length;
    if (lastChangeIndex === 0) {
      return undefined;
    }

    const lastChange = this.currentHistoryStep.changes[lastChangeIndex - 1];
    if (lastChange.isAdd) {
      return lastChange.end;
    }

    return lastChange.start;
  }

  public getLastHistoryStartPosition(): Position[] | undefined {
    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    return this.currentHistoryStep.cursorStart;
  }

  public getLastChangeStartPosition(): Position | undefined {
    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    const lastChangeIndex = this.currentHistoryStep.changes.length;
    if (lastChangeIndex === 0) {
      return undefined;
    }

    return this.currentHistoryStep.changes[lastChangeIndex - 1].start;
  }

  public setLastHistoryEndPosition(pos: Position[]) {
    this.currentHistoryStep.cursorEnd = pos;
  }

  public getChangePositionAtIndex(index: number): Position[] | undefined {
    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    if (this.historySteps[index] !== undefined) {
      if (this.historySteps[index].changes.length > 0) {
        if (this.historySteps[index].changes[0].isAdd) {
          return [this.historySteps[index].changes[0].end];
        } else {
          return [this.historySteps[index].changes[0].start];
        }
      }
    }

    return undefined;
  }

  /**
   * Handy for debugging the undo/redo stack. + means our current position, check
   * means active.
   */
  public toString(): string {
    let result = '';

    for (let i = 0; i < this.historySteps.length; i++) {
      const step = this.historySteps[i];

      result += step.changes.map((x) => x.text.replace(/\n/g, '\\n')).join('');
      if (this.currentHistoryStepIndex === i) {
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
