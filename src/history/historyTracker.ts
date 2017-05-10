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

import * as vscode from "vscode";
import * as _ from "lodash";

import { Position } from './../common/motion/position';
import { TextEditor } from './../textEditor';
import { Configuration } from './../configuration/configuration';
import { RecordedState, VimState } from './../mode/modeHandler';

import DiffMatchPatch = require("diff-match-patch");

const diffEngine = new DiffMatchPatch.diff_match_patch();
diffEngine.Diff_Timeout = 1; // 1 second

export class DocumentChange {
  start : Position;
  text  : string;
  isAdd : boolean;

  constructor(start: Position, text: string, isAdd: boolean) {
    this.start = start;
    this.text  = text;
    this.isAdd = isAdd;
  }

  /**
   * Run this change.
   */
  public async do(undo = false): Promise<void> {
    if ((this.isAdd && !undo) || (!this.isAdd && undo)) {
      await TextEditor.insert(this.text, this.start, false);
    } else {
      await TextEditor.delete(new vscode.Range(this.start, this.end()));
    }
  }

  /**
   * Run this change in reverse.
   */
  public async undo(): Promise<void> {
    return this.do(true);
  }

  /**
   * the position after advancing start by text
   */
  public end(): Position {
    return this.start.advancePositionByText(this.text);
  }
}

interface IMark {
  name: string;
  position: Position;
  isUppercaseMark: boolean;
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

  vimState: VimState;

  constructor(init: {
    changes?: DocumentChange[],
    isFinished?: boolean,
    cursorStart?: Position[] | undefined,
    cursorEnd?: Position[] | undefined,
    marks?: IMark[],
  }) {
    this.changes   = init.changes = [];
    this.isFinished  = init.isFinished || false;
    this.cursorStart = init.cursorStart || undefined;
    this.cursorEnd = init.cursorEnd || undefined;
    this.marks     = init.marks || [];
  }

  /**
   * merge collapses individual character changes into larger blocks of changes
   */
  public merge(): void {
    if (this.changes.length < 2) {
      return;
    }

    // merged will replace this.changes
    var merged: DocumentChange[] = [];
    // manually reduce() this.changes with variables `current` and `next`
    // we can't use reduce() directly because the loop can emit multiple elements
    var current = this.changes[0];
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
      // merge logic. also compares start & end() Positions to ensure this is the same location
      if (current.isAdd && next.isAdd && current.end().isEqual(next.start)) {
        // merge add+add together
        current.text += next.text;
      } else if (!current.isAdd && !next.isAdd && next.end().isEqual(current.start)) {
        // merge del+del together, but in reverse so it still reads forward
        next.text += current.text;
        current = next;
      } else if (current.isAdd && !next.isAdd && current.end().isEqual(next.end())) {
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
}

export class HistoryTracker {
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
   * The text of the document the last time we diffed against it.
   */
  private oldText: string;

  private vimState: VimState;

  private get currentHistoryStep(): HistoryStep {
    if (this.currentHistoryStepIndex === -1) {
      console.log("Tried to modify history at index -1");

      throw new Error();
    }

    return this.historySteps[this.currentHistoryStepIndex];
  }

  constructor(vimState: VimState) {
    this.vimState = vimState;

    this._initialize();
  }

  public getAllText(): string {
    return this.vimState.editor.document.getText();
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
    this.historySteps.push(new HistoryStep({
      changes  : [new DocumentChange(new Position(0, 0), this.getAllText(), true)],
      isFinished : true,
      cursorStart: [ new Position(0, 0) ],
      cursorEnd: [ new Position(0, 0) ]
    }));

    this.finishCurrentStep();

    this.oldText = this.getAllText();
    this.currentContentChanges = [];
    this.lastContentChanges = [];
  }

  private _addNewHistoryStep(): void {
    this.historySteps.push(new HistoryStep({
      marks: this.currentHistoryStep.marks
    }));

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
    const previousMarks = this.currentHistoryStep.marks;
    let newMarks: IMark[] = [];

    // clone old marks into new marks
    for (const mark of previousMarks) {
      newMarks.push({
        name            : mark.name,
        position        : mark.position,
        isUppercaseMark : mark.isUppercaseMark
      });
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

            if (pos.compareTo(newMark.position) <= 0) {
              if (ch === "\n") {
                newMark.position = new Position(newMark.position.line + 1, newMark.position.character);
              } else if (ch !== "\n" && pos.line === newMark.position.line) {
                newMark.position = new Position(newMark.position.line, newMark.position.character + 1);
              }
            }

            // Advance position

            if (ch === "\n") {
              pos = new Position(pos.line + 1, 0);
            } else {
              pos = new Position(pos.line, pos.character + 1);
            }
          }
        } else {
          for (const ch of change.text) {

            // Update mark

            if (pos.compareTo(newMark.position) < 0) {
              if (ch === "\n") {
                newMark.position = new Position(newMark.position.line - 1, newMark.position.character);
              } else if (pos.line === newMark.position.line) {
                newMark.position = new Position(newMark.position.line, newMark.position.character - 1);
              }
            }

            // De-advance position
            // (What's the opposite of advance? Retreat position?)

            if (ch === "\n") {
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
      if (mark.position.compareTo(mark.position.getDocumentEnd()) > 0) {
        mark.position = mark.position.getDocumentEnd();
      }
    }

    return newMarks;
  }

  /**
   * Adds a mark.
   */
  addMark(position: Position, markName: string): void {
    const newMark: IMark = {
      position,
      name: markName,
      isUppercaseMark: markName === markName.toUpperCase()
    };
    const previousIndex = _.findIndex(this.currentHistoryStep.marks, mark => mark.name === markName);

    if (previousIndex !== -1) {
      this.currentHistoryStep.marks[previousIndex] = newMark;
    } else {
      this.currentHistoryStep.marks.push(newMark);
    }
  }

  /**
   * Retrieves a mark.
   */
  getMark(markName: string): IMark {
    return _.find(this.currentHistoryStep.marks, mark => mark.name === markName);
  }

  getMarks(): IMark[] {
    return this.currentHistoryStep.marks;
  }

  /**
   * Adds an individual Change to the current Step.
   *
   * Determines what changed by diffing the document against what it
   * used to look like.
   */
  addChange(cursorPosition = [ new Position(0, 0) ]): void {
    const newText = this.getAllText();

    if (newText === this.oldText) { return; }

    // Determine if we should add a new Step.

    if (this.currentHistoryStepIndex === this.historySteps.length - 1 &&
      this.currentHistoryStep.isFinished) {

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

    const diffs = diffEngine.diff_main(this.oldText, newText);

    /*
    this.historySteps.push(new HistoryStep({
      changes  : [new DocumentChange(new Position(0, 0), TextEditor.getAllText(), true)],
      isFinished : true,
      cursorStart: new Position(0, 0)
    }));
    */

    let currentPosition = new Position(0, 0);

    for (const diff of diffs) {
      const [whatHappened, text] = diff;
      const added   = whatHappened === DiffMatchPatch.DIFF_INSERT;
      const removed = whatHappened === DiffMatchPatch.DIFF_DELETE;

      let change: DocumentChange;
      // let lastChange = this.currentHistoryStep.changes.length > 1 &&
      //   this.currentHistoryStep.changes[this.currentHistoryStep.changes.length - 2];

      if (added || removed) {
        change = new DocumentChange(currentPosition, text, !!added);

        this.currentHistoryStep.changes.push(change);

        // Make sure history length does not exceed configuration option
        if (this.currentHistoryStep.changes.length > Configuration.history) {
          this.currentHistoryStep.changes.splice(0, 1);
        }

        if (change && this.currentHistoryStep.cursorStart === undefined) {
          this.currentHistoryStep.cursorStart = cursorPosition;
        }
      }

      if (!removed) {
        currentPosition = currentPosition.advancePositionByText(text);
      }
    }

    this.currentHistoryStep.cursorEnd = cursorPosition;
    this.oldText = newText;

    // A change has been made, reset the changelist navigation index to the end
    this.changelistIndex = this.historySteps.length - 1;
  }

  /**
   * Both undoes and completely removes the last n changes applied.
   */
  async undoAndRemoveChanges(n: number): Promise<void> {
    if (this.currentHistoryStep.changes.length < n) {
      console.log("Something bad happened in removeChange");

      return;
    }

    for (let i = 0; i < n; i++) {
      await this.currentHistoryStep.changes.pop()!.undo();
    }

    this.ignoreChange();
  }

  /**
   * Tells the HistoryTracker that although the document has changed, we should simply
   * ignore that change. Most often used when the change was itself triggered by
   * the HistoryTracker.
   */
  ignoreChange(): void {
    this.oldText = this.getAllText();
  }

  /**
   * Until we mark it as finished, the active Step will
   * accrue multiple changes. This function will mark it as finished,
   * and the next time we add a change, it'll be added to a new Step.
   */
  finishCurrentStep(): void {
    if (this.currentHistoryStep.changes.length === 0 ||
        this.currentHistoryStep.isFinished) {
      return;
    }

    this.currentHistoryStep.isFinished = true;

    this.currentHistoryStep.merge();

    this.currentHistoryStep.marks = this.updateAndReturnMarks();
  }

  /**
   * Essentially Undo or ctrl+z. Returns undefined if there's no more steps
   * back to go.
   */
  async goBackHistoryStep(): Promise<Position[] | undefined> {
    let step: HistoryStep;

    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    if (this.currentHistoryStep.changes.length === 0) {
      this.currentHistoryStepIndex--;
    }

    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    step = this.currentHistoryStep;

    for (const change of step.changes.slice(0).reverse()) {
      await change!.undo();
    }

    this.currentHistoryStepIndex--;

    return step && step.cursorStart;
  }

  /**
   * Essentially Redo or ctrl+y. Returns undefined if there's no more steps
   * forward to go.
   */
  async goForwardHistoryStep(): Promise<Position[] | undefined> {
    let step: HistoryStep;

    if (this.currentHistoryStepIndex === this.historySteps.length - 1) {
      return undefined;
    }

    this.currentHistoryStepIndex++;

    step = this.currentHistoryStep;

    for (const change of step.changes) {
      await change.do();
    }

    return step.cursorStart;
  }

  getLastHistoryEndPosition(): Position[] | undefined {
    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    return this.historySteps[this.currentHistoryStepIndex].cursorEnd;
  }

  setLastHistoryEndPosition(pos: Position[]) {
    this.historySteps[this.currentHistoryStepIndex].cursorEnd = pos;
  }

  getChangePositionAtindex(index: number): Position[] | undefined {
    if (this.currentHistoryStepIndex === 0) {
      return undefined;
    }

    let pos = this.getLastHistoryEndPosition();
    pos = undefined;

    if (this.historySteps[index] !== undefined) {
      if (this.historySteps[index].changes.length > 0) {
        if (this.historySteps[index].changes[0].isAdd) {
          pos = [this.historySteps[index].changes[0].end()];
        } else {
          pos = [this.historySteps[index].changes[0].start];
        }
      }
    }

    return pos;
  }

  /**
   * Handy for debugging the undo/redo stack. + means our current position, check
   * means active.
   */
  toString(): string {
    let result = "";

    for (let i = 0; i < this.historySteps.length; i++) {
      const step = this.historySteps[i];

      result += step.changes.map(x => x.text.replace(/\n/g, "\\n")).join("");
      if (this.currentHistoryStepIndex === i) { result += "+"; }
      if (step.isFinished) { result += "✓"; }
      result += "| ";
    }

    return result;
  }
}