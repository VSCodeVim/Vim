"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as error from "../../error";
import {ModeHandler} from "../../mode/modeHandler";

//
// Implements :writequit
// http://vimdoc.sourceforge.net/htmldoc/editing.html#write-quit
//
export interface IWriteQuitCommandArguments extends node.ICommandArgs {
    // arguments
    // [++opt]
    opt? : string;
    optValue? : string;
    // wq! [++opt]
    bang? : boolean;
    // wq [++opt] {file}
    file? : string;
    // wq! [++opt] {file}
    // [range]wq[!] [++opt] [file]
    range?: node.LineRange;
}

export class WriteQuitCommand extends node.CommandBase {
    protected _arguments : IWriteQuitCommandArguments;

    constructor(args : IWriteQuitCommandArguments) {
        super();
        this._name = "writequit";
        this._shortName = "wq";
        this._arguments = args;
    }

    get arguments() : IWriteQuitCommandArguments {
        return this._arguments;
    }

    // Writing command. Taken as a basis from the "write.ts" file.
    execute(modeHandler : ModeHandler) : void {
        var filename : RegExp = new RegExp("Untitled-[0-9]*");
        if (!this.activeTextEditor.document.isDirty) {
            if (filename.test(this.activeTextEditor.document.fileName)) {
                vscode.commands.executeCommand("workbench.action.files.saveAs");
            } else {
                vscode.commands.executeCommand("workbench.action.files.save");
            }
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        } else {
            throw error.VimError.fromCode(error.ErrorCode.E208);
        }
    }
}