import * as vscode from "vscode";
import * as parser from "./parser";
import * as util from "../util";
import {Mode, ModeName} from "../mode/mode";
import {Mappings} from "../mapping/main";

// Shows the vim command line.
function showCmdLine(initialText = "", mappings : Mappings = null) {
	const options : vscode.InputBoxOptions = {
		prompt: "Vim command line",
		value: initialText
	};
	vscode.window.showInputBox(options).then(
		(s) => runCmdLine(s, mappings),
		vscode.window.showErrorMessage
	);
}

function runCmdLine(s : string, mappings : Mappings) : void {
	try {
		var cmd = parser.parse(s);
	} catch (e) {
		util.showError(e);
		return;
	}

	if (cmd.isEmpty) {
		vscode.window.showInformationMessage("empty cmdline");
	} else {
		// FIXME: solve this better.
		if (cmd.command.name === 'map') {
			cmd.runOn(vscode.window.activeTextEditor, mappings);
		} else {
			cmd.runOn(vscode.window.activeTextEditor);
		}
	}
}

export class CommandLineMode extends Mode {
	private mappings : Mappings;
	
	HandleActivation(key : string) {
		showCmdLine(null, this.mappings);
	}
	
	constructor(mappings : Mappings) {
		super(ModeName.CommandLine);
		this.mappings = mappings;
	}
	
	ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
		return key === ':' && currentMode !== ModeName.Insert; 
	}
	
	HandleKeyEvent(key : string) : void {
		this.keyHistory.push(key);
		
		// do nothing
	}
}
