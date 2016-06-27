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
                console.log("Add at ", currentPosition.line, currentPosition.character);
            } else if (diff.removed) {
                console.log("Remove at ", currentPosition.line, currentPosition.character);
            }

            const numberOfLinesSpanned = (diff.value.match(/\n/g) || []).length;

            currentPosition = new Position(
                currentPosition.line + numberOfLinesSpanned,
                numberOfLinesSpanned === 0 ?
                    currentPosition.character + diff.value.length :
                    diff.value.length - (diff.value.lastIndexOf('\n') + 1)
            );
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
            if (change.isAdd) {
                const rangeStart = change.start;
                const rangeStop = new Position(
                    rangeStart.line,
                    rangeStart.character + change.text.length);

                await TextEditor.delete(new vscode.Range(
                    rangeStart,
                    rangeStop
                ), false);
            } else {
                console.log("TODO...");
            }
        }

        return step.changes[0].start;
    }
}

export const HistoryTracker = HistoryTrackerClass.instance;