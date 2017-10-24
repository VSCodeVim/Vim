'use strict';

/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */

import * as vscode from 'vscode';
import { existsSync } from 'fs';
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
import { RpcRequest } from './srcNV/rpcHandlers';
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
  export let prevState: { bufferTick: number; prevCursorPos: Position } = {
    bufferTick: -1,
    prevCursorPos: new Position(0, 0),
  };
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
  let nvim: NeovimClient;
  if (existsSync('/tmp/nvim')) {
    nvim = attach({ socket: '/tmp/nvim' });
  } else {
    nvim = await attach({ proc: proc });
  }
  Vim.nv = nvim;

  Vim.channelId = (await nvim.requestApi())[0] as number;

  // await nvim.uiAttach(100, 100, { ext_cmdline: true, ext_tabline: true });

  await nvim.command('autocmd!');
  const autocmdMap: { [autocmd: string]: string } = {
    BufWriteCmd: 'writeBuf',
    QuitPre: 'closeBuf',
    InsertLeave: 'leaveInsert',
    BufEnter: 'openBuf',
  };
  for (const autocmd of Object.keys(autocmdMap)) {
    await nvim.command(
      `autocmd ${autocmd} * :call rpcrequest(${Vim.channelId}, "${autocmdMap[
        autocmd
      ]}", expand("<abuf>"), fnamemodify(expand('<afile>'), ':p'))`
    );
  }

  // Overriding commands to handle them on the vscode side.
  // await nvim.command(`nnoremap gd :call rpcrequest(${Vim.channelId},"goToDefinition")<CR>`);

  await nvim.command('set noswapfile');
  await nvim.command('set hidden');

  nvim.on('notification', (args: any, x: any) => {
    // console.log(args, x);
  });

  nvim.on('request', async (method: string, args: Array<any>, resp: any) => {
    if (RpcRequest[method] !== undefined) {
      const f = RpcRequest[method];
      f(args, resp);
    } else {
      console.log(`${method} is not defined!`);
    }
  });

  async function handleActiveTextEditorChange() {
    if (vscode.window.activeTextEditor === undefined) {
      return;
    }
    const active_editor_file = vscode.window.activeTextEditor!.document.fileName;
    await nvim.command(`edit ${active_editor_file}`);
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
    if (e.contentChanges.length === 0) {
      return;
    }
    const change = e.contentChanges[0];
    const changeBegin = Position.FromVSCodePosition(change.range.start);
    const changeEnd = Position.FromVSCodePosition(change.range.end);
    const curPos = Position.FromVSCodePosition(vscode.window.activeTextEditor!.selection.active);
    const docEnd = new Position(0, 0).getDocumentEnd();
    // console.log(changeBegin, changeEnd, curPos);
    if (
      Vim.mode.mode === 'i' &&
      ((changeBegin.line === curPos.line && changeBegin.line === changeEnd.line) ||
        change.text === '')
    ) {
      await NvUtil.updateMode();
      if (!Vim.mode.blocking) {
        const nvPos = await NvUtil.getCursorPos();
        const nvLine = nvPos[0];
        const nvChar = nvPos[1];
        if (nvLine !== curPos.line) {
          await NvUtil.setCursorPos(curPos);
        } else {
          await NvUtil.ctrlGMove(nvChar, changeEnd.character);
        }
      }
      await nvim.input('<BS>'.repeat(Math.max(0, change.rangeLength)));
      await nvim.input(change.text);
    } else {
      // todo: Optimize this to only replace relevant lines. Probably not worth
      // doing until diffs come in from the neovim side though, since that's the
      // real blocking factor.
      // @ts-ignore
      await nvim.callAtomic([
        ['nvim_command', ['undojoin']],
        ['nvim_buf_set_lines', [0, 0, -1, 1, TextEditor.getText().split('\n')]],
      ]);
    }
    // I'm assuming here that there's nothing that will happen on the vscode
    // side that would alter cursor position if you're not in insert mode.
    // Technically not true, but it seems like a pain to handle, and seems
    // like something that won't be used much. Will re-evaluate at a later
    // date.
  });

  // tslint:disable-next-line:no-unused-variable
  async function handleSimple(key: string) {
    await nvim.input(key);
  }

  async function handleKeyEventNV(key: string) {
    const prevMode = Vim.mode.mode;
    const prevBlocking = Vim.mode.blocking;

    Vim.prevState.prevCursorPos = Position.FromVSCodePosition(
      vscode.window.activeTextEditor!.selection.active
    );
    async function input(k: string) {
      await nvim.input(k === '<' ? '<lt>' : k);
      await NvUtil.updateMode();
      await NvUtil.copyTextFromNeovim();
      await NvUtil.changeSelectionFromMode(Vim.mode.mode);
    }
    if (prevMode !== 'i') {
      await input(key);
    } else {
      if (key === '<BS>') {
        await vscode.commands.executeCommand('deleteLeft');
      } else if (key.length > 1) {
        await input(key);
      } else {
        await vscode.commands.executeCommand('default:type', { text: key });
      }
    }

    // More hackish stuff
    await vscode.commands.executeCommand('setContext', 'vim.mode', Vim.mode.mode);
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
