"use strict";

import * as vscode from "vscode";
import * as node from "../node";

export interface IFileCommandArguments extends node.ICommandArgs {
    name?: string;
}


export class FileCommand extends node.CommandBase {
    protected _arguments: IFileCommandArguments;

    constructor(args : IFileCommandArguments) {
        super();
        this._name = 'file';
        this._shortName = 'file';
        this._arguments = args;
    }

    get arguments() : IFileCommandArguments {
        return this._arguments;
    }

    execute() : void {
        if (process.platform === 'darwin') {
            vscode.commands.executeCommand("workbench.action.files.openFileFolder");
        } else {
            vscode.commands.executeCommand("workbench.actiow.files.openFile");
        }
    }
}