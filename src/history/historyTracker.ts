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
    public async do(undo = false): Promise<Position> {
        const rangeStart = this.start;

        if ((this.isAdd && !undo) || (!this.isAdd && undo)) {
            await TextEditor.insertAt(
                this.text,
                rangeStart
            );
        } else {
            const rangeStop = rangeStart.advancePositionByText(this.text);

            await TextEditor.delete(new vscode.Range(
                rangeStart,
                rangeStop
            ), false);
        }

        if ((this.isAdd && !undo) || (!this.isAdd && undo)) {
            return this.start;
        } else {
            return this.start.advancePositionByText(this.text);
        }
    }
}

class HistoryStep {
    changes: DocumentChange[] = [];
}

class HistoryTrackerClass {
    public static instance: HistoryTrackerClass = new HistoryTrackerClass();

    private historySteps: HistoryStep[] = [];

    private oldText: string;

    private get mostRecentHistoryStep(): HistoryStep {
        return this.historySteps[this.historySteps.length - 1];
    }

    constructor() {
        this.addStep();

        this.oldText = TextEditor.getAllText();
    }

    addChange(): void {
        const newText = TextEditor.getAllText();
        const diffs = jsdiff.diffChars(this.oldText, newText);

        let currentPosition = new Position(0, 0);

        for (const diff of diffs) {
            if (diff.added) {
                this.mostRecentHistoryStep.changes.push(
                    new DocumentChange(currentPosition, diff.value, true)
                );
            } else if (diff.removed) {
                this.mostRecentHistoryStep.changes.push(
                    new DocumentChange(currentPosition, diff.value, false)
                );
            }

            if (!diff.removed) {
                currentPosition = currentPosition.advancePositionByText(diff.value);
            }
        }

        this.oldText = newText;
    }

    addStep(): void {
        if (this.historySteps.length === 0 ||
            this.mostRecentHistoryStep.changes.length > 0) {

            this.historySteps.push(new HistoryStep());
        }
    }

    async revertHistoryStep(): Promise<Position> {
        if (this.historySteps.length === 0) {
            return;
        }

        let position: Position;
        let step = this.historySteps.pop();

        for (const change of step.changes.slice(0).reverse()) {
            position = await change.do(true);
        }

        return position;
    }
}

export const HistoryTracker = HistoryTrackerClass.instance;