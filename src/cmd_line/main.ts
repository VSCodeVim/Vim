"use strict";

import * as vscode from "vscode";
import * as parser from "./parser";
import * as util from "../util";

// Shows the vim command line.
export async function showCmdLine(initialText: string): Promise<{}> {
    if (!vscode.window.activeTextEditor) {
        return util.showInfo("No active document.");
    }

    const options : vscode.InputBoxOptions = {
        prompt: "Vim command line",
        value: initialText
    };

    try {
        runCmdLine(await vscode.window.showInputBox(options));
    } catch (e) {
        vscode.window.showErrorMessage(e.toString());

        return;
    }
}

function runCmdLine(s : string) : void {
    if (!(s && s.trim())) {
        return;
    }

    try {
        var cmd = parser.parse(s);
    } catch (e) {
        util.showError(e);
        return;
    }

    if (cmd.isEmpty) {
        return;
    }

    try {
        cmd.execute(vscode.window.activeTextEditor);
    } catch (e) {
        try {
            e.display();
            return;
        } catch (ee) {
            // ignore
        }

        util.showError(e);
    }
}
