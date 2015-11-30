import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import TextEditor from './../textEditor';
import Cursor from './../cursor';

export default class InsertMode extends Mode {
    private activationKeyHandler : { [ key : string] : () => vscode.Position; } = {};
    
    constructor() {
        super(ModeName.Insert);
        
        this.activationKeyHandler = {
            // insert at cursor
            "i" : () => { return Cursor.currentPosition(); },
            
            // insert at the beginning of the line            
            "I" : () => { return Cursor.lineBegin(); },
            
            // append after the cursor            
            "a" : () => { return Cursor.right(); },
            
            // append at the end of the line            
            "A" : () => { return Cursor.lineEnd(); },
            
            // open blank line below current line            
            "o" : () => { 
                vscode.commands.executeCommand("editor.action.insertLineAfter");      
                return Cursor.down();
            },
            
            // open blank line above current line           
            "O" : () => { 
                vscode.commands.executeCommand("editor.action.insertLineBefore");
                return Cursor.up();
            }             
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return key in this.activationKeyHandler;
    }
    
    HandleActivation(key : string) : void {
        var newPosition = this.activationKeyHandler[key]();
        Cursor.move(newPosition);
    }
    
    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);
        TextEditor.Insert(this.ResolveKeyValue(key));

        vscode.commands.executeCommand("editor.action.triggerSuggest");
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