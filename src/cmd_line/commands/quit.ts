"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as error from '../../error';

export interface IQuitCommandArguments extends node.ICommandArgs {
    bang?: boolean;
    range?: node.LineRange;
}

//
//  Implements :quit
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
export class QuitCommand extends node.CommandBase {
    protected _arguments : IQuitCommandArguments;

    constructor(args : IQuitCommandArguments) {
        super();
        this._name = 'quit';
        this._shortName = 'q';
        this._arguments = args;
    }

    get arguments() : IQuitCommandArguments {
        return this._arguments;
    }

    execute() : void {
        this.quit();
    }

    private quit() {
        // See https://github.com/Microsoft/vscode/issues/723
        if ((this.activeTextEditor.document.isDirty || this.activeTextEditor.document.isUntitled)
            && !this.arguments.bang) {
                throw error.VimError.fromCode(error.ErrorCode.E37);
        }

        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    };
}
