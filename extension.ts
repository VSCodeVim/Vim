"use strict"

import * as vscode from 'vscode';
import {showCmdLine} from './src/cmd_line/main';
import * as cc from './src/cmd_line/lexer';
import {ModeHandler} from "./src/mode/modeHandler";
import {ModeName} from "./src/mode/mode";

var modeHandler : ModeHandler;
var extensionContext : vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;

    registerCommand(context, 'type', async (args) => {
		if (!vscode.window.activeTextEditor) {
			return;
		}
        
        console.log(args.text);
        
        var isHandled = await handleKeyEvent(args.text);

        if (!isHandled) {        
            vscode.commands.executeCommand('default:type', {
                text: args.text
            });
        }
    });
    
    registerCommand(context, 'extension.vim_esc', () => handleKeyEvent("esc"));
    registerCommand(context, 'extension.showCmdLine', () => {
        if (!modeHandler) {
            modeHandler = new ModeHandler();
            extensionContext.subscriptions.push(modeHandler);
        }
        showCmdLine("", modeHandler);
    });

    context.subscriptions.push(modeHandler);
}

function registerCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => any) {
    let disposable = vscode.commands.registerCommand(command, callback);
    context.subscriptions.push(disposable);
}

function handleKeyEvent(key: string) : Promise<Boolean> {
    if (!modeHandler) {
        modeHandler = new ModeHandler();
        extensionContext.subscriptions.push(modeHandler);
    }

    return modeHandler.handleKeyEvent(key);
}
