import * as vscode from 'vscode';
import * as node from './node';
import * as util from '../util';

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand implements node.CommandBase {
    name : string;
    shortName : string;
    args : Object;

    constructor(args : Object = null) {
        // TODO: implement other arguments.
        this.name = 'write';
        this.shortName = 'w';
        this.args = args;
    }

    runOn(textEditor : vscode.TextEditor) : void {
        if (this.args) {
            util.showError("Not implemented.");
            return;
        }
        textEditor.document.save();
    }
}
