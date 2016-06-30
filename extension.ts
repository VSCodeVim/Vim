'use strict';

/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */

import * as vscode from 'vscode';
import { showCmdLine } from './src/cmd_line/main';
import { ModeHandler } from './src/mode/modeHandler';
import { TaskQueue } from './src/taskQueue';

let extensionContext: vscode.ExtensionContext;

/**
 * Note: We can't initialize modeHandler here, or even inside activate(), because some people
 * see a bug where VSC hasn't fully initialized yet, which pretty much breaks VSCodeVim entirely.
 */
let modeHandler: ModeHandler;

let taskQueue: TaskQueue;

function setup() {
    modeHandler = new ModeHandler(false);
    taskQueue = new TaskQueue();

    extensionContext.subscriptions.push(modeHandler);
}

export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;

    registerCommand(context, 'type', async (args) => {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        var isHandled = await handleKeyEvent(args.text);

        if (!isHandled) {
            vscode.commands.executeCommand('default:type', {
                text: args.text
            });
        }
    });

    registerCommand(context, 'extension.vim_esc', () => handleKeyEvent("<esc>"));
    registerCommand(context, 'extension.vim_backspace', () => handleKeyEvent("<backspace>"));
    registerCommand(context, 'extension.vim_switchWindow', () => handleKeyEvent("ctrl+w"));

    registerCommand(context, 'extension.showCmdLine', () => {
        if (!modeHandler) {
            setup();
        }

        showCmdLine("", modeHandler);
    });

    'rfb'.split('').forEach(key => {
        registerCommand(context, `extension.vim_ctrl+${key}`, () => handleKeyEvent(`ctrl+${key}`));
    });
}

function registerCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => any) {
    let disposable = vscode.commands.registerCommand(command, callback);
    context.subscriptions.push(disposable);
}

async function handleKeyEvent(key: string): Promise<Boolean> {
    if (!modeHandler) {
        setup();
    }

    taskQueue.enqueueTask({
        promise   : async () => { await modeHandler.handleKeyEvent(key); },
        isRunning : false
    });

    return true;
}

process.on('unhandledRejection', function(reason: any, p: any) {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});