"use strict";

import { Position } from './../motion/position';
import { ModeHandler } from './../mode/modeHandler.ts';

export abstract class Operator {
    private _modeHandler: ModeHandler;

    constructor(modeHandler: ModeHandler) {
        this._modeHandler = modeHandler;
    }

    get modeHandler() : ModeHandler {
        return this._modeHandler;
    }

    /**
     * What key triggers this operator?
     */
    // abstract key(): string;

    /**
     * Run this operator on a range.
     */
    abstract run(start: Position, stop: Position): Promise<void>;
}