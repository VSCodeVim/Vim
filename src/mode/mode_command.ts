import * as _ from 'lodash';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import * as vscode from 'vscode';

export default class CommandMode extends Mode {
    private keyHandler : { [key : string] : (position : vscode.Position) => void; } = {};
    
    constructor() {
        super(ModeName.Command);
        
        this.keyHandler = {
            ":" : (position) => { showCmdLine() },   
            "h" : (position) => { vscode.commands.executeCommand("cursorLeft"); },        
            "j" : (position) => { vscode.commands.executeCommand("cursorDown"); },        
            "k" : (position) => { vscode.commands.executeCommand("cursorUp"); },      
            "l" : (position) => { vscode.commands.executeCommand("cursorRight"); },
            ">>" : (position) => { vscode.commands.executeCommand("editor.action.indentLines"); },
            "<<" : (position) => { vscode.commands.executeCommand("editor.action.outdentLines"); }, 
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key == 'ctrl+[');
    }

    HandleActivation(key : string) : void {
        // do nothing
    }    

    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);
        
        const editor = vscode.window.activeTextEditor;
        const currentPosition = editor.selection.active;
        
        //var commands = vscode.commands.getCommands();
        //commands.then(a => console.log(a));

        var keyHandled = false;
        for (var window = 1; window <= 2 && window <= this.keyHistory.length && keyHandled === false; window++) {
            var keys : string  = _.takeRight(this.keyHistory, window).join('').toString();
            
            console.log(keys);
            if (this.keyHandler[key] !== undefined) {
                // Bug: 'two characters does not work'
                console.log('handled');
                keyHandled = true;
                this.keyHandler[key](currentPosition);
            }
        }
        
        if (keyHandled) {
            this.keyHistory = [];
        }
    }
}