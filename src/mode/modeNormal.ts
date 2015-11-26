import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';

export default class CommandMode extends Mode {
    private keyHandler : { [key : string] : () => void; } = {};

    constructor() {
        super(ModeName.Normal);

        this.keyHandler = {
            ":" : () => { showCmdLine(); },
            "u" : () => { vscode.commands.executeCommand("undo"); },
            "h" : () => { vscode.commands.executeCommand("cursorLeft"); },
            "j" : () => { vscode.commands.executeCommand("cursorDown"); },
            "k" : () => { vscode.commands.executeCommand("cursorUp"); },
            "l" : () => { vscode.commands.executeCommand("cursorRight"); },
            ">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
            "<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
            "dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); },
            "dw" : () => { vscode.commands.executeCommand("deleteWordRight"); },
            "esc": () => { vscode.commands.executeCommand("workbench.action.closeMessages"); }
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key === 'ctrl+[');
    }

    HandleActivation(key : string) : void {
        // do nothing
    }

    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);

        let keyHandled = false;
        for (let window =  1; window <= this.keyHistory.length; window++) {
            var keysPressed = _.takeRight(this.keyHistory, window).join('');
            if (this.keyHandler[keysPressed] !== undefined) {
                keyHandled = true;
                this.keyHandler[keysPressed]();
                break;
            }
        }

        if (keyHandled) {
            this.keyHistory = [];
        }
    }
}