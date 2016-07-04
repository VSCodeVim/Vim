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
        let oriPath = vscode.window.activeTextEditor.document.uri.path;
        let newPath = path.join(path.dirname(oriPath), this._arguments.name);
        let folder = vscode.Uri.file(newPath);
        vscode.commands.executeCommand("vscode.openFolder", folder);
    }
}