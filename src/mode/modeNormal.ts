"use strict";

import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion, MotionMode} from './../motion/motion';
import {ModeHandler} from './modeHandler';
import {DeleteOperator} from './../operator/delete';
import {Position} from './../motion/position';

export class NormalMode extends Mode {

    protected textObjects : { [key : string] : () => Promise<{}>; } = {
        "iw" : async () => { return {}; }
    };

    protected commands : { [key : string] : (range : Array<Position>) => Promise<{}>; } = {
        ":" : async (r) => { return showCmdLine("", this._modeHandler); },
        "u" : async (r) => { return vscode.commands.executeCommand("undo"); },
        "<c-r>" : async (r) => { return vscode.commands.executeCommand("redo"); },

        // "<count>>>" : async () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
        // "<count><<" : async () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
        "<register><count>dd" : async (r) => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
        "<register><count>d<range>" : async (r) => {
            await new DeleteOperator(this._modeHandler).run(r[0], r[1]);
            return {};
        },
        "<register><count>D" : async (r) => {
            this.motion.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(this.motion.position, this.motion.position.getLineEnd());
            this.motion.changeMode(MotionMode.Caret);
            this.motion.left().move();
            return {};
        },
        "x" : async (r) => {
            await new DeleteOperator(this._modeHandler).run(this.motion.position, this.motion.position.getRight());
            return {};
        },
        "X" : async (r) => { return vscode.commands.executeCommand("deleteLeft"); },
        "<esc>": async (r) => { return vscode.commands.executeCommand("workbench.action.closeMessages"); }
    };

    private _modeHandler: ModeHandler;

    constructor(motion : Motion, modeHandler: ModeHandler) {
        super(ModeName.Normal, motion);

        this._modeHandler = modeHandler;

        this.initializeParser();
    }

    shouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === '<esc>' || key === 'ctrl+[' || (key === "v" && currentMode === ModeName.Visual));
    }

    async handleActivation(key : string): Promise<void> {
        this.motion.left().move();
    }

}
