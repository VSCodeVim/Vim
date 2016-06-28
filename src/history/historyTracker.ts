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

    public async undo(): Promise<Position> {
        return this.do(true);
    }
}

class HistoryStep {
    changes: DocumentChange[] = [];
    isFinished: boolean = false;
}

class HistoryTrackerClass {
    public static instance: HistoryTrackerClass = new HistoryTrackerClass();

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

    addChange(): void {
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

        const newText = TextEditor.getAllText();
        const diffs = jsdiff.diffChars(this.oldText, newText);

        let currentPosition = new Position(0, 0);

        for (const diff of diffs) {
            if (diff.added) {
                this.currentHistoryStep.changes.push(
                    new DocumentChange(currentPosition, diff.value, true)
                );
            } else if (diff.removed) {
                this.currentHistoryStep.changes.push(
                    new DocumentChange(currentPosition, diff.value, false)
                );
            }

            if (!diff.removed) {
                currentPosition = currentPosition.advancePositionByText(diff.value);
            }
        }

        this.oldText = newText;
    }

    ignoreChange(): void {
        this.oldText = TextEditor.getAllText();
    }

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

        let position: Position;
        let step = this.currentHistoryStep;

        for (const change of step.changes.slice(0).reverse()) {
            position = await change.undo();
        }

        this.currentHistoryStepIndex--;

        return position;
    }

    /**
     * Returns undefined on failure.
     */
    async goForwardHistoryStep(): Promise<Position> {
        if (this.currentHistoryStepIndex === this.historySteps.length - 1) {
            return undefined;
        }

        this.currentHistoryStepIndex++;

        let position: Position;
        let step = this.currentHistoryStep;

        for (const change of step.changes) {
            position = await change.do();
        }

        return position;
    }

    toString(): string {
        let result = "";

        for (let i = 0; i < this.historySteps.length; i++) {
            const step = this.historySteps[i];

            result += step.changes.map(x => x.text).join("");
            if (this.currentHistoryStepIndex === i) { result += "+"; }
            if (step.isFinished) { result += "✓"; }
            result += "| ";
        }

        return result;
    }
}

export const HistoryTracker = HistoryTrackerClass.instance;