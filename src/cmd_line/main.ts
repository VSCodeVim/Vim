import * as vscode from "vscode";
import * as parser from "./parser";
import * as util from "../util";

// Shows the vim command line.
export function showCmdLine(initialText = "") {
    const options : vscode.InputBoxOptions = {
        prompt: "Vim command line",
        value: initialText
    };
    vscode.window.showInputBox(options).then(
        runCmdLine,
        vscode.window.showErrorMessage
    );
}

function runCmdLine(s : string) : void {
    try {
        var cmd = parser.parse(s);
    } catch (e) {
        util.showInfo(e);
        return;
    }

    if (cmd.isEmpty) {
        vscode.window.showInformationMessage("empty cmdline");
    } else {
        cmd.runOn(vscode.window.activeTextEditor);
    }
}
