/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */
import './src/actions/include-all';

import * as _ from 'lodash';
import * as vscode from 'vscode';

import { CommandLine } from './src/cmd_line/commandLine';
import { Position } from './src/common/motion/position';
import { configuration } from './src/configuration/configuration';
import { EditorIdentity } from './src/editorIdentity';
import { Globals } from './src/globals';
import { ModeName } from './src/mode/mode';
import { ModeHandler } from './src/mode/modeHandler';
import { Neovim } from './src/neovim/neovim';
import { Notation } from './src/configuration/notation';
import { StatusBar } from './src/statusBar';
import { taskQueue } from './src/taskQueue';
import { ModeHandlerMap } from './src/mode/modeHandlerMap';

let extensionContext: vscode.ExtensionContext;

/**
 * Note: We can't initialize modeHandler here, or even inside activate(), because some people
 * see a bug where VSC hasn't fully initialized yet, which pretty much breaks VSCodeVim entirely.
 */
let previousActiveEditorId: EditorIdentity = new EditorIdentity();

export async function getAndUpdateModeHandler(): Promise<ModeHandler> {
  const [prevHandler] = await ModeHandlerMap.getOrCreate(previousActiveEditorId.toString());
  const activeEditorId = new EditorIdentity(vscode.window.activeTextEditor);

  let [curHandler, isNewModeHandler] = await ModeHandlerMap.getOrCreate(activeEditorId.toString());
  if (isNewModeHandler) {
    if (configuration.enableNeovim) {
      let neovim = new Neovim();
      await neovim.initialize();

      curHandler.vimState.nvim = neovim;
    }
    extensionContext.subscriptions.push(curHandler);
  }

  curHandler.vimState.editor = vscode.window.activeTextEditor!;
  if (!prevHandler || curHandler.vimState.identity !== prevHandler.vimState.identity) {
    setTimeout(() => {
      curHandler.syncCursors();
    }, 0);
  }

  if (previousActiveEditorId.hasSameBuffer(activeEditorId)) {
    if (!previousActiveEditorId.isEqual(activeEditorId)) {
      // We have opened two editors, working on the same file.
      previousActiveEditorId = activeEditorId;
    }
  } else {
    previousActiveEditorId = activeEditorId;
    await curHandler.updateView(curHandler.vimState, { drawSelection: false, revealRange: false });
  }

  if (prevHandler && curHandler.vimState.focusChanged) {
    curHandler.vimState.focusChanged = false;
    prevHandler.vimState.focusChanged = true;
  }

  // Temporary workaround for vscode bug not changing cursor style properly
  // https://github.com/Microsoft/vscode/issues/17472
  // https://github.com/Microsoft/vscode/issues/17513
  if (curHandler.vimState.editor) {
    const desiredStyle = curHandler.vimState.editor.options.cursorStyle;

    // Temporarily change to any other cursor style besides the desired type, then change back
    let tempStyle = (desiredStyle || vscode.TextEditorCursorStyle.Line) % 6 + 1;
    curHandler.vimState.editor.options.cursorStyle = tempStyle;
    curHandler.vimState.editor.options.cursorStyle = desiredStyle;
  }

  return curHandler;
}

class CompositionState {
  isInComposition: boolean = false;
  composingText: string = '';

  reset() {
    this.isInComposition = false;
    this.composingText = '';
  }
}

export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  let compositionState = new CompositionState();

  // Event to update active configuration items when changed without restarting vscode
  vscode.workspace.onDidChangeConfiguration(() => {
    configuration.reload();
  });

  vscode.window.onDidChangeActiveTextEditor(handleActiveEditorChange, this);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (configuration.disableExt) {
      return;
    }

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

        modeHandler.vimState.historyTracker.currentContentChanges = modeHandler.vimState.historyTracker.currentContentChanges.concat(
          event.contentChanges
        );
      }
    };

    if (Globals.isTesting) {
      contentChangeHandler(Globals.mockModeHandler as ModeHandler);
    } else {
      _.filter(
        ModeHandlerMap.getAll(),
        modeHandler => modeHandler.vimState.identity.fileName === event.document.fileName
      ).forEach(modeHandler => {
        contentChangeHandler(modeHandler);
      });
    }
    setTimeout(() => {
      if (!event.document.isDirty && !event.document.isUntitled && event.contentChanges.length) {
        handleContentChangedFromDisk(event.document);
      }
    }, 0);
  });

  overrideCommand(context, 'type', async args => {
    taskQueue.enqueueTask(async () => {
      const mh = await getAndUpdateModeHandler();

      if (compositionState.isInComposition) {
        compositionState.composingText += args.text;
      } else {
        await mh.handleKeyEvent(args.text);
      }
    });
  });

  overrideCommand(context, 'replacePreviousChar', async args => {
    taskQueue.enqueueTask(async () => {
      const mh = await getAndUpdateModeHandler();

      if (compositionState.isInComposition) {
        compositionState.composingText =
          compositionState.composingText.substr(
            0,
            compositionState.composingText.length - args.replaceCharCnt
          ) + args.text;
      } else {
        await vscode.commands.executeCommand('default:replacePreviousChar', {
          text: args.text,
          replaceCharCnt: args.replaceCharCnt,
        });
        mh.vimState.cursorPosition = Position.FromVSCodePosition(
          mh.vimState.editor.selection.start
        );
        mh.vimState.cursorStartPosition = Position.FromVSCodePosition(
          mh.vimState.editor.selection.start
        );
      }
    });
  });

  overrideCommand(context, 'compositionStart', async args => {
    taskQueue.enqueueTask(async () => {
      compositionState.isInComposition = true;
    });
  });

  overrideCommand(context, 'compositionEnd', async args => {
    taskQueue.enqueueTask(async () => {
      const mh = await getAndUpdateModeHandler();
      let text = compositionState.composingText;
      compositionState.reset();
      await mh.handleMultipleKeyEvents(text.split(''));
    });
  });

  registerCommand(context, 'extension.showCmdLine', async () => {
    let [modeHandler] = await ModeHandlerMap.getOrCreate(
      new EditorIdentity(vscode.window.activeTextEditor).toString()
    );
    CommandLine.PromptAndRun('', modeHandler.vimState);
    modeHandler.updateView(modeHandler.vimState);
  });

  interface ICodeKeybinding {
    after?: string[];
    commands?: { command: string; args: any[] }[];
  }

  registerCommand(context, 'vim.remap', async (args: ICodeKeybinding) => {
    taskQueue.enqueueTask(async () => {
      const mh = await getAndUpdateModeHandler();
      if (args.after) {
        for (const key of args.after) {
          await mh.handleKeyEvent(Notation.NormalizeKey(key, configuration.leader));
        }
        return;
      }

      if (args.commands) {
        for (const command of args.commands) {
          // Check if this is a vim command by looking for :
          if (command.command.slice(0, 1) === ':') {
            await CommandLine.Run(command.command.slice(1, command.command.length), mh.vimState);
            await mh.updateView(mh.vimState);
          } else {
            await vscode.commands.executeCommand(command.command, command.args);
          }
        }
      }
    });
  });

  vscode.workspace.onDidCloseTextDocument(async event => {
    const documents = vscode.workspace.textDocuments;

    // Delete modehandler if vscode knows NOTHING about this document. This does
    // not handle the case of the same file open twice. This only handles the
    // case of deleting a modehandler once all tabs of this document have been
    // closed
    for (let editorIdentity of ModeHandlerMap.getKeys()) {
      let [modeHandler] = await ModeHandlerMap.getOrCreate(editorIdentity);
      const editor = modeHandler.vimState.editor;
      if (editor === undefined || documents.indexOf(editor.document) === -1) {
        ModeHandlerMap.delete(editorIdentity);
      }
    }
  });

  /**
   * Toggles the VSCodeVim extension between Enabled mode and Disabled mode. This
   * function is activated by calling the 'toggleVim' command from the Command Palette.
   *
   * @param isDisabled if true, sets VSCodeVim to Disabled mode; else sets to enabled mode
   */
  async function toggleExtension(isDisabled: boolean) {
    await vscode.commands.executeCommand('setContext', 'vim.active', !isDisabled);
    let mh = await getAndUpdateModeHandler();
    if (isDisabled) {
      await mh.handleKeyEvent('<ExtensionDisable>');
      compositionState.reset();
      ModeHandlerMap.clear();
    } else {
      await mh.handleKeyEvent('<ExtensionEnable>');
    }
  }

  registerCommand(context, 'toggleVim', async () => {
    configuration.disableExt = !configuration.disableExt;
    toggleExtension(configuration.disableExt);
  });

  for (const boundKey of configuration.boundKeyCombinations) {
    registerCommand(context, boundKey.command, () => handleKeyEvent(`${boundKey.key}`));
  }

  // Initialize mode handler for current active Text Editor at startup.
  if (vscode.window.activeTextEditor) {
    let mh = await getAndUpdateModeHandler();
    mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
  }

  // This is called last because getAndUpdateModeHandler() will change cursor
  toggleExtension(configuration.disableExt);
}

function overrideCommand(
  context: vscode.ExtensionContext,
  command: string,
  callback: (...args: any[]) => any
) {
  const disposable = vscode.commands.registerCommand(command, async args => {
    if (configuration.disableExt) {
      await vscode.commands.executeCommand('default:' + command, args);
      return;
    }

    if (!vscode.window.activeTextEditor) {
      return;
    }

    if (
      vscode.window.activeTextEditor.document &&
      vscode.window.activeTextEditor.document.uri.toString() === 'debug:input'
    ) {
      await vscode.commands.executeCommand('default:' + command, args);
      return;
    }

    callback(args);
  });
  context.subscriptions.push(disposable);
}

function registerCommand(
  context: vscode.ExtensionContext,
  command: string,
  callback: (...args: any[]) => any
) {
  let disposable = vscode.commands.registerCommand(command, async args => {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    callback(args);
  });
  context.subscriptions.push(disposable);
}

async function handleKeyEvent(key: string): Promise<void> {
  const mh = await getAndUpdateModeHandler();

  taskQueue.enqueueTask(async () => {
    await mh.handleKeyEvent(key);
  });
}

function handleContentChangedFromDisk(document: vscode.TextDocument): void {
  _.filter(
    ModeHandlerMap.getAll(),
    modeHandler => modeHandler.vimState.identity.fileName === document.fileName
  ).forEach(modeHandler => {
    modeHandler.vimState.historyTracker.clear();
  });
}

async function handleActiveEditorChange(): Promise<void> {
  if (configuration.disableExt) {
    return;
  }

  // Don't run this event handler during testing
  if (Globals.isTesting) {
    return;
  }

  taskQueue.enqueueTask(async () => {
    if (vscode.window.activeTextEditor !== undefined) {
      const mh = await getAndUpdateModeHandler();

      mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
    }
  });
}

process.on('unhandledRejection', function(reason: any, p: any) {
  console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});
