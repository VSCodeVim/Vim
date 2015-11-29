import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import TextEditor from './../textEditor';

export default class InsertMode extends Mode {
    private activationKeyHandler : { [ key : string] : (position : vscode.Position) => vscode.Position; } = {};
    
    constructor() {
        super(ModeName.Insert);
        
        this.activationKeyHandler = {
            // insert at cursor
            "i" : (position) => { return position; },
            
            // insert at the beginning of the line            
            "I" : (position) => { return new vscode.Position(position.line, 0); },
            
            // append after the cursor            
            "a" : (position) => { return new vscode.Position(position.line, position.character + 1); },
            
            // append at the end of the line            
            "A" : (position) => { return TextEditor.GetEndOfLine(position); },
            
            // open blank line below current line            
            "o" : (position) => { 
                vscode.commands.executeCommand("editor.action.insertLineAfter");      
                return new vscode.Position(position.line + 1, 0);
            },
            
            // open blank line above current line           
            "O" : (position) => { 
                vscode.commands.executeCommand("editor.action.insertLineBefore");
                return new vscode.Position(position.line, 0);
            }             
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return key in this.activationKeyHandler;
    }
    
    HandleActivation(key : string) : void {
        var newPosition = this.activationKeyHandler[key](TextEditor.GetCurrentPosition());
        TextEditor.SetCurrentPosition(newPosition);
    }
    
    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);
        TextEditor.Insert(this.ResolveKeyValue(key));
    }
    
    // Some keys have names that are different to their value.
    // TODO: we probably need to put this somewhere else.
    private ResolveKeyValue(key : string) : string {
        switch (key) {
            case 'space':
                return ' ';
            default:
                return key;
        }
    }
}