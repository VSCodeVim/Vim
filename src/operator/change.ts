"use strict";

import { Position } from './../motion/position';
import { Operator } from './operator';
import { ModeHandler } from './../mode/modeHandler.ts';
import { ModeName } from './../mode/mode';
import { TextEditor } from './../textEditor';

import * as vscode from 'vscode';

export class ChangeOperator extends Operator {

    constructor(modeHandler: ModeHandler) {
        super(modeHandler);
    }

    public key(): string { return "d"; }

    /**
     * Run this operator on a range.
     */
    public async run(start: Position, end: Position): Promise<void> {
        // Similar to DeleteOperator, but we set different mode
        await TextEditor.delete(new vscode.Range(start, end));
        this.modeHandler.setCurrentModeByName(ModeName.Insert);
    }
}