// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';

import {showCmdLine} from './src/cmd_line/main'; 
import * as cc from './src/cmd_line/lexer'; 

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vim" is now active!'); 

	var cmdLineDisposable = vscode.commands.registerCommand('extension.showCmdLine', () => {
		showCmdLine();
	});	
	
	context.subscriptions.push(cmdLineDisposable);
}