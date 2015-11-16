// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';

import {showCmdLine} from './src/cmd_line/main'; 
import * as cc from './src/cmd_line/lexer'; 
import {ModeHandler} from "./src/mode/mode_handler";
import {ModeName} from "./src/mode/mode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    var modeHandler = new ModeHandler();
    
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vim" is now active!'); 

	var cmdLineDisposable = vscode.commands.registerCommand('extension.showCmdLine', () => {
		showCmdLine();
	});	
    
    vscode.commands.registerCommand('extension.vimMode_esc', () => modeHandler.HandleKeyEvent("esc"));
    vscode.commands.registerCommand('extension.vimMode_h', () => modeHandler.HandleKeyEvent("h"));
    vscode.commands.registerCommand('extension.vimMode_j', () => modeHandler.HandleKeyEvent("j"));
	vscode.commands.registerCommand('extension.vimMode_k', () => modeHandler.HandleKeyEvent("k"));
    vscode.commands.registerCommand('extension.vimMode_l', () => modeHandler.HandleKeyEvent("l"));
    
	context.subscriptions.push(cmdLineDisposable);
}