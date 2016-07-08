"use strict";

import * as vscode from "vscode";
import * as parser from "./parser";
import {ModeHandler} from "../mode/modeHandler";

// Shows the vim command line.
export async function showCmdLine(initialText: string, modeHandler : ModeHandler): Promise<{}> {
    if (!vscode.window.activeTextEditor) {
        console.log("No active document.");
        return;
    }

    const options : vscode.InputBoxOptions = {
        prompt: "Vim command line",
        value: initialText
    };

    try {
        await runCmdLine(await vscode.window.showInputBox(options), modeHandler);
    } catch (e) {
        modeHandler.setupStatusBarItem(e.toString());
    }
}

export async function runCmdLine(command : string, modeHandler : ModeHandler) : Promise<{}> {
    if (!command || command.length === 0) {
        return;
    }

    try {
        var cmd = parser.parse(command);
        if (cmd.isEmpty) {
            return;
        }

        await cmd.execute(vscode.window.activeTextEditor, modeHandler);
    } catch (e) {
        modeHandler.setupStatusBarItem(e.toString());
    }
}
