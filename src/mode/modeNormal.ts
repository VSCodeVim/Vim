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
            "h" : () => { vscode.commands.executeCommand("cursorLeft"); },        
            "j" : () => { vscode.commands.executeCommand("cursorDown"); },        
            "k" : () => { vscode.commands.executeCommand("cursorUp"); },      
            "l" : () => { vscode.commands.executeCommand("cursorRight"); },
            ">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
            "<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
            "dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); }
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key === 'ctrl+[');
    }

    HandleActivation(key : string) : void {
        // do nothing
    }

    HandleKeyEvent(key : string) : void {
        let keyHandled = false;
        for (let window = 0; window <= this.keyHistory.length; window++) {
            var keysPressed = key + _.takeRight(this.keyHistory, window).join('');
            
            if (this.keyHandler[keysPressed] !== undefined) {
                keyHandled = true;
                this.keyHandler[keysPressed]();
                break;
            }
        }
        
        if (keyHandled) {
            this.keyHistory = [];
        } else {
            this.keyHistory.push(key);
        }
    }
}