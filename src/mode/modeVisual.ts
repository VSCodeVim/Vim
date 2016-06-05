"use strict";

import { ModeName, Mode } from './mode';
import { Position } from './../motion/position';
import { ModeHandler } from './modeHandler.ts';

export class VisualMode extends Mode {
    /**
     * The part of the selection that stays in the same place when motions are applied.
     */
    private _selectionStart: Position;

    /**
     * The part of the selection that moves.
     */
    private _selectionStop : Position;
    private _modeHandler   : ModeHandler;

    public get selectionStart(): Position {
        return this._selectionStart;
    }

    public get selectionStop(): Position {
        return this._selectionStop;
    }

    public setSelectionStop(p: Position): void {
        this._selectionStop = p;
    }

    constructor(modeHandler: ModeHandler) {
        super(ModeName.Visual);

        this._modeHandler = modeHandler;
    }
}
