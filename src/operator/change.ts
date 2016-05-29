"use strict";

import { Position } from './../motion/position';
import { DeleteOperator } from './delete';
import { Operator } from './operator';
import { ModeHandler } from './../mode/modeHandler.ts';
import { ModeName } from './../mode/mode';
import { RegisterAction } from './../actions/actions';

@RegisterAction
export class ChangeOperator extends Operator {
    public key: string = "y";

    /**
     * Run this operator on a range.
     */
    public async run(modeHandler: ModeHandler, start: Position, end: Position): Promise<void> {
        await new DeleteOperator().run(modeHandler, start, end);
        modeHandler.setCurrentModeByName(ModeName.Insert);
    }
}