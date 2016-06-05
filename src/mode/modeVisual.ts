"use strict";

import { ModeName, Mode } from './mode';
import { Motion} from './../motion/motion';
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

    constructor(motion: Motion, modeHandler: ModeHandler) {
        super(ModeName.Visual, motion);

        this._modeHandler = modeHandler;
    }

    public start(): void {
        this._selectionStart = this.motion.position;
        this._selectionStop  = this._selectionStart;

        this.motion.select(this._selectionStart, this._selectionStop);
    }

    public async handleMotion(start: Position, position: Position): Promise<boolean> {
        this._selectionStop = position;
        this._selectionStart = start;
        this.motion.moveTo(this._selectionStart.line, this._selectionStart.character);


        return true;
    }
}
