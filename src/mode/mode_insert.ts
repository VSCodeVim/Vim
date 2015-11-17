import * as baseMode from './mode';
import * as vscode from 'vscode';

export default class InsertMode extends baseMode.Mode {
    constructor() {
        super(baseMode.ModeName.Normal);
    }
    
    HandleKeyEvent(key:string) : void {
        this._keyHistory.push(key);
    }
}