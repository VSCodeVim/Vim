//import * as vscode from 'vscode';
import {commands, window, workspace, ExtensionContext, TextEditorOptions, TextEditor, TextDocument, Disposable} from 'vscode';
import {Mode, ModeName} from './mode';
import {CommandMode} from './mode_command';

export class ModeHandler {    
	private _modes: Mode[];

	constructor() {
        this._modes = [
            new CommandMode(true),
        ];
        
	}
    
    get CurrentMode(): Mode {
        var currentMode = this._modes.find((mode, index) => {
            return mode.IsActive;
        });
        
        return currentMode;
    }
    
    SetCurrentModeByName(modeName:ModeName) {
        this._modes.forEach(mode => {
            mode.IsActive = (mode.Name == modeName);
        });
    }
    
    HandleKeyEvent(key:string) : void {
        if (key == "esc") {
            
        }
        this.CurrentMode.HandleKeyEvent(key);        
    }
}