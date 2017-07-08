'use strict';

/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */

import * as vscode from 'vscode';
import * as _ from 'lodash';
import { attach } from 'neovim';
import { NeovimClient } from 'neovim/lib/api/client';
import { TaskQueue } from 'aurelia-task-queue';
import { showCmdLine } from './src/cmd_line/main';
import { ModeHandler } from './src/mode/modeHandler';
import { Position } from './src/common/motion/position';
import { Globals } from './src/globals';
import { AngleBracketNotation } from './src/notation';
import { ModeName } from './src/mode/mode';
import { Configuration } from './src/configuration/configuration';
import { ICodeKeybinding } from './src/mode/remapper';
import { runCmdLine } from './src/cmd_line/main';

import { spawn } from 'child_process';
import { NvUtil } from './srcNV/nvUtil';
import { TextEditor } from './src/textEditor';
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

export namespace Vim {
  export let nv: NeovimClient;
  export let operatorPending = false;
  export let mode: { mode: string; blocking: boolean } = { mode: 'n', blocking: false };
  export let channelId: number;
  export let prevState: { bufferTick: number } = { bufferTick: -1 };
  export let taskQueue = new TaskQueue();
}

export async function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);
  const proc = spawn(
    'nvim',
    [
      // '-u',
      // 'NONE',
      '-N',
      '--embed',
      vscode.window.activeTextEditor ? vscode.window.activeTextEditor!.document.fileName : '',
    ],
    {
      cwd: __dirname,
    }
  );
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
    await nvim.command(`noautocmd tab drop ${active_editor_file}`);
    await NvUtil.copyTextFromNeovim();
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
    if (buf_id === -1) {
      return;
    }
    await nvim.command(`noautocmd ${buf_id}bw!`);
  });

  vscode.window.onDidChangeActiveTextEditor(handleActiveTextEditorChange, this);

  vscode.workspace.onDidChangeTextDocument(async e => {
    // console.log(e.contentChanges[0].rangeLength);
    if (e.contentChanges.length === 0) {
      return;
    }
    console.log(e.contentChanges[0].rangeLength);
    const change = e.contentChanges[0];
    await nvim.callAtomic([
      ['nvim_command', ['undojoin']],
      ['nvim_buf_set_lines', [0, 0, -1, 1, TextEditor.getText().split('\n')]],
    ]);
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);
  });

  // await nvim.uiAttach(100, 100, { ext_cmdline: true, ext_tabline: true });
  await nvim.command('autocmd BufAdd,BufNewFile * nested tab sball');

  // As we have one buffer per tab, we are using BufEnter instead of TabEnter due to some weird cases with creating tabs.
  await nvim.command(
    `autocmd BufEnter * :call rpcrequest(${Vim.channelId}, "openTab", expand("<abuf>"), expand("<afile>"))`
  );
  await nvim.command(
    `autocmd BufWriteCmd * :call rpcrequest(${Vim.channelId}, "writeBuf", expand("<abuf>"), expand("<afile>"))`
  );
  // todo: I don't think quitpre is the right autocmd here...
  await nvim.command(
    `autocmd QuitPre * :call rpcrequest(${Vim.channelId}, "closeTab", expand("<abuf>"), expand("<afile>"))`
  );
  // await nvim.command(`autocmd TextChanged * :call rpcrequest(${Vim.channelId}, "textChanged")`);
  // await nvim.command(`autocmd TextChangedI * :call rpcrequest(${Vim.channelId}, "textChanged")`);

  // Overriding commands to handle them on the vscode side.
  await nvim.command(`nnoremap gd :call rpcrequest(${Vim.channelId},"goToDefinition")<CR>`);

  await nvim.command('set noswapfile');
  await nvim.command('set hidden');

  nvim.on('notification', (args: any, x: any) => {
    // console.log(args, x);
  });

  async function rpcRequestOpenTab(args: any, resp: any) {
    const filePath = vscode.Uri.file(args[1]);
    console.log(filePath);
    await vscode.commands.executeCommand('vscode.open', filePath);
    resp.send('success');
  }

  async function rpcRequestTab(args: Array<any>, resp: any) {
    let result: Promise<vscode.TextDocumentContentChangeEvent> = new Promise((resolve, reject) => {
      let handler = vscode.workspace.onDidChangeTextDocument(e => {
        console.log(e);
        handler.dispose();
        resolve(e.contentChanges[0]);
      });
    });
    vscode.commands.executeCommand('acceptSelectedSuggestion');
    vscode.commands.executeCommand('tab');
    if ((await result).rangeLength > 0) {
      // Todo: This is double plus not good
      await nvim.command(`normal! ${'x'.repeat((await result).rangeLength)}`);
    }
    await resp.send((await result).text);
    NvUtil.copyTextFromNeovim();
  }

  async function rpcRequestWriteBuf(args: Array<any>, resp: any) {
    const filePath = vscode.Uri.file(args[1]);
    await vscode.commands.executeCommand('workbench.action.files.save', filePath);
    // nvim.command('e!');
    await resp.send('success');
  }

  async function rpcRequestCloseTab(args: Array<any>, resp: any) {
    const buffers = await nvim.buffers;
    const bufId = parseInt(args[0], 10) - 1;
    console.log('buffers and args');
    console.log(buffers, args);
    if (bufId >= buffers.length || bufId < 0) {
      resp.send("buffer doesn't exist");
      return;
    }
    const filePath = vscode.Uri.file(await buffers[bufId].name);
    console.log('filepath: ', filePath);
    if (args[1] !== vscode.window.activeTextEditor!.document.fileName) {
      await vscode.commands.executeCommand('vscode.open', filePath);
    }
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    resp.send('success');
  }

  async function rpcRequestGoToDefinition(args: Array<any>, resp: any) {
    await vscode.commands.executeCommand('editor.action.goToDeclaration');
    await nvim.command("normal! m'");
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);
    resp.send('success');
  }

  nvim.on('request', async (method: string, args: Array<any>, resp: any) => {
    console.log(method, args);
    console.log('Buffers: ', await nvim.buffers);
    if (method === 'openTab') {
      rpcRequestOpenTab(args, resp);
    } else if (method === 'tab') {
      rpcRequestTab(args, resp);
    } else if (method === 'writeBuf') {
      rpcRequestWriteBuf(args, resp);
    } else if (method === 'closeTab') {
      rpcRequestCloseTab(args, resp);
    } else if (method === 'goToDefinition') {
      rpcRequestGoToDefinition(args, resp);
    }
  });

  // tslint:disable-next-line:no-unused-variable
  async function handleSimple(key: string) {
    await nvim.input(key);
  }

  async function handleKeyEventNV(key: string) {
    const prevMode = Vim.mode.mode;
    const prevBlocking = Vim.mode.blocking;
    await nvim.input(key === '<' ? '<lt>' : key);

    // https://github.com/neovim/neovim/issues/6166
    // This is just for convenience sake
    if (Vim.mode.mode === 'n' && 'dycg@q"'.indexOf(key) !== -1 && !Vim.operatorPending) {
      Vim.operatorPending = true;
      return;
    }
    if (key.match(/[0-9]/) && Vim.mode.mode !== 'i') {
      return;
    }
    Vim.operatorPending = false;
    // End of hack

    let mode = (await nvim.mode) as any;
    // More hackish stuff
    if (mode.blocking && mode.mode !== 'i') {
      console.log('FIXING BLOCK: ', mode.mode);
      await nvim.input('<Esc>');
    }
    Vim.mode = mode;
    await vscode.commands.executeCommand('setContext', 'vim.mode', Vim.mode.mode);
    // FOr insert mode keybindings jj
    if (prevMode !== 'i' || Vim.mode.mode !== 'i') {
      if (!Vim.mode.blocking) {
        await NvUtil.changeSelectionFromMode(Vim.mode.mode);
      }
      await NvUtil.copyTextFromNeovim();
      console.log('Changed selection at #1');
      if (!Vim.mode.blocking) {
        await NvUtil.changeSelectionFromMode(Vim.mode.mode);
      }
    } else {
      if (prevBlocking && !Vim.mode.blocking) {
        await NvUtil.copyTextFromNeovim();
        await NvUtil.changeSelectionFromMode(Vim.mode.mode);
      } else {
        if (key.length > 1) {
          return;
        }
        await vscode.commands.executeCommand('default:type', { text: key });
      }
    }
  }

  overrideCommand(context, 'type', async args => {
    if (Vim.taskQueue.flushing) {
      return;
    }
    Vim.taskQueue.queueMicroTask(() => {
      handleKeyEventNV(args.text);
    });
  });

  await vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);
  // Keybindings need to be re-evaluated.

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

    Configuration.boundKeyCombinations.push(bracketedKey);
    registerCommand(context, keybinding.command, () => {
      Vim.taskQueue.queueMicroTask(() => {
        handleKeyEventNV(bracketedKey);
      });
    });
  }
  Configuration.updateConfiguration();

  if (vscode.window.activeTextEditor) {
    await handleActiveTextEditorChange();
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

process.on('unhandledRejection', function(reason: any, p: any) {
  console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});
