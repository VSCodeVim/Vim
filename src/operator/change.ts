"use strict";

import { Position } from './../motion/position';
import { DeleteOperator } from './delete';
import { Operator } from './operator';
import { ModeHandler } from './../mode/modeHandler.ts';
import { ModeName } from './../mode/mode';

export class ChangeOperator extends Operator {

    constructor(modeHandler: ModeHandler) {
        super(modeHandler);
    }

    // public key(): string { return "d"; }

    /**
     * Run this operator on a range.
     */
    public async run(start: Position, end: Position): Promise<void> {
        await new DeleteOperator(this.modeHandler).run(start, end);
        this.modeHandler.setCurrentModeByName(ModeName.Insert);
    }
}