"use strict";

import {Position, PositionOptions} from './../motion/position';
import { TextEditor } from './../textEditor'
import { Operator } from './Operator'
import { ModeHandler } from './../mode/modeHandler.ts'
import { ModeName } from './../mode/mode'

import * as vscode from 'vscode'

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
        await TextEditor.delete(new vscode.Range(start, end));

        this._modeHandler.setCurrentModeByName(ModeName.Normal);
    }
}