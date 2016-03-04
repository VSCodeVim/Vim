"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion, MotionMode} from './../motion/motion';
import {ModeHandler} from './modeHandler';
import {DeleteOperator} from './../operator/delete';

export class NormalMode extends Mode {
    protected keyHandler : { [key : string] : (motion : Motion) => Promise<{}>; } = {
        ":" : async () => { return showCmdLine("", this._modeHandler); },
        "u" : async () => { return vscode.commands.executeCommand("undo"); },
        "ctrl+r" : async () => { return vscode.commands.executeCommand("redo"); },
        "h" : async (c) => { return c.left().move(); },
        "j" : async (c) => { return c.down().move(); },
        "k" : async (c) => { return c.up().move(); },
        "l" : async (c) => { return c.right().move(); },
        "$" : async (c) => { return c.lineEnd().move(); },
        "0" : async (c) => { return c.lineBegin().move(); },
        "^" : async () => { return vscode.commands.executeCommand("cursorHome"); },
        "gg" : async (c) => { return c.firstLineNonBlankChar().move(); },
        "G" : async (c) => { return c.lastLineNonBlankChar().move(); },
        "w" : async (c) => { return c.wordRight().move(); },
        "W" : async (c) => { return c.bigWordRight().move(); },
        "e" : async (c) => { return c.goToEndOfCurrentWord().move(); },
        "E" : async (c) => { return c.goToEndOfCurrentBigWord().move(); },
        "b" : async (c) => { return c.wordLeft().move(); },
        "B" : async (c) => { return c.bigWordLeft().move(); },
        "}" : async (c) => { return c.goToEndOfCurrentParagraph().move(); },
        "{" : async (c) => { return c.goToBeginningOfCurrentParagraph().move(); },
        "ctrl+f": async (c) => { return vscode.commands.executeCommand("cursorPageDown"); },
        "ctrl+b": async (c) => { return vscode.commands.executeCommand("cursorPageUp"); },
        "%" : async () => { return vscode.commands.executeCommand("editor.action.jumpToBracket"); },
        ">>" : async () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
        "<<" : async () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
        "dd" : async () => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
        "dw" : async (m) => {
            m.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(m.position, m.position.getWordRight());
            this.motion.left().move();
            return {};
        },
        "dW" : async (m) => {
            m.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(m.position, m.position.getBigWordRight());
            this.motion.left().move();
            return {};
        },
        "db" : async (m) => {
            m.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(m.position, m.position.getWordLeft());
            return {};
        },
        "dB" : async (m) => {
            m.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(m.position, m.position.getBigWordLeft());
            return {};
        },
        "de" : async (m) => {
            m.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(m.position, m.position.getCurrentWordEnd());
            this.motion.left().move();
            return {};
        },
        "dE" : async (m) => {
            m.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(m.position, m.position.getCurrentBigWordEnd());
            this.motion.left().move();
            return {};
        },
        "D" : async (m) => {
            m.changeMode(MotionMode.Cursor);
            await new DeleteOperator(this._modeHandler).run(m.position, m.position.getLineEnd());
            this.motion.left().move();
            return {};
        },
        "x" : async (m) => { await new DeleteOperator(this._modeHandler).run(m.position, m.position.getRight()); return {}; },
        "X" : async (m) => { return vscode.commands.executeCommand("deleteLeft"); },
        "esc": async () => { return vscode.commands.executeCommand("workbench.action.closeMessages"); }
    };

    private _modeHandler: ModeHandler;

    constructor(motion : Motion, modeHandler: ModeHandler) {
        super(ModeName.Normal, motion);

        this._modeHandler = modeHandler;
    }

    shouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key === 'ctrl+[' || (key === "v" && currentMode === ModeName.Visual));
    }

    async handleActivation(key : string): Promise<void> {
        this.motion.left().move();
    }

    async handleKeyEvent(key : string): Promise<void>  {
        this.keyHistory.push(key);

        let keyHandled = false;
        let keysPressed: string;

        for (let window = this.keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this.keyHistory, window).join('');
            if (this.keyHandler[keysPressed] !== undefined) {
                keyHandled = true;
                break;
            }
        }

        if (keyHandled) {
            this.keyHistory = [];
            await this.keyHandler[keysPressed](this.motion);
        }
    }
}
