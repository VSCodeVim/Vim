import * as baseMode from './mode';
import * as vscode from 'vscode';

export class CommandMode extends baseMode.Mode {
    _keyHistory: string[];

    constructor(isActive?: boolean) {
        super(baseMode.ModeName.Normal, isActive);
        
        this._keyHistory = [];
    }
    
    HandleKeyEvent(key:string) : void {
        this._keyHistory.push(key);
        
        switch(key) {
            case 'h':
                vscode.commands.executeCommand("cursorLeft");
                break;
            case 'j':
                vscode.commands.executeCommand("cursorDown");
                break;
            case 'k':
                vscode.commands.executeCommand("cursorUp");
                break;
            case 'l':
                vscode.commands.executeCommand("cursorRight");
                break;
        }
    }
}