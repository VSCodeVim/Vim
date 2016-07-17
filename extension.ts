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
import { Position } from './src/motion/position';

let extensionContext: vscode.ExtensionContext;

/**
 * Note: We can't initialize modeHandler here, or even inside activate(), because some people
 * see a bug where VSC hasn't fully initialized yet, which pretty much breaks VSCodeVim entirely.
 */
let modeHandlerToFilename: { [key: string]: ModeHandler } = {};
let previousActiveFilename: string | undefined = undefined;

let taskQueue = new TaskQueue();

function activeFileName(): string {
  return vscode.window.activeTextEditor.document.fileName;
}

export async function getAndUpdateModeHandler(): Promise<ModeHandler> {
  const oldHandler = previousActiveFilename ? modeHandlerToFilename[previousActiveFilename] : undefined;

  if (!modeHandlerToFilename[activeFileName()]) {
    const newModeHandler = new ModeHandler(false, activeFileName());

    modeHandlerToFilename[activeFileName()] = newModeHandler;
    extensionContext.subscriptions.push(newModeHandler);

    console.log('make new mode handler for ', activeFileName());
  }

  const handler = modeHandlerToFilename[activeFileName()];

  if (previousActiveFilename !== activeFileName()) {
    previousActiveFilename = activeFileName();

    await handler.updateView(handler.vimState);
  }

  if (oldHandler && oldHandler.vimState.focusChanged) {
    oldHandler.vimState.focusChanged = false;
    handler.vimState.focusChanged = true;
  }

  return handler;
}

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;

  registerCommand(context, 'type', async (args) => {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();
        await mh.handleKeyEvent(args.text);
      },
      isRunning : false
    });
  });

  registerCommand(context, 'replacePreviousChar', async (args) => {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();
        await vscode.commands.executeCommand('default:replacePreviousChar', {
          text: args.text,
          replaceCharCnt: args.replaceCharCnt
        });
        mh.vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
        mh.vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
      },
      isRunning : false
    });
   });

  registerCommand(context, 'extension.vim_esc', () => handleKeyEvent("<esc>"));
  registerCommand(context, 'extension.vim_backspace', () => handleKeyEvent("<backspace>"));

  registerCommand(context, 'extension.showCmdLine', () => {
    showCmdLine("", modeHandlerToFilename[activeFileName()]);
  });

  'rfbducwv['.split('').forEach(key => {
    registerCommand(context, `extension.vim_ctrl+${key}`, () => handleKeyEvent(`ctrl+${key}`));
  });

  ['left', 'right', 'up', 'down'].forEach(key => {
    registerCommand(context, `extension.vim_${key}`, () => handleKeyEvent(`<${key}>`));
  });
}

function registerCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => any) {
  let disposable = vscode.commands.registerCommand(command, callback);
  context.subscriptions.push(disposable);
}

async function handleKeyEvent(key: string): Promise<void> {
  const mh = await getAndUpdateModeHandler();

  taskQueue.enqueueTask({
    promise   : async () => { await mh.handleKeyEvent(key); },
    isRunning : false
  });
}

process.on('unhandledRejection', function(reason: any, p: any) {
  console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
