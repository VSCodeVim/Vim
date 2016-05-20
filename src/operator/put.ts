"use strict";

import { paste } from 'copy-paste';
import { Position } from './../motion/position';
import { Operator } from './operator';
import { ModeHandler } from './../mode/modeHandler.ts';
import { TextEditor } from './../textEditor';

export class PutOperator extends Operator {

    constructor(modeHandler: ModeHandler) {
        super(modeHandler);
    }

    // public key(): string { return "p"; }

    /**
     * Run this operator on a range.
     */
    public async run(start: Position, end: Position): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            paste(async (err, data) => {
                if (err) {
                    reject();
                } else {
                    await TextEditor.insertAt(data, start.getRight());
                    this.modeHandler.currentMode.motion.moveTo(start.line, start.getRight().character);
                    resolve();
                }
            });
        });
    }
}