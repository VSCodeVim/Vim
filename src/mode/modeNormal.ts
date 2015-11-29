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
            "ctrl+r" : () => { vscode.commands.executeCommand("redo"); },
            "h" : () => { vscode.commands.executeCommand("cursorLeft"); },
            "j" : () => { vscode.commands.executeCommand("cursorDown"); },
            "k" : () => { vscode.commands.executeCommand("cursorUp"); },
            "l" : () => { vscode.commands.executeCommand("cursorRight"); },
            "w" : () => { vscode.commands.executeCommand("cursorWordRight"); },
            "b" : () => { vscode.commands.executeCommand("cursorWordLeft"); },
            ">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
            "<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
            "dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); },
            "dw" : () => { vscode.commands.executeCommand("deleteWordRight"); },
            "db" : () => { vscode.commands.executeCommand("deleteWordLeft"); },
            "esc": () => { vscode.commands.executeCommand("workbench.action.closeMessages"); }
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        if (key === 'esc' || key === 'ctrl+[') {
            vscode.commands.executeCommand("cursorLeft");
            return true;
        }
    }

    HandleActivation(key : string) : void {
        // do nothing
    }

    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);

        let keyHandled = false;
        
        let keysPressed = this.keyHistory.join('');        
        if (this.keyHandler[keysPressed] !== undefined) {
            keyHandled = true;
            this.keyHandler[keysPressed]();
        } else {
            for (let window = 1; window <= this.keyHistory.length; window++) {
                keysPressed = _.takeRight(this.keyHistory, window).join('');
                if (this.keyHandler[keysPressed] !== undefined) {
                    keyHandled = true;
                    this.keyHandler[keysPressed]();
                    break;
                }
            }
        }
        
        if (keyHandled) {
            this.keyHistory = [];
        }
    }
}