import * as vscode from "vscode";
import * as token from "./token";
import * as node from "./node";
import * as lexer from "./lexer";
import * as util from "../util";

export class WriteCommand implements node.CommandBase {
    name : string;
    shortName : string;
    args : Object;

    constructor(args : Object = null) {
        // TODO: implement other arguments.
        this.name = "write";
        this.shortName = "w";
        this.args = args;
    }

    runOn(textEditor : vscode.TextEditor) : void {
        if (this.args || !textEditor.document.fileName) {
            util.showInfo("Not implemented.");
            return;
        }
        textEditor.document.save();
    }
}
