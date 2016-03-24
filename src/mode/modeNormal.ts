"use strict";

import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion, MotionMode} from './../motion/motion';
import {ModeHandler} from './modeHandler';
import {DeleteOperator} from './../operator/delete';
import {ChangeOperator} from './../operator/change';
import {Position} from './../motion/position';
import {TextEditor} from "./../textEditor";

export class NormalMode extends Mode {

    protected textObjects : { [key : string] : (position: Position) => Promise<Array<Position>>; } = {
        "iw" : async (p) => {
            const range = [];
            const currentChar = TextEditor.getLineAt(p).text[p.character];
            if (currentChar === ' ' || currentChar === '\t') {
                range[0] = p.getLastWordEnd();
                range[1] = p.getWordRight();
            } else {
                range[0] = p.getWordLeft();
                range[1] = p.getCurrentWordEnd();
            }
            return range;
        },
        "aw" : async (p) => {
            const range = [];
            const currentChar = TextEditor.getLineAt(p).text[p.character];
            if (currentChar === ' ' || currentChar === '\t') {
                range[0] = p.getLastWordEnd();
                range[1] = p.getCurrentWordEnd();
            } else {
                range[0] = p.getWordLeft();
                range[1] = p.getWordRight();
            }
            return range;
        },
    };

    protected commands : { [key : string] : (range : Array<Position>) => Promise<{}>; } = {
        ":" : async (r) => { return showCmdLine("", this._modeHandler); },
        "u" : async (r) => { return vscode.commands.executeCommand("undo"); },
        "<c-r>" : async (r) => { return vscode.commands.executeCommand("redo"); },

        // "<count>>>" : async () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
        // "<count><<" : async () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
        "<register><count>dd" : async (r) => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
        "<register><count>d<range>" : async (r) => {
            this.motion.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(r[0], r[1]);
            return {};
        },
        "<register><count>c<range>" : async (r) => {
            await new ChangeOperator(this._modeHandler).run(r[0], r[1]);
            return {};
        },
        "<register><count>D" : async (r) => {
            this.motion.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(this.motion.position, this.motion.position.getLineEnd());
            return {};
        },
        "<register><count>C" : async (r) => {
            this.motion.changeMode(MotionMode.Cursor);
            await new ChangeOperator(this._modeHandler).run(this.motion.position, this.motion.position.getLineEnd());
            return {};
        },
        "x" : async (r) => {
            this.motion.changeMode(MotionMode.Cursor);
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
