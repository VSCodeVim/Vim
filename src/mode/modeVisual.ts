"use strict";

import * as vscode from 'vscode';
import * as _      from 'lodash'

import {ModeName, Mode} from './mode';
import {TextEditor} from './../textEditor';
import {Motion} from './../motion/motion';
import {Position, PositionOptions} from './../motion/position';
import { Operator } from './../operator/operator'
import { DeleteOperator } from './../operator/delete'
import { ModeHandler } from './modeHandler.ts'
import { ChangeOperator } from './../operator/change'

export class VisualMode extends Mode {
    private _selectionStart: Position;
    private _selectionStop : Position;
    private _modeHandler   : ModeHandler;

    private _keysToOperators: { [key: string]: Operator };

    constructor(motion: Motion, modeHandler: ModeHandler) {
        super(ModeName.Visual, motion);

        this._keysToOperators = {
            // TODO: use DeleteOperator.key()

            // TODO: Don't pass in mode handler to DeleteOperators,
            // simply allow the operators to say what mode they transition into.
            'd': new DeleteOperator(modeHandler),
            'x': new DeleteOperator(modeHandler),
            'c': new ChangeOperator(modeHandler),
        }
    }

    shouldBeActivated(key: string, currentMode: ModeName): boolean {
        return key === "v";
    }

    async handleActivation(key: string): Promise<void> {
        this._selectionStart = this.motion.position;
        this._selectionStop  = this._selectionStart.getRight();

        this.motion.selectTo(this._selectionStop);
    }

    handleDeactivation(): void {
        super.handleDeactivation();

        this.motion.moveTo(this._selectionStop.line, this._selectionStop.character);
    }

    /**
     * TODO:
     *
     * Eventually, the following functions should be moved into a unified
     * key handler and dispatcher thing.
     */

    private async _handleMotion(): Promise<boolean> {
        let keyHandled = false;
        let keysPressed: string;

        for (let window = this.keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this.keyHistory, window).join('');
            if (this.keyToNewPosition[keysPressed] !== undefined) {
                keyHandled = true;
                break;
            }
        }

        if (keyHandled) {
            this._selectionStop = await this.keyToNewPosition[keysPressed](this._selectionStop);

            this.motion.moveTo(this._selectionStart.line, this._selectionStart.character);
            this.motion.selectTo(this._selectionStop.getRight());

            this.keyHistory = [];
        }

        return keyHandled;
    }

    private async _handleOperator(): Promise<boolean> {
        let keyHandled = false;
        let keysPressed: string;
        let operator: Operator;

        for (let window = this.keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this.keyHistory, window).join('');
            if (this._keysToOperators[keysPressed] !== undefined) {
                operator = this._keysToOperators[keysPressed];
                break;
            }
        }

        if (operator) {
            if (this._selectionStart.compareTo(this._selectionStop)) {
                operator.run(this._selectionStart, this._selectionStop.getRight());
            } else {
                operator.run(this._selectionStop, this._selectionStart.getRight());
            }
        }

        return !!operator;
    }

    async handleKeyEvent(key: string): Promise<void> {
        this.keyHistory.push(key);

        const wasMotion = await this._handleMotion();

        if (!wasMotion) {
            await this._handleOperator();
        }
    }
}
