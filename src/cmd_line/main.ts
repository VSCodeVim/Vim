import * as vscode from "vscode";
import * as parser from "./parser";
import * as util from "../util";

// Shows the vim command line.
export function showCmdLine(initialText = "") {
	if (!vscode.window.activeTextEditor) {
		util.showInfo("No active document.");
		return;
	}
	
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
