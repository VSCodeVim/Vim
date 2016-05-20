"use strict";

import { Position } from './../motion/position';
import { TextEditor } from './../textEditor';
import { ModeHandler } from './../mode/modeHandler.ts';
import { ModeName } from './../mode/mode';
import { Operator } from './operator';

import * as vscode from 'vscode';

export class DeleteOperator extends Operator {
    constructor(modeHandler: ModeHandler) {
        super(modeHandler);
    }

    // public key(): string { return "d"; }

    /**
     * Run this operator on a range.
     */
    public async run(start: Position, end: Position): Promise<void> {
        // Imagine we have selected everything with an X in
        // the following text (there is no character on the
        // second line at all, just a block cursor):

        // XXXXXXX
        // X
        //
        // If we delete this range, we want to delete the entire first and
        // second lines. Therefore we have to advance the cursor to the next
        // line.

        if (start.line !== end.line && TextEditor.getLineAt(end).text === "") {
            end = end.getDown(0);
        }

        await TextEditor.delete(new vscode.Range(start, end));
        this.modeHandler.setCurrentModeByName(ModeName.Normal);
    }
}