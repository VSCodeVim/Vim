"use strict";

import * as _      from 'lodash';

import {Command} from './commands';
import { ModeName, Mode } from './mode';
import { Motion} from './../motion/motion';
import { Position } from './../motion/position';
import { Operator } from './../operator/operator';
import { DeleteOperator } from './../operator/delete';
import { ModeHandler } from './modeHandler.ts';
import { ChangeOperator } from './../operator/change';

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

    private _keysToOperators: { [key: string]: Operator };

    constructor(motion: Motion, modeHandler: ModeHandler, keymap: {[key: string]: Command}) {
        super(ModeName.Visual, motion, keymap);

        this._modeHandler = modeHandler;
        this._keysToOperators = {
            // TODO: use DeleteOperator.key()

            // TODO: Don't pass in mode handler to DeleteOperators,
            // simply allow the operators to say what mode they transition into.
            'd': new DeleteOperator(modeHandler),
            'x': new DeleteOperator(modeHandler),
            'c': new ChangeOperator(modeHandler),
        };
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

    private async _handleMotion(): Promise<boolean> {
        let keyHandled = false;
        let keysPressed: string;

        for (let window = this._keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this._keyHistory, window).join('');
            if (this.keyToNewPosition[keysPressed] !== undefined) {
                keyHandled = true;
                break;
            }
        }

        if (keyHandled) {
            this._selectionStop = await this.keyToNewPosition[keysPressed](this._selectionStop);

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
        }

        return keyHandled;
    }

    private async _handleOperator(): Promise<boolean> {
        let keysPressed: string;
        let operator: Operator;

        for (let window = this._keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this._keyHistory, window).join('');
            if (this._keysToOperators[keysPressed] !== undefined) {
                operator = this._keysToOperators[keysPressed];
                break;
            }
        }

        if (operator) {
            if (this._selectionStart.compareTo(this._selectionStop) <= 0) {
                await operator.run(this._selectionStart, this._selectionStop.getRight());
            } else {
                await operator.run(this._selectionStart.getRight(), this._selectionStop);
            }
        }

        return !!operator;
    }

    async handleKeyEvent(key: string): Promise<Boolean> {
        this._keyHistory.push(key);

        const wasMotion = await this._handleMotion();

        if (!wasMotion) {
            return await this._handleOperator();
        }

        return true;
    }
}
