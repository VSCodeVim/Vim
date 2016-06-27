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
        this.addHistoryStep();

        this.oldText = TextEditor.getAllText();
    }

    addHistoryChange(): void {
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

        // this.mostRecentHistoryStep.changes.push(change);

        this.oldText = newText;
    }

    addHistoryStep(): void {
        if (this.historySteps.length === 0 ||
            this.mostRecentHistoryStep.changes.length > 0) {

            this.historySteps.push(new HistoryStep());
        }
    }

    async revertHistoryStep(): Promise<Position> {
        if (this.historySteps.length === 0) {
            return;
        }

        const step = this.historySteps.pop();

        for (const change of step.changes.slice(0).reverse()) {
            const rangeStart = change.start;

            // Undo a change

            if (change.isAdd) {
                const rangeStop = rangeStart.advancePositionByText(change.text);

                await TextEditor.delete(new vscode.Range(
                    rangeStart,
                    rangeStop
                ), false);
            } else {
                await TextEditor.insertAt(
                    change.text,
                    rangeStart
                );
            }
        }

        const firstChange = step.changes[0];

        if (firstChange.isAdd) {
            return firstChange.start.advancePositionByText(firstChange.text);
        } else {
            return firstChange.start;
        }
    }
}

export const HistoryTracker = HistoryTrackerClass.instance;