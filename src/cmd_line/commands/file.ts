"use strict";

import * as vscode from "vscode";
import * as path from "path";
import * as node from "../node";

export enum FilePosition {
    CurrentWindow,
    NewWindow
}

export interface IFileCommandArguments extends node.ICommandArgs {
    name?: string;
    position?: FilePosition;
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

    getViewColumn(sideBySide: boolean) : vscode.ViewColumn {
        const active = vscode.window.activeTextEditor;
        if (!active) {
            return vscode.ViewColumn.One;
        }

        if (!sideBySide) {
            return active.viewColumn;
        }

        switch (active.viewColumn) {
            case vscode.ViewColumn.One:
                return vscode.ViewColumn.Two;
            case vscode.ViewColumn.Two:
                return vscode.ViewColumn.Three;
        }

        return active.viewColumn;
    }

    execute(): void {
        if (!this._arguments.name) {
            // Open an empty file
            if (this._arguments.position === FilePosition.CurrentWindow) {
                vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
            }

            vscode.commands.executeCommand("workbench.action.splitEditor").then(() => {
                vscode.commands.executeCommand("workbench.action.files.newUntitledFile").then(() => {
                    vscode.commands.executeCommand("workbench.action.closeOtherEditors");
                });
            });

            return;
        }

        let currentFilePath = vscode.window.activeTextEditor.document.uri.path;
        let newFilePath = path.join(path.dirname(currentFilePath), this._arguments.name);

        if (newFilePath !== currentFilePath) {
            let folder = vscode.Uri.file(newFilePath);
            vscode.commands.executeCommand("vscode.open", folder, this.getViewColumn(this._arguments.position === FilePosition.NewWindow));
        }
    }
}