"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion} from './../motion/motion';
import {DeleteAction} from './../action/deleteAction';

export class NormalMode extends Mode {
    private keyHandler : { [key : string] : (motion : Motion) => Promise<{}>; } = {
        ":" : async () => { return showCmdLine(""); },
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
        "e" : async (c) => { return c.goToEndOfCurrentWord().move(); },
        "b" : async (c) => { return c.wordLeft().move(); },
        "}" : async (c) => { return c.goToEndOfCurrentParagraph().move(); },
        "{" : async (c) => { return c.goToBeginningOfCurrentParagraph().move(); },
        ">>" : async () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
        "<<" : async () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
        "dd" : async () => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
        "dw" : async () => { return vscode.commands.executeCommand("deleteWordRight"); },
        "db" : async () => { return vscode.commands.executeCommand("deleteWordLeft"); },
        "x" : async (m) => { return DeleteAction.Character(m); },
        "esc": async () => { return vscode.commands.executeCommand("workbench.action.closeMessages"); }
    };

    constructor(motion : Motion) {
        super(ModeName.Normal, motion);
    }

    shouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key === 'ctrl+[' || key === "ctrl+c");
    }

    async handleActivation(key : string): Promise<{}> {
        this.motion.left().move();

        return this.motion;
    }

    async handleKeyEvent(key : string): Promise<{}>  {
        this.keyHistory.push(key);

        let keyHandled = false;
        let keysPressed : string;

        for (let window = this.keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this.keyHistory, window).join('');
            if (this.keyHandler[keysPressed] !== undefined) {
                keyHandled = true;
                break;
            }
        }

        if (keyHandled) {
            this.keyHistory = [];
            return this.keyHandler[keysPressed](this.motion);
        }
    }
}
