"use strict";

import { ModeName, Mode } from './mode';
import { Motion} from './../motion/motion';
import { Position } from './../motion/position';
import { DeleteOperator } from './../operator/delete';
import { ModeHandler } from './modeHandler.ts';
import { ChangeOperator } from './../operator/change';
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

    protected commands: { [key: string]: (ranger, argument : string) => Promise<{}>; };

    constructor(motion: Motion, modeHandler: ModeHandler) {
        super(ModeName.Visual, motion);

        this._modeHandler = modeHandler;

        const deleteHandler = async (ranger) => {
            const range = await ranger();
            await new DeleteOperator(this._modeHandler).run(range[0], range[1]);
            this._modeHandler.setCurrentModeByName(ModeName.Normal, false);
            this.fixPosition();
            return {};
        };

        this.commands = {
            // TODO: use DeleteOperator.key()

            // TODO: Don't pass in mode handler to DeleteOperators,
            // simply allow the operators to say what mode they transition into.
            "d" : deleteHandler,
            "x" : deleteHandler,
            "c" : async (ranger) => {
                const range = await ranger();
                await new ChangeOperator(this._modeHandler).run(range[0], range[1]);
                this.fixPosition();
                return {};
            },
            "esc" : async () => { this._modeHandler.setCurrentModeByName(ModeName.Normal, false); return {}; }
        };
    }

    handleActivation() {
        this._selectionStart = this.motion.position;
        this._selectionStop  = this._selectionStart;

        this.motion.select(this._selectionStart, this._selectionStop);
        return;
    }

    handleDeactivation(): void {
        super.handleDeactivation();

        this.safeMoveTo(this._selectionStop);
    }

    makeMotionHandler(motion, argument) {
        return async (c) => {

            this._selectionStop = await motion(this._selectionStop, c, argument);

            const position = this.motion.moveTo(this._selectionStart.line, this._selectionStart.character);

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
                this.motion.select(this._selectionStart.getRightMore(), this._selectionStop);
            }

            return position;
        };
    }

    makeCommandHandler(command, ranger, argument) {
        return async (c) => {
            const selectionRanger = () => {
                if (this._selectionStart.compareTo(this._selectionStop) <= 0) {
                    return [this._selectionStart, this._selectionStop.getRightMore()];
                } else {
                    return [this._selectionStart.getRightMore(), this._selectionStop];
                }
            };
            await command(selectionRanger);
        };
    }

    private fixPosition() {
        if (this._selectionStart.compareTo(this._selectionStop) <= 0) {
            this.safeMoveTo(this._selectionStart);
        } else {
            this.safeMoveTo(this._selectionStop);
        }
    }

    private safeMoveTo(position : Position) {
        const text = TextEditor.getLineAt(position).text;
        if (text.length === 0) {
            position = new Position(position.line, 0, position.positionOptions);
        } else if (position.character >= text.length) {
            position = new Position(position.line, text.length - 1, position.positionOptions);
        }
        this.motion.moveTo(position.line, position.character);
    }
}
