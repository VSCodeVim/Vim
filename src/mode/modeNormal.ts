"use strict";

import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion} from './../motion/motion';
import {ModeHandler} from './modeHandler';
import {ChangeOperator} from './../operator/change';
import {DeleteOperator} from './../operator/delete';

export class NormalMode extends Mode {
    protected commands : { [key : string] : (ranger, argument : string) => Promise<{}>; } = {
        ":" : async () => { return showCmdLine(""); },
        "u" : async () => { return vscode.commands.executeCommand("undo"); },
        "ctrl+r" : async () => { return vscode.commands.executeCommand("redo"); },
        ">>" : async () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
        "<<" : async () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
        "dd" : async () => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
        "d{rangeable}" : async (ranger) => {
            const range = await ranger();
            await new DeleteOperator(this._modeHandler).run(range[0], range[1]);
            return {};
        },
        "c{rangeable}" : async (ranger) => {
            const range = await ranger();
            await new ChangeOperator(this._modeHandler).run(range[0], range[1]);
            return {};
        },
        "x" : async () => {
            await new DeleteOperator(this._modeHandler).run(this.motion.position, this.motion.position.getRight());
            return {};
        },
        "X" : async () => { return vscode.commands.executeCommand("deleteLeft"); },

        "." : async () => {
            if (this._lastAction) {
                await this._lastAction();
            }
            return {};
         },
        "esc" : async () => { this.resetState(); return vscode.commands.executeCommand("workbench.action.closeMessages"); },

        "v" : async () => {
            this._modeHandler.setCurrentModeByName(ModeName.Visual);
            return {};
        },
        "i" : async () => {
            // insert at cursor
            this._modeHandler.setCurrentModeByName(ModeName.Insert);
            return this.motion.move();
        },
        "I" : async () => {
            // insert at line beginning
            this._modeHandler.setCurrentModeByName(ModeName.Insert);
            return this.motion.lineBegin().move();
        },
        "a" : async () => {
            // append after the cursor
            this._modeHandler.setCurrentModeByName(ModeName.Insert);
            return this.motion.right().move();
        },
        "A" : async () => {
            // append at the end of the line
            this._modeHandler.setCurrentModeByName(ModeName.Insert);
            return this.motion.lineEnd().move();
        },
        "o" : async () => {
            // open blank line below current line
            this._modeHandler.setCurrentModeByName(ModeName.Insert);
            return await vscode.commands.executeCommand("editor.action.insertLineAfter");
        },
        "O" : async () => {
            // open blank line above current line
            this._modeHandler.setCurrentModeByName(ModeName.Insert);
            return await vscode.commands.executeCommand("editor.action.insertLineBefore");
        }
    };

    private repeatBlacklist = [":", "u", "ctrl+r", ".", "esc", "v", "i", "I", "a", "A", "o", "O"];

    private _modeHandler: ModeHandler;

    private _lastAction = null;

    constructor(motion : Motion, modeHandler: ModeHandler) {
        super(ModeName.Normal, motion);

        this._modeHandler = modeHandler;
    }

    async handleActivation(): Promise<void> {
        this.motion.left().move();
        this.resetState();
    }

    makeMotionHandler(motion, argument) {
        return async (c) => {
            const position = await motion(this.motion.position, c, argument);
            return this.motion.moveTo(position.line, position.character);
        };
    }

    makeCommandHandler(command, ranger, argument) {
        return async (c) => {
            const action = async () => { await command(ranger, argument); };
            for (let i = 0; i < (c || 1); i++) {
                await action();
            }
            if (!this.inRepeatBlacklist(command)) {
                // save for ".", but not "."
                this._lastAction = action;
            }
        };
    }

    private inRepeatBlacklist(command) {
        for (const key of this.repeatBlacklist) {
            if (command === this.commands[key]) {
                return true;
            }
        }
        return false;
    }

}
