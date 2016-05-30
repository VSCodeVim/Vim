"use strict";

import * as _      from 'lodash';

import { Command, CommandKeyHandler } from './../configuration/commandKeyMap';
import { ModeName, Mode } from './mode';
import { Motion} from './../motion/motion';
import { Position } from './../motion/position';
import { BaseOperator } from './../operator/operator';
import { DeleteOperator } from './../operator/delete';
import { YankOperator } from './../operator/yank';
import { ModeHandler } from './modeHandler.ts';
import { ChangeOperator } from './../operator/change';
import { Actions, BaseMovement } from './../actions/actions';
import { ActionState } from './modeHandler';

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

    constructor(motion: Motion, modeHandler: ModeHandler, keymap: CommandKeyHandler) {
        super(ModeName.Visual, motion, keymap);

        this._modeHandler = modeHandler;
    }

    shouldBeActivated(key: string, currentMode: ModeName): boolean {
        let command : Command = this._keymap[key];
        return command === Command.EnterVisualMode && currentMode === ModeName.Normal;
    }

    async handleActivation(key: string): Promise<void> {
        this._selectionStart = this.motion.position;
        this._selectionStop  = this._selectionStart;

        this.motion.select(this._selectionStart, this._selectionStop);
    }

    handleDeactivation(): void {
        super.handleDeactivation();

        this.motion.moveTo(this._selectionStop.line, this._selectionStop.character);
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

        this._keyHistory = [];

        return true;
    }

    // TODO.

    /*
    if (operator) {
        if (this._selectionStart.compareTo(this._selectionStop) <= 0) {
            await operator.run(this._selectionStart, this._selectionStop.getRight());
        } else {
            await operator.run(this._selectionStart.getRight(), this._selectionStop);
        }
    }
    */
}
