"use strict";

import * as vscode from "vscode";
import * as parser from "./parser";
import * as util from "../util";

// Shows the vim command line.
export async function showCmdLine(initialText: string): Promise<{}> {
    if (!vscode.window.activeTextEditor) {
        console.log("No active document.");
        return;
    }

    const options : vscode.InputBoxOptions = {
        prompt: "Vim command line",
        value: initialText
    };

    try {
        runCmdLine(await vscode.window.showInputBox(options));
    } catch (e) {
        return util.showError(e.toString());
    }
}

function runCmdLine(command : string) : Promise<{}> {
    if (!command || command.length === 0) {
        return;
    }

    try {
        var cmd = parser.parse(command);
        if (cmd.isEmpty) {
            return;
        }

        cmd.execute(vscode.window.activeTextEditor);
    } catch (e) {
        return util.showError(e);
    }
}
