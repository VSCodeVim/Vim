"use strict";

import * as vscode from "vscode";
import * as path from "path";
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

    execute(): void {
        let currentFilePath = vscode.window.activeTextEditor.document.uri.path;
        let newFilePath = path.join(path.dirname(currentFilePath), this._arguments.name);

        if (newFilePath !== currentFilePath) {
            let folder = vscode.Uri.file(newFilePath);
            vscode.commands.executeCommand("vscode.open", folder);
        }
    }
}