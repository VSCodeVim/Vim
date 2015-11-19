import {ModeName, Mode} from './mode';
import * as vscode from 'vscode';

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
            "a" : (position) => { return position; },
            
            // append at the end of the line            
            "A" : (position) => { return position; },
            
            // open blank line below current line            
            "o" : (position) => { return position; },
            
            // open blank line above current line           
            "O" : (position) => { return position; }             
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return key in this.activationKeyHandler;
    }
    
    HandleActivation(key : string) : void {
        console.log(key);
        const editor = vscode.window.activeTextEditor;
        const currentPosition = editor.selection.active;
        
        var newPosition = this.activationKeyHandler[key](currentPosition);
        var newSelection = new vscode.Selection(newPosition, newPosition);

        editor.selection = newSelection;
    }
    
    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);
        
        const editor = vscode.window.activeTextEditor;
        const position = editor.selection.active;
            
        editor.edit(t => {
            t.insert(position, this.Translate(key));
        });
    }
    
    private Translate(raw : string) : string {
        switch (raw) {
            case 'space':
                return ' ';
            default:
                return raw;
        }
    }
}