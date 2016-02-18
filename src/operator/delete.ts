"use strict";

import { Position } from './../motion/position';
import { TextEditor } from './../textEditor';
import { ModeHandler } from './../mode/modeHandler.ts';
import { ModeName } from './../mode/mode';

import * as vscode from 'vscode';

export class DeleteOperator {
    private _modeHandler: ModeHandler;

    constructor(modeHandler: ModeHandler) {
        this._modeHandler = modeHandler;
    }

    public key(): string { return "d"; }

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

        if (TextEditor.getLineAt(end).text === "") {
            end = end.getDown(0);
        }

        await TextEditor.delete(new vscode.Range(start, end));

        this._modeHandler.setCurrentModeByName(ModeName.Normal);
    }
}