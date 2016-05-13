"use strict";

import * as vscode from "vscode";
import { Position } from './../motion/position';
import { Operator } from './operator';
import { ModeHandler } from './../mode/modeHandler.ts';
import { TextEditor } from './../textEditor';

export class YankOperator extends Operator {

    constructor(modeHandler: ModeHandler) {
        super(modeHandler);
    }

    public key(): string { return "y"; }

    /**
     * Run this operator on a range.
     */
    public async run(start: Position, end: Position): Promise<void> {
        // TODO: use start and end
        return TextEditor.copy(new vscode.Range(start, end)).then(() => {
            this.modeHandler.currentMode.motion.select(end, end);
            this.modeHandler.setNormal();
        });
    }
}