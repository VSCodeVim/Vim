'use strict';

/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */

import * as vscode from 'vscode';
import * as _ from 'lodash';
import { attach } from 'neovim';
import { showCmdLine } from './src/cmd_line/main';
import { ModeHandler } from './src/mode/modeHandler';
import { taskQueue } from './src/taskQueue';
import { Position } from './src/common/motion/position';
import { Globals } from './src/globals';
import { AngleBracketNotation } from './src/notation';
import { ModeName } from './src/mode/mode';
import { Configuration } from './src/configuration/configuration';
import { ICodeKeybinding } from './src/mode/remapper';
import { runCmdLine } from './src/cmd_line/main';

import { spawn } from 'child_process';
import { NvUtil } from './neovim';
import { NeovimClient } from 'neovim/lib/api/client';
// import { Neovim } from './neovim';

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
  };
} = require('../package.json'); // out/../package.json

export class EditorIdentity {
  private _fileName: string;
  private _viewColumn: vscode.ViewColumn;

  constructor(textEditor?: vscode.TextEditor) {
    this._fileName = (textEditor && textEditor.document.fileName) || '';
    this._viewColumn = (textEditor && textEditor.viewColumn) || vscode.ViewColumn.One;
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
  const prevHandler = modeHandlerToEditorIdentity[previousActiveEditorId.toString()];
  const activeEditorId = new EditorIdentity(vscode.window.activeTextEditor);

  let curHandler = modeHandlerToEditorIdentity[activeEditorId.toString()];
  if (!curHandler) {
    if (!Configuration.disableAnnoyingNeovimMessage) {
      vscode.window
        .showInformationMessage(
          'We have now added neovim integration for Ex-commands.\
      Enable it with vim.enableNeovim in settings',
          'Never show again'
        )
        .then(result => {
          if (result !== 'Close') {
            vscode.workspace
              .getConfiguration('vim')
              .update('disableAnnoyingNeovimMessage', true, true);
            Configuration.disableAnnoyingNeovimMessage = true;
          }
        });
    }
    const newModeHandler = await new ModeHandler();
    modeHandlerToEditorIdentity[activeEditorId.toString()] = newModeHandler;
    extensionContext.subscriptions.push(newModeHandler);

    curHandler = newModeHandler;
  }

  curHandler.vimState.editor = vscode.window.activeTextEditor!;
  if (!prevHandler || curHandler.identity !== prevHandler.identity) {
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

    await curHandler.updateView(curHandler.vimState, {
      drawSelection: false,
      revealRange: false,
    });
  }

  if (prevHandler && curHandler.vimState.focusChanged) {
    curHandler.vimState.focusChanged = false;
    prevHandler.vimState.focusChanged = true;
  }

  vscode.commands.executeCommand('setContext', 'vim.mode', curHandler.vimState.currentModeName());

  // Temporary workaround for vscode bug not changing cursor style properly
  // https://github.com/Microsoft/vscode/issues/17472
  // https://github.com/Microsoft/vscode/issues/17513
  const options = curHandler.vimState.editor.options;
  const desiredStyle = options.cursorStyle;

  // Temporarily change to any other cursor style besides the desired type, then change back
  if (desiredStyle === vscode.TextEditorCursorStyle.Block) {
    curHandler.vimState.editor.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
    curHandler.vimState.editor.options.cursorStyle = desiredStyle;
  } else {
    curHandler.vimState.editor.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
    curHandler.vimState.editor.options.cursorStyle = desiredStyle;
  }

  return curHandler;
}

class CompositionState {
  public isInComposition: boolean = false;
  public composingText: string = '';
}

//
//
//
//
//
//
//
//
//
//
//
export namespace Vim {
  export let nv: NeovimClient;
  export let operatorPending = false;
  export let mode: string;
  export let channelId: number;
  export let mostRecentlyPressedKey: string;
  export let changeHandled: string | undefined;
}

export async function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);
  const proc = spawn('nvim', ['-u', 'NONE', '-N', '--embed'], {
    cwd: __dirname,
  });
  proc.on('error', function(err) {
    console.log(err);
    vscode.window.showErrorMessage('Unable to setup neovim instance! Check your path.');
    Configuration.enableNeovim = false;
  });
  let nvim = await attach({ proc: proc });
  Vim.nv = nvim;

  Vim.channelId = (await nvim.requestApi())[0] as number;

  async function handleActiveTextEditorChange() {
    if (vscode.window.activeTextEditor === undefined) {
      return;
    }
    const active_editor_file = vscode.window.activeTextEditor!.document.fileName;
    let buf_id = await nvim.call('bufnr', [`^${active_editor_file}$`]);
    if (buf_id === -1) {
      if (active_editor_file.indexOf('Untitled') !== -1) {
        await nvim.call('bufnr', [active_editor_file, 1]);
      } else {
        await nvim.command(`badd ${active_editor_file}`);
      }
      buf_id = await nvim.call('bufnr', [active_editor_file]);
    }
    await nvim.command(`${buf_id}buffer `);
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);

    const currentFileSettings = vscode.window.activeTextEditor!.options;
    if (currentFileSettings.insertSpaces) {
      await nvim.command(`set expandtab`);
    }
    await nvim.command(`set tabstop=${currentFileSettings.tabSize}`);
    await nvim.command(`set shiftwidth=${currentFileSettings.tabSize}`);
  }
  vscode.workspace.onDidCloseTextDocument(async event => {
    const deleted_file = event.fileName;
    let buf_id = await nvim.call('bufnr', [`^${deleted_file}$`]);
    await nvim.call(`${buf_id}bw!`);
  });
  // vscode.workspace.onDidChangeTextDocument(async event => {
  //   if (event.contentChanges.length === 0) {
  //     return;
  //   }
  //   const newText = event.contentChanges[0].text;

  //   // doesn't work on files with one line? Does anybody care?
  //   if (event.document.lineCount === event.contentChanges[0].text.split('\n').length) {
  //     return;
  //   }
  //   if (event.document.fileName !== vscode.window.activeTextEditor!.document.fileName) {
  //     return;
  //   }
  //   if (newText !== Vim.mostRecentlyPressedKey && Vim.mode === 'i') {
  //     await nvim.input('<BS>'.repeat(event.contentChanges[0].rangeLength));
  //     await nvim.input(newText);
  //   }
  // });

  vscode.window.onDidChangeActiveTextEditor(handleActiveTextEditorChange, this);

  await nvim.uiAttach(100, 100, { ext_cmdline: true, ext_tabline: true });

  await nvim.command(
    `autocmd BufReadPre * :call rpcrequest(${Vim.channelId}, "readBuf", expand("<abuf>"), expand("<afile>"))`
  );
  await nvim.command(
    `autocmd BufReadPre * :call rpcrequest(${Vim.channelId}, "readBuf", expand("<abuf>"), expand("<afile>"))`
  );
  await nvim.command(
    `inoremap <Tab> <Esc>dv?\\_s\\zs.<CR>a<C-R>=rpcrequest(${Vim.channelId},"tab")<CR>`
  );
  await nvim.command(`inoremap <Tab> <C-R>=rpcrequest(${Vim.channelId},"tab")<CR>`);
  // for janky fix for tabs/backspace
  await nvim.command('set nosmarttab');
  await nvim.command('set noswapfile');

  nvim.on('notification', (args: any, x: any) => {
    // console.log(args, x);
  });

  nvim.on('request', async (method: string, args: Array<any>, resp: any) => {
    if (method === 'readBuf') {
      const filePath = vscode.Uri.file(args[1]);
      resp.send('success');
    } else if (method === 'tab') {
      Vim.changeHandled = undefined;
      let result = new Promise((resolve, reject) => {
        let handler = vscode.workspace.onDidChangeTextDocument(e => {
          console.log(e);
          handler.dispose();
          resolve(e.contentChanges[0].text);
        });
      });
      vscode.commands.executeCommand('acceptSelectedSuggestion');
      vscode.commands.executeCommand('tab');
      await resp.send(await result);
      NvUtil.copyTextFromNeovim();
    }
  });

  async function handleKeyEventNV(key: string) {
    const prevMode = Vim.mode;
    await nvim.input(key === '<' ? '<lt>' : key);

    // https://github.com/neovim/neovim/issues/6166
    if (Vim.mode === 'n' && 'dycg'.indexOf(key) !== -1 && !Vim.operatorPending) {
      Vim.operatorPending = true;
      return;
    }
    if (key.match(/[0-9]/)) {
      return;
    }
    Vim.operatorPending = false;
    // End of hack

    let mode = (await nvim.mode) as any;
    Vim.mode = mode.mode as string;
    await vscode.commands.executeCommand('setContext', 'vim.mode', Vim.mode);
    if (prevMode !== 'i' || Vim.mode !== 'i') {
      await NvUtil.copyTextFromNeovim();
    } else {
      Vim.mostRecentlyPressedKey = key;
      if (key === '<tab>') {
        return;
      }
      await vscode.commands.executeCommand('default:type', { text: key });
    }
    await NvUtil.changeSelectionFromMode(Vim.mode);
  }

  overrideCommand(context, 'type', async args => {
    taskQueue.enqueueTask({
      promise: async () => {
        await handleKeyEventNV(args.text);
      },
      isRunning: false,
    });
  });

  await vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);

  for (let keybinding of packagejson.contributes.keybindings) {
    if (keybinding.when.indexOf('listFocus') !== -1) {
      continue;
    }
    let keyToBeBound = '';
    /**
     * On OSX, handle mac keybindings if we specified one.
     */
    if (process.platform === 'darwin') {
      keyToBeBound = keybinding.mac || keybinding.key;
    } else if (process.platform === 'linux') {
      keyToBeBound = keybinding.linux || keybinding.key;
    } else {
      keyToBeBound = keybinding.key;
    }

    const bracketedKey = AngleBracketNotation.Normalize(keyToBeBound);
    registerCommand(context, keybinding.command, () => {
      taskQueue.enqueueTask({
        promise: async () => {
          await handleKeyEventNV(bracketedKey);
        },
        isRunning: false,
      });
    });
  }
  if (vscode.window.activeTextEditor) {
    await handleActiveTextEditorChange();
  }
}
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
export async function _unused_activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  let compositionState = new CompositionState();

  // Event to update active configuration items when changed without restarting vscode
  vscode.workspace.onDidChangeConfiguration((e: void) => {
    Configuration.updateConfiguration();

    /* tslint:disable:forin */
    // Update the remappers foreach modehandler
    for (let mh in modeHandlerToEditorIdentity) {
      modeHandlerToEditorIdentity[mh].createRemappers();
    }
  });

  vscode.window.onDidChangeActiveTextEditor(handleActiveEditorChange, this);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (!Globals.active) {
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
      contentChangeHandler(Globals.modeHandlerForTesting as ModeHandler);
    } else {
      _.filter(
        modeHandlerToEditorIdentity,
        modeHandler => modeHandler.identity.fileName === event.document.fileName
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
    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();

        if (compositionState.isInComposition) {
          compositionState.composingText += args.text;
        } else {
          await mh.handleKeyEvent(args.text);
        }
      },
      isRunning: false,
    });
  });

  overrideCommand(context, 'replacePreviousChar', async args => {
    taskQueue.enqueueTask({
      promise: async () => {
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
      },
      isRunning: false,
    });
  });

  overrideCommand(context, 'compositionStart', async args => {
    taskQueue.enqueueTask({
      promise: async () => {
        compositionState.isInComposition = true;
      },
      isRunning: false,
    });
  });

  overrideCommand(context, 'compositionEnd', async args => {
    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();
        let text = compositionState.composingText;
        compositionState = new CompositionState();
        await mh.handleMultipleKeyEvents(text.split(''));
      },
      isRunning: false,
    });
  });

  registerCommand(context, 'extension.showCmdLine', () => {
    showCmdLine(
      '',
      modeHandlerToEditorIdentity[new EditorIdentity(vscode.window.activeTextEditor).toString()]
    );
  });

  registerCommand(context, 'vim.remap', async (args: ICodeKeybinding) => {
    taskQueue.enqueueTask({
      promise: async () => {
        const mh = await getAndUpdateModeHandler();
        if (args.after) {
          for (const key of args.after) {
            await mh.handleKeyEvent(AngleBracketNotation.Normalize(key));
          }
          return;
        }

        if (args.commands) {
          for (const command of args.commands) {
            // Check if this is a vim command by looking for :
            if (command.command.slice(0, 1) === ':') {
              await runCmdLine(command.command.slice(1, command.command.length), mh);
              await mh.updateView(mh.vimState);
            } else {
              await vscode.commands.executeCommand(command.command, command.args);
            }
          }
        }
      },
      isRunning: false,
    });
  });

  registerCommand(context, 'toggleVim', async () => {
    Globals.active = !Globals.active;
    if (Globals.active) {
      await vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);
      compositionState = new CompositionState();
      modeHandlerToEditorIdentity = {};
      let mh = await getAndUpdateModeHandler();
      mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
    } else {
      let cursorStyle = await vscode.workspace
        .getConfiguration('editor')
        .get('cursorStyle', 'line');
      vscode.window.visibleTextEditors.forEach(editor => {
        let options = editor.options;
        switch (cursorStyle) {
          case 'line':
            options.cursorStyle = vscode.TextEditorCursorStyle.Line;
            break;
          case 'block':
            options.cursorStyle = vscode.TextEditorCursorStyle.Block;
            break;
          case 'underline':
            options.cursorStyle = vscode.TextEditorCursorStyle.Underline;
            break;

          default:
            break;
        }
        editor.options = options;
      });
      await vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);
      let mh = await getAndUpdateModeHandler();
      mh.setStatusBarText('-- VIM: DISABLED --');
    }
  });

  vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);

  // Clear boundKeyCombinations array incase there are any entries in it so
  // that we have a clean list of keys with no duplicates
  Configuration.boundKeyCombinations = [];

  for (let keybinding of packagejson.contributes.keybindings) {
    if (keybinding.when.indexOf('listFocus') !== -1) {
      continue;
    }
    let keyToBeBound = '';
    /**
      * On OSX, handle mac keybindings if we specified one.
      */
    if (process.platform === 'darwin') {
      keyToBeBound = keybinding.mac || keybinding.key;
    } else if (process.platform === 'linux') {
      keyToBeBound = keybinding.linux || keybinding.key;
    } else {
      keyToBeBound = keybinding.key;
    }

    const bracketedKey = AngleBracketNotation.Normalize(keyToBeBound);

    // Store registered key bindings in bracket notation form
    Configuration.boundKeyCombinations.push(bracketedKey);

    registerCommand(context, keybinding.command, () => handleKeyEvent(`${bracketedKey}`));
  }

  // Update configuration now that bound keys array is populated
  Configuration.updateConfiguration();

  // Initialize mode handler for current active Text Editor at startup.
  if (vscode.window.activeTextEditor) {
    let mh = await getAndUpdateModeHandler();
    mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
  }
}

function overrideCommand(
  context: vscode.ExtensionContext,
  command: string,
  callback: (...args: any[]) => any
) {
  let disposable = vscode.commands.registerCommand(command, async args => {
    if (!Globals.active) {
      console.log('YO');
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

  taskQueue.enqueueTask({
    promise: async () => {
      await mh.handleKeyEvent(key);
    },
    isRunning: false,
  });
}

function handleContentChangedFromDisk(document: vscode.TextDocument): void {
  _.filter(
    modeHandlerToEditorIdentity,
    modeHandler => modeHandler.identity.fileName === document.fileName
  ).forEach(modeHandler => {
    modeHandler.vimState.historyTracker.clear();
  });
}

async function handleActiveEditorChange(): Promise<void> {
  if (!Globals.active) {
    return;
  }

  // Don't run this event handler during testing
  if (Globals.isTesting) {
    return;
  }

  taskQueue.enqueueTask({
    promise: async () => {
      if (vscode.window.activeTextEditor !== undefined) {
        const mh = await getAndUpdateModeHandler();

        mh.updateView(mh.vimState, {
          drawSelection: false,
          revealRange: false,
        });
      }
    },
    isRunning: false,
  });
}

process.on('unhandledRejection', function(reason: any, p: any) {
  console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});
