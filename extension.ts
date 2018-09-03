/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */
import './src/actions/include-all';

import * as _ from 'lodash';
import * as vscode from 'vscode';

import { configuration } from './src/configuration/configuration';
import { commandLine } from './src/cmd_line/commandLine';
import { Position } from './src/common/motion/position';
import { EditorIdentity } from './src/editorIdentity';
import { Globals } from './src/globals';
import { GlobalState } from './src/state/globalState';
import { Jump } from './src/jumps/jump';
import { ModeName } from './src/mode/mode';
import { ModeHandler } from './src/mode/modeHandler';
import { Notation } from './src/configuration/notation';
import { RecordedState } from './src/state/recordedState';
import { StatusBar } from './src/statusBar';
import { taskQueue } from './src/taskQueue';
import { ModeHandlerMap } from './src/mode/modeHandlerMap';
import { logger } from './src/util/logger';
import { CompositionState } from './src/state/compositionState';

const globalState = new GlobalState();
let extensionContext: vscode.ExtensionContext;
let previousActiveEditorId: EditorIdentity | null = null;

interface ICodeKeybinding {
  after?: string[];
  commands?: { command: string; args: any[] }[];
}

export async function getAndUpdateModeHandler(): Promise<ModeHandler> {
  const activeEditorId = new EditorIdentity(vscode.window.activeTextEditor);

  let [curHandler, isNew] = await ModeHandlerMap.getOrCreate(activeEditorId.toString());
  if (isNew) {
    extensionContext.subscriptions.push(curHandler);
  }

  curHandler.vimState.editor = vscode.window.activeTextEditor!;

  if (!previousActiveEditorId || !previousActiveEditorId.isEqual(activeEditorId)) {
    curHandler.syncCursors();
    await curHandler.updateView(curHandler.vimState, { drawSelection: false, revealRange: false });
  }

  previousActiveEditorId = activeEditorId;

  if (curHandler.vimState.focusChanged) {
    curHandler.vimState.focusChanged = false;

    if (previousActiveEditorId) {
      const prevHandler = ModeHandlerMap.get(previousActiveEditorId.toString());
      prevHandler!.vimState.focusChanged = true;
    }
  }

  return curHandler;
}

export async function activate(context: vscode.ExtensionContext) {
  logger.debug('Extension: activating vscodevim.');

  extensionContext = context;
  extensionContext.subscriptions.push(StatusBar);

  logger.debug('Extension: registering event handlers.');

  // workspace events
  vscode.workspace.onDidChangeConfiguration(() => {
    logger.debug('onDidChangeConfiguration: reloading configuration');
    configuration.reload();
  });

  vscode.workspace.onDidChangeTextDocument(async event => {
    if (configuration.disableExt) {
      return;
    }

    if (
      event.contentChanges.length === 1 &&
      event.contentChanges[0].text === '' &&
      event.contentChanges[0].range.start.line !== event.contentChanges[0].range.end.line
    ) {
      globalState.jumpTracker.handleTextDeleted(event.document, event.contentChanges[0].range);
    } else if (
      event.contentChanges.length === 1 &&
      (event.contentChanges[0].text === '\n' || event.contentChanges[0].text === '\r\n') &&
      event.contentChanges[0].range.start.line === event.contentChanges[0].range.end.line
    ) {
      globalState.jumpTracker.handleTextAdded(
        event.document,
        event.contentChanges[0].range,
        event.contentChanges[0].text
      );
    }

    // Change from vscode editor should set document.isDirty to true but they initially don't!
    // There is a timing issue in vscode codebase between when the isDirty flag is set and
    // when registered callbacks are fired. https://github.com/Microsoft/vscode/issues/11339
    let contentChangeHandler = (modeHandler: ModeHandler) => {
      if (!modeHandler) {
        // This can happen in tests if you don't set Globals.mockModeHandler;
        console.warn('No mode handler found');
        return;
      }
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

  vscode.workspace.onDidCloseTextDocument(async event => {
    const documents = vscode.workspace.textDocuments;

    // Delete modehandler once all tabs of this document have been closed
    for (let editorIdentity of ModeHandlerMap.getKeys()) {
      let modeHandler = await ModeHandlerMap.get(editorIdentity);

      if (
        modeHandler == null ||
        modeHandler.vimState.editor === undefined ||
        documents.indexOf(modeHandler.vimState.editor.document) === -1
      ) {
        ModeHandlerMap.delete(editorIdentity);
      }
    }
  });

  const recordFileJump = (fromHandler: ModeHandler | null, toHandler: ModeHandler) => {
    const from = fromHandler
      ? new Jump({
          editor: fromHandler.vimState.editor,
          fileName: fromHandler.vimState.editor.document.fileName,
          position: fromHandler.vimState.cursorPosition,
        })
      : null;
    const to = new Jump({
      editor: toHandler.vimState.editor,
      fileName: toHandler.vimState.editor.document.fileName,
      position: toHandler.vimState.cursorPosition,
    });

    globalState.jumpTracker.recordFileJump(from, to);
  };

  // window events
  vscode.window.onDidChangeActiveTextEditor(async () => {
    if (configuration.disableExt) {
      return;
    }

    if (Globals.isTesting) {
      return;
    }

    taskQueue.enqueueTask(async () => {
      if (vscode.window.activeTextEditor !== undefined) {
        const prevHandler = previousActiveEditorId
          ? ModeHandlerMap.get(previousActiveEditorId.toString())
          : null;

        const mh = await getAndUpdateModeHandler();

        await mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
        recordFileJump(prevHandler, mh);
      }
    });
  });

  let compositionState = new CompositionState();

  // override vscode commands
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

  overrideCommand(context, 'compositionStart', async () => {
    taskQueue.enqueueTask(async () => {
      compositionState.isInComposition = true;
    });
  });

  overrideCommand(context, 'compositionEnd', async () => {
    taskQueue.enqueueTask(async () => {
      const mh = await getAndUpdateModeHandler();
      let text = compositionState.composingText;
      compositionState.reset();
      await mh.handleMultipleKeyEvents(text.split(''));
    });
  });

  // register extension commands
  registerCommand(context, 'vim.showQuickpickCmdLine', async () => {
    const modeHandler = await getAndUpdateModeHandler();
    await commandLine.PromptAndRun('', modeHandler.vimState);
    modeHandler.updateView(modeHandler.vimState);
  });

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
            await commandLine.Run(command.command.slice(1, command.command.length), mh.vimState);
            await mh.updateView(mh.vimState);
          } else {
            await vscode.commands.executeCommand(command.command, command.args);
          }
        }
      }
    });
  });

  registerCommand(context, 'toggleVim', async () => {
    configuration.disableExt = !configuration.disableExt;
    toggleExtension(configuration.disableExt, compositionState);
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
  toggleExtension(configuration.disableExt, compositionState);
}

/**
 * Toggles the VSCodeVim extension between Enabled mode and Disabled mode. This
 * function is activated by calling the 'toggleVim' command from the Command Palette.
 *
 * @param isDisabled if true, sets VSCodeVim to Disabled mode; else sets to enabled mode
 */
async function toggleExtension(isDisabled: boolean, compositionState: CompositionState) {
  await vscode.commands.executeCommand('setContext', 'vim.active', !isDisabled);
  if (!vscode.window.activeTextEditor) {
    // This was happening in unit tests.
    // If activate was called and no editor window is open, we can't properly initialize.
    return;
  }
  let mh = await getAndUpdateModeHandler();
  if (isDisabled) {
    await mh.handleKeyEvent('<ExtensionDisable>');
    compositionState.reset();
    ModeHandlerMap.clear();
  } else {
    await mh.handleKeyEvent('<ExtensionEnable>');
  }
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

process.on('unhandledRejection', function(reason: any, p: any) {
  logger.error(`Unhandled Rejection at: Promise ${p}. Reason: ${reason}.`);
  // TODO: remove
  throw reason;
});
