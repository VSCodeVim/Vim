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

import { Position } from './../motion/position';
import { TextEditor } from './../textEditor';
import { VimState } from './../mode/modeHandler';

import jsdiff = require('diff');

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
        const rangeStart = this.start;

        if ((this.isAdd && !undo) || (!this.isAdd && undo)) {
            await TextEditor.insert(this.text, rangeStart, false);
        } else {
            const rangeStop = rangeStart.advancePositionByText(this.text);

            await TextEditor.delete(new vscode.Range(
                rangeStart,
                rangeStop
            ));
        }
    }

    public async undo(): Promise<void> {
        return this.do(true);
    }
}

class HistoryStep {
    changes     : DocumentChange[] = [];
    isFinished  : boolean          = false;
    cursorStart : Position         = undefined;

    constructor(position: Position = undefined) {
        if (position !== undefined) {
            this.cursorStart = position;
        }
    }
}

class HistoryTrackerSingleFile {
    private historySteps: HistoryStep[] = [new HistoryStep()];

    private currentHistoryStepIndex = 0;

    private oldText: string;

    private get currentHistoryStep(): HistoryStep {
        if (this.currentHistoryStepIndex === -1) {
            console.log("Tried to modify history at index -1");

            throw new Error();
        }

        return this.historySteps[this.currentHistoryStepIndex];
    }

    constructor() {
        this.finishCurrentStep();

        this.oldText = TextEditor.getAllText();
    }

    /**
     * Adds an individual Change to the current Step.
     *
     * Determines what changed by diffing the document against what it
     * used to look like.
     */
    addChange(vimState: VimState): void {
        const newText = TextEditor.getAllText();

        if (newText === this.oldText) { return; }

        // Determine if we should add a new Step.

        if (this.currentHistoryStepIndex === -1 || (
                this.currentHistoryStepIndex === this.historySteps.length - 1 &&
                this.currentHistoryStep.isFinished)) {

            this.historySteps.push(new HistoryStep());
            this.currentHistoryStepIndex++;
        } else if (this.currentHistoryStepIndex !== this.historySteps.length - 1) {
            this.historySteps = this.historySteps.slice(0, this.currentHistoryStepIndex + 1);

            this.historySteps.push(new HistoryStep());
            this.currentHistoryStepIndex++;
        }

        // TODO: This is actually pretty stupid! Since we already have the cursorPosition,
        // and most diffs are just +/- a few characters, we can just do a direct comparison rather
        // than using jsdiff.

        // The difficulty is with a few rare commands like :%s/one/two/g that make
        // multiple changes in different places simultaneously. For those, we could require
        // them to call addChange manually, I guess...

        const diffs = jsdiff.diffChars(this.oldText, newText);

        let currentPosition = new Position(0, 0);

        for (const diff of diffs) {
            if (diff.added) {
                this.currentHistoryStep.changes.push(
                    new DocumentChange(currentPosition, diff.value, true)
                );
                if (this.currentHistoryStep.cursorStart === undefined) {
                    this.currentHistoryStep.cursorStart = vimState.cursorPositionJustBeforeAnythingHappened;
                }
            } else if (diff.removed) {
                this.currentHistoryStep.changes.push(
                    new DocumentChange(currentPosition, diff.value, false)
                );
                if (this.currentHistoryStep.cursorStart === undefined) {
                    this.currentHistoryStep.cursorStart = vimState.cursorPositionJustBeforeAnythingHappened;
                }
            }

            if (!diff.removed) {
                currentPosition = currentPosition.advancePositionByText(diff.value);
            }
        }

        this.oldText = newText;
    }

    /**
     * Tells the HistoryTracker that although the document has changed, we should simply
     * ignore that change. Most often used when the change was itself triggered by
     * the HistoryTracker.
     */
    ignoreChange(): void {
        this.oldText = TextEditor.getAllText();
    }

    /**
     * Until we mark it as finished, the active Step will
     * accrue multiple changes. This function will mark it as finished,
     * and the next time we add a change, it'll be added to a new Step.
     */
    finishCurrentStep(): void {
        if (this.currentHistoryStep.changes.length === 0) {
            return;
        }

        this.currentHistoryStep.isFinished = true;
    }

    /**
     * Returns undefined on failure.
     */
    async goBackHistoryStep(): Promise<Position> {
        if (this.currentHistoryStepIndex === -1) {
            return undefined;
        }

        if (this.currentHistoryStep.changes.length === 0) {
            this.currentHistoryStepIndex--;
        }

        if (this.currentHistoryStepIndex === -1) {
            return undefined;
        }

        let step = this.currentHistoryStep;

        for (const change of step.changes.slice(0).reverse()) {
            await change.undo();
        }

        this.currentHistoryStepIndex--;

        return step.cursorStart;
    }

    /**
     * Returns undefined on failure.
     */
    async goForwardHistoryStep(): Promise<Position> {
        if (this.currentHistoryStepIndex === this.historySteps.length - 1) {
            return undefined;
        }

        this.currentHistoryStepIndex++;

        let step = this.currentHistoryStep;

        for (const change of step.changes) {
            await change.do();
        }

        return step.cursorStart;
    }

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

export class HistoryTracker {
    public static tracker: HistoryTrackerSingleFile;
    public static instance: HistoryTracker;

    trackers: { [key: string]: HistoryTrackerSingleFile } = {};

    constructor() {
        const tracker = new HistoryTrackerSingleFile();

        this.trackers = {};
        this.trackers[vscode.window.activeTextEditor.document.fileName] = tracker;
        HistoryTracker.tracker = tracker;

        vscode.window.onDidChangeActiveTextEditor(e => {
            const filename = e.document.fileName;

            if (!this.trackers[filename]) {
                this.trackers[filename] = new HistoryTrackerSingleFile();
            }

            HistoryTracker.tracker = this.trackers[filename];
        });
    }
}