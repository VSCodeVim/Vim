"use strict";

import { Position } from './../motion/position';
import { DeleteOperator } from './delete';
import { ModeHandler } from './../mode/modeHandler.ts';
import { ModeName } from './../mode/mode';

export class ChangeOperator {
    private _modeHandler: ModeHandler;

    constructor(modeHandler: ModeHandler) {
        this._modeHandler = modeHandler;
    }

    public key(): string { return "d"; }

    /**
     * Run this operator on a range.
     */
    public async run(start: Position, end: Position): Promise<void> {
        await new DeleteOperator(this._modeHandler).run(start, end);

        this._modeHandler.setCurrentModeByName(ModeName.Insert);
    }
}