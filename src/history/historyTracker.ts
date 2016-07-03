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

    constructor(init: {
        changes?: DocumentChange[],
        isFinished?: boolean,
        cursorStart?: Position
    }) {
        this.changes = init.changes = [];
        this.isFinished = init.isFinished || false;
        this.cursorStart = init.cursorStart || undefined;
    }
}

class HistoryTrackerSingleFile {
    private historySteps: HistoryStep[] = [];

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
        this.historySteps.push(new HistoryStep({
            changes    : [new DocumentChange(new Position(0, 0), TextEditor.getAllText(), true)],
            isFinished : true,
            cursorStart: new Position(0, 0)
        }));

        this.oldText = TextEditor.getAllText();

        this.finishCurrentStep();

        this.oldText = TextEditor.getAllText();
    }

    /**
     * Adds an individual Change to the current Step.
     *
     * Determines what changed by diffing the document against what it
     * used to look like.
     */
    addChange(cursorPosition = new Position(0, 0)): void {
        const newText = TextEditor.getAllText();

        if (newText === this.oldText) { return; }

        // Determine if we should add a new Step.

        if (this.currentHistoryStepIndex === this.historySteps.length - 1 &&
            this.currentHistoryStep.isFinished) {

            this.historySteps.push(new HistoryStep({}));
            this.currentHistoryStepIndex++;
        } else if (this.currentHistoryStepIndex !== this.historySteps.length - 1) {
            this.historySteps = this.historySteps.slice(0, this.currentHistoryStepIndex + 1);

            this.historySteps.push(new HistoryStep({}));
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
            let change: DocumentChange;
            let lastChange = this.currentHistoryStep.changes.length > 1 &&
              this.currentHistoryStep.changes[this.currentHistoryStep.changes.length - 2];

            if (diff.added) {
                change = new DocumentChange(currentPosition, diff.value, true);
            } else if (diff.removed) {
                change = new DocumentChange(currentPosition, diff.value, false);
            }

            // attempt to merge with last change
            let couldMerge = false;

            if (lastChange && lastChange.start.getDocumentEnd().compareTo(lastChange.start) > 0) {
                if (diff.added && lastChange.start.getRight().advancePositionByText(lastChange.text).isEqual(currentPosition)) {
                    lastChange.text += change.text;
                    couldMerge = true;
                }
            }

            if (!couldMerge && change) {
                this.currentHistoryStep.changes.push(change);
            }

            if (change && this.currentHistoryStep.cursorStart === undefined) {
                this.currentHistoryStep.cursorStart = cursorPosition;
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
            await change.undo();
        }

        this.currentHistoryStepIndex--;

        return step && step.cursorStart;
    }

    /**
     * Returns undefined on failure.
     */
    async goForwardHistoryStep(): Promise<Position> {
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
            if (!e) {
                return; // happens when you close the last document. (hardly matters!)
            }

            const filename = e.document.fileName;

            if (!this.trackers[filename]) {
                this.trackers[filename] = new HistoryTrackerSingleFile();
            }

            HistoryTracker.tracker = this.trackers[filename];
        });
    }
}