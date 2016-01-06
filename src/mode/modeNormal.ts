import * as _ from 'lodash';
import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion} from './../motion/motion';
import {DeleteAction} from './../action/deleteAction';

export default class NormalMode extends Mode {
    private keyHandler : { [key : string] : (motion : Motion) => Thenable<{}>; } = {
        ":" : () => { return showCmdLine(); },
        "u" : () => { return vscode.commands.executeCommand("undo"); },
        "ctrl+r" : () => { return vscode.commands.executeCommand("redo"); },
        "h" : c => { return Promise.resolve(c.left().move()); },
        "j" : c => { return Promise.resolve(c.down().move()); },
        "k" : c => { return Promise.resolve(c.up().move()); },
        "l" : c => { return Promise.resolve(c.right().move()); },
        "$" : c => { return Promise.resolve(c.lineEnd().move()); },
        "0" : c => { return Promise.resolve(c.lineBegin().move()); },
        "^" : () => { return vscode.commands.executeCommand("cursorHome"); },
        "gg" : c => { return Promise.resolve(c.firstLineNonBlankChar().move()); },
        "G" : c => { return Promise.resolve(c.lastLineNonBlankChar().move()); },
        "w" : c => { return Promise.resolve(c.wordRight().move()); },
        "e" : c => { return Promise.resolve(c.goToEndOfCurrentWord().move()); },
        "b" : c => { return Promise.resolve(c.wordLeft().move()); },
        ">>" : () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
        "<<" : () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
        "dd" : () => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
        "dw" : () => { return vscode.commands.executeCommand("deleteWordRight"); },
        "db" : () => { return vscode.commands.executeCommand("deleteWordLeft"); },
        "x" : m => { return DeleteAction.Character(m); },
        "esc": () => { return vscode.commands.executeCommand("workbench.action.closeMessages"); }
    };

    constructor(motion : Motion) {
        super(ModeName.Normal, motion);
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key === 'ctrl+[');
    }

    HandleActivation(key : string) : Thenable<{}> {
        this.Motion.left().move();
        return Promise.resolve(this.Motion);
    }

    HandleKeyEvent(key : string) : Thenable<{}>  {
        this.keyHistory.push(key);

        return new Promise(resolve => {
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
                return this.keyHandler[keysPressed](this.Motion);
            }

            resolve();
        });
    }
}
