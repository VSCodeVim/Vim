"use strict";

import { ModeName, Mode } from './mode';
import { Motion} from './../motion/motion';
import { Position } from './../motion/position';
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

    constructor(motion: Motion, modeHandler: ModeHandler) {
        super(ModeName.Visual, motion);

        this._modeHandler = modeHandler;
        this.initializeParser();
    }

    protected commands : { [key : string] : (range : Array<Position>) => Promise<{}>; } = {
        "d" : async (r) => {
            await new DeleteOperator(this._modeHandler).run(r[0], r[1]);
            return {};
        },
        "x" : async (r) => {
            await new DeleteOperator(this._modeHandler).run(r[0], r[1]);
            return {};
        },
        "c" : async (r) => {
            await new ChangeOperator(this._modeHandler).run(r[0], r[1]);
            return {};
        }
    };

    shouldBeActivated(key: string, currentMode: ModeName): boolean {
        return key === "v" && currentMode === ModeName.Normal;
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

    private async _handleOperator(command): Promise<void> {
        if (command) {
            if (this._selectionStart.compareTo(this._selectionStop) <= 0) {
                await command([this._selectionStart, this._selectionStop.getRight()]);
            } else {
                await command([this._selectionStart.getRight(), this._selectionStop]);
            }
        }
    }

    async handleCommand(command) : Promise<void> {
        const commandString = command.command;
        if (this.motions[commandString]) {
            this._selectionStop = await this.motions[commandString](this.motion.position, command);

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

            // TODO this could be abstracted out
            if (this._selectionStart.compareTo(this._selectionStop) <= 0) {
                this.motion.select(this._selectionStart, this._selectionStop);
            } else {
                this.motion.select(this._selectionStart.getRight(), this._selectionStop);
            }
        } else if (this.commands[commandString]) {
            await this._handleOperator(this.commands[commandString]);
        }
    }
}
