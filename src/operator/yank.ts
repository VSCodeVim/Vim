"use strict";

import * as vscode from "vscode";
import { Position } from './../motion/position';
import { BaseOperator } from './operator';
import { ModeHandler } from './../mode/modeHandler.ts';
import { TextEditor } from './../textEditor';
import { RegisterAction } from './../actions/actions';

@RegisterAction
export class YankOperator extends BaseOperator {
    public key: string = "y";

    /**
     * Run this operator on a range.
     */
    public async run(modeHandler: ModeHandler, start: Position, end: Position): Promise<void> {
        await TextEditor.copy(new vscode.Range(start, end))

        modeHandler.currentMode.motion.select(end, end);
        modeHandler.setNormal();
    }
}