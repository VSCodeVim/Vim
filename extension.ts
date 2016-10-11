'use strict';

/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */

import * as vscode from 'vscode';
import * as _ from "lodash";
import { showCmdLine } from './src/cmd_line/main';
import { ModeHandler } from './src/mode/modeHandler';
import { taskQueue } from './src/taskQueue';
import { Position } from './src/motion/position';
import { Globals } from './src/globals';
import { AngleBracketNotation } from './src/notation';
import { ModeName } from './src/mode/mode';

interface VSCodeKeybinding {
  key: string;
  mac?: string;
  linux?: string;
  command: string;
  when: string;
}

const packagejson: {
  contributes: {
    keybindings: VSCodeKeybinding[];
  }
} = require('../package.json'); // out/../package.json

export class EditorIdentity {
  private _fileName: string;
  private _viewColumn: vscode.ViewColumn;

  constructor(textEditor?: vscode.TextEditor) {
    this._fileName = textEditor && textEditor.document.fileName || "";
    this._viewColumn = textEditor && textEditor.viewColumn || vscode.ViewColumn.One;
  }

  get fileName() {
    return this._fileName;
  }

  get viewColumn() {
    return this._viewColumn;
  }

  public hasSameBuffer(identity: EditorIdentity): boolean {
    return this.fileName === identity.fileName;
  }

  public isEqual(identity: EditorIdentity): boolean {
    return this.fileName === identity.fileName && this.viewColumn === identity.viewColumn;
  }

  public toString() {
    return this.fileName + this.viewColumn;
  }
}

let extensionContext: vscode.ExtensionContext;

/**
 * Note: We can't initialize modeHandler here, or even inside activate(), because some people
 * see a bug where VSC hasn't fully initialized yet, which pretty much breaks VSCodeVim entirely.
 */
let modeHandlerToEditorIdentity: { [key: string]: ModeHandler } = {};
let previousActiveEditorId: EditorIdentity = new EditorIdentity();

export async function getAndUpdateModeHandler(): Promise<ModeHandler> {
  const oldHandler = modeHandlerToEditorIdentity[previousActiveEditorId.toString()];
  const activeEditorId = new EditorIdentity(vscode.window.activeTextEditor);

  if (!modeHandlerToEditorIdentity[activeEditorId.toString()]) {
    const newModeHandler = new ModeHandler(activeEditorId.fileName);

    modeHandlerToEditorIdentity[activeEditorId.toString()] = newModeHandler;
    extensionContext.subscriptions.push(newModeHandler);
  }

  const handler = modeHandlerToEditorIdentity[activeEditorId.toString()];

  if (previousActiveEditorId.hasSameBuffer(activeEditorId)) {
    if (!previousActiveEditorId.isEqual(activeEditorId)) {
      // We have opened two editors, working on the same file.
      previousActiveEditorId = activeEditorId;

      handler.vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.end);
      handler.vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    }
  } else {
    previousActiveEditorId = activeEditorId;

    await handler.updateView(handler.vimState);
  }

  if (oldHandler && oldHandler.vimState.focusChanged) {
    oldHandler.vimState.focusChanged = false;
    handler.vimState.focusChanged = true;
  }

  return handler;
}

class CompositionState {
  public isInComposition: boolean = false;
  public composingText: string = "";
}

export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  let compositionState = new CompositionState();

  vscode.window.onDidChangeActiveTextEditor(handleActiveEditorChange, this);

  vscode.workspace.onDidChangeTextDocument((event) => {
    /**
     * Change from vscode editor should set document.isDirty to true but they initially don't!
     * There is a timing issue in vscode codebase between when the isDirty flag is set and
     * when registered callbacks are fired. https://github.com/Microsoft/vscode/issues/11339
     */

    let contentChangeHandler = (modeHandler: ModeHandler) => {
      if (modeHandler.vimState.currentMode === ModeName.Insert) {
        if (modeHandler.vimState.historyTracker.currentContentChanges === undefined) {
          modeHandler.vimState.historyTracker.currentContentChanges = [];
        }

        modeHandler.vimState.historyTracker.currentContentChanges =
          modeHandler.vimState.historyTracker.currentContentChanges.concat(event.contentChanges);
      }
    }

    if (Globals.isTesting) {
      contentChangeHandler(Globals.modeHandlerForTesting as ModeHandler);
    } else {
      _.filter(modeHandlerToEditorIdentity, modeHandler => modeHandler.fileName === event.document.fileName)
        .forEach(modeHandler => {
          contentChangeHandler(modeHandler);
        });
    }

    setTimeout(() => {
      if (!event.document.isDirty && !event.document.isUntitled) {
        handleContentChangedFromDisk(event.document);
      }
    }, 0);
  });

  vscode.workspace.onDidCloseTextDocument((event) => {
    // Remove modehandler for closed document
    delete modeHandlerToEditorIdentity[event.fileName + vscode.window.activeTextEditor.viewColumn];
  });

  registerCommand(context, 'type', async (args) => {
    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();

        if (compositionState.isInComposition) {
          compositionState.composingText += args.text;
        } else {
          await mh.handleKeyEvent(args.text);
        }
      },
      isRunning: false
    });
  });

  registerCommand(context, 'replacePreviousChar', async (args) => {
    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();

        if (compositionState.isInComposition) {
          compositionState.composingText = compositionState.composingText.substr(0, compositionState.composingText.length - args.replaceCharCnt) + args.text;
        } else {
          await vscode.commands.executeCommand('default:replacePreviousChar', {
            text: args.text,
            replaceCharCnt: args.replaceCharCnt
          });
          mh.vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
          mh.vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
        }
      },
      isRunning: false
    });
  });

  registerCommand(context, 'compositionStart', async (args) => {
    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();
        compositionState.isInComposition = true;
      },
      isRunning: false
    });
  });

  registerCommand(context, 'compositionEnd', async (args) => {
    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();
        let text = compositionState.composingText;
        compositionState = new CompositionState();
        await mh.handleMultipleKeyEvents(text.split(""));
      },
      isRunning: false
    });
  });

  registerCommand(context, 'extension.showCmdLine', () => {
    showCmdLine("", modeHandlerToEditorIdentity[new EditorIdentity(vscode.window.activeTextEditor).toString()]);
  });

  for (let keybinding of packagejson.contributes.keybindings) {
    let keyToBeBound = "";

    /**
     * On OSX, handle mac keybindings if we specified one.
     */
    if (process.platform === "darwin") {
      keyToBeBound = keybinding.mac || keybinding.key;
    } else if (process.platform === "linux") {
      keyToBeBound = keybinding.linux || keybinding.key;
    } else {
      keyToBeBound = keybinding.key;
    }

    let bracketedKey = AngleBracketNotation.Normalize(keyToBeBound);

    registerCommand(context, keybinding.command, () => handleKeyEvent(`${ bracketedKey }`));
  }

  // Initialize mode handler for current active Text Editor at startup.
  if (vscode.window.activeTextEditor) {
    let mh = await getAndUpdateModeHandler();
    mh.updateView(mh.vimState, false);
  }
}

function registerCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => any) {
  let disposable = vscode.commands.registerCommand(command, async (args) => {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    if (vscode.window.activeTextEditor.document && vscode.window.activeTextEditor.document.uri.toString() === "debug:input") {
      await vscode.commands.executeCommand("default:" + command, args);
      return;
    }

    callback(args);
  });
  context.subscriptions.push(disposable);
}

async function handleKeyEvent(key: string): Promise<void> {
  const mh = await getAndUpdateModeHandler();

  taskQueue.enqueueTask({
    promise   : async () => { await mh.handleKeyEvent(key); },
    isRunning : false
  });
}

function handleContentChangedFromDisk(document : vscode.TextDocument) : void {
  _.filter(modeHandlerToEditorIdentity, modeHandler => modeHandler.fileName === document.fileName)
    .forEach(modeHandler => {
      modeHandler.vimState.historyTracker.clear();
    });
}

async function handleActiveEditorChange(): Promise<void> {

  // Don't run this event handler during testing
  if (Globals.isTesting) {
    return;
  }

  taskQueue.enqueueTask({
    promise: async () => {
      if (vscode.window.activeTextEditor !== undefined) {
        const mh = await getAndUpdateModeHandler();

        mh.updateView(mh.vimState, false);
      }
    },
    isRunning: false
  });
}

process.on('unhandledRejection', function(reason: any, p: any) {
  console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
