"use strict";

import { Position } from './../motion/position';
import { BaseOperator } from './operator';
import { ModeHandler } from './../mode/modeHandler.ts';
import { TextEditor } from './../textEditor';
import { Register } from './../register/register';
import { RegisterAction } from './../actions/actions';

@RegisterAction
export class PutOperator extends BaseOperator {
    public key: string = "p";

    /**
     * Run this operator on a range.
     */
    public async run(modeHandler: ModeHandler, start: Position, end: Position): Promise<void> {
        const data = Register.get();

        await TextEditor.insertAt(data, start.getRight());
        modeHandler.currentMode.motion.moveTo(start.line, start.getRight().character);
    }
}