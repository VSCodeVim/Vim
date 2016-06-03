"use strict";

import * as _      from 'lodash';

import { ModeName, Mode } from './mode';
import { Motion} from './../motion/motion';
import { Position } from './../motion/position';
import { ModeHandler } from './modeHandler.ts';
import { TextEditor } from './../textEditor';

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

    public async handleMotion(position: Position): Promise<boolean> {
        this._selectionStop = position;
        this.motion.moveTo(this._selectionStart.line, this._selectionStart.character);

        /**
         * Always select the letter that we started visual mode on, no matter
         * if we are in front or behind it. Imagine that we started visual mode
         * with some text like this:
         *
         *   abc|def
         *
         * (The | represents the cursor.) If we now press w, we'll select def,
         * but if we hit b we expect to select abcd, so we need to getRight() on the
         * start of the selection when it precedes where we started visual mode.
         */
        if (this._selectionStart.compareTo(this._selectionStop) <= 0) {
            this.motion.select(this._selectionStart, this._selectionStop);
        } else {
            this.motion.select(this._selectionStart.getRight(), this._selectionStop);
        }

        return true;
    }
}
