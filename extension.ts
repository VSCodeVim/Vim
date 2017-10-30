'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as _ from 'lodash';
import { attach } from 'neovim';
import { NeovimClient } from 'neovim/lib/api/client';
import { TaskQueue } from 'aurelia-task-queue';
import { Position } from './src/common/motion/position';
import { Globals } from './src/globals';
import { Configuration } from './src/configuration/configuration';

import { spawn } from 'child_process';
import { NvUtil } from './srcNV/nvUtil';
import { RpcRequest } from './srcNV/rpcHandlers';
import { TextEditor } from './src/textEditor';
import { Screen, IgnoredKeys } from './srcNV/screen';
import { VimSettings } from './srcNV/vimSettings';
import { VscHandlers } from './srcNV/vscHandlers';

interface VSCodeKeybinding {
  key: string;
  command: string;
  when: string;
  vimKey: string;
}

const packagejson: {
  contributes: {
    keybindings: VSCodeKeybinding[];
  };
} = require('../package.json'); // out/../package.json

export namespace Vim {
  export let nv: NeovimClient;
  export let channelId: number;
  export let mode: { mode: string; blocking: boolean } = { mode: 'n', blocking: false };
  export let screen: Screen;
  export let prevState: { bufferTick: number } = {
    bufferTick: -1,
  };
  export let numVimChangesToApply = 0;
  export let taskQueue = new TaskQueue();
  // We're connecting to an already existing terminal instance, so externalized ui won't work.
  export let DEBUG: boolean;
}

export async function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidCloseTextDocument(async event => {
    const deleted_file = event.fileName;
    let buf_id = await nvim.call('bufnr', [`^${deleted_file}$`]);
    if (buf_id === -1) {
      return;
    }
    // await nvim.command(`noautocmd ${buf_id}bw!`);
  });

  vscode.window.onDidChangeActiveTextEditor(VscHandlers.handleActiveTextEditorChange, this);

  vscode.window.onDidChangeTextEditorSelection(async e => {
    if (e.kind === vscode.TextEditorSelectionChangeKind.Mouse) {
      if (e.selections[0]) {
        await NvUtil.setSelection(e.selections[0]);
      }
    }
  });
  vscode.workspace.onDidChangeTextDocument(VscHandlers.handleTextDocumentChange);

  // Event to update active configuration items when changed without restarting vscode
  vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
    Configuration.updateConfiguration();
  });

  overrideCommand(context, 'type', async args => {
    Vim.taskQueue.queueMicroTask(() => {
      VscHandlers.handleKeyEventNV(args.text);
    });
  });

  const keysToBind = packagejson.contributes.keybindings;
  const ignoreKeys = Configuration.ignoreKeys;

  for (let key of keysToBind) {
    if (ignoreKeys.all.indexOf(key.vimKey) !== -1) {
      continue;
    }
    vscode.commands.executeCommand('setContext', `vim.use_${key.vimKey}`, true);
    registerCommand(context, key.command, () => {
      Vim.taskQueue.queueMicroTask(() => {
        VscHandlers.handleKeyEventNV(`${key.vimKey}`);
      });
    });
  }

  const proc = spawn(
    Configuration.neovimPath,
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
  });
  let nvim: NeovimClient;
  if (fs.existsSync('/tmp/nvim') && fs.lstatSync('/tmp/nvim').isSocket()) {
    nvim = attach({ socket: '/tmp/nvim' });
    Vim.DEBUG = true;
  } else {
    nvim = attach({ proc: proc });
    Vim.DEBUG = false;
  }
  Vim.nv = nvim;

  Vim.channelId = (await nvim.requestApi())[0] as number;

  const SIZE = 50;
  nvim.uiAttach(SIZE, SIZE, { ext_cmdline: true, ext_wildmenu: true });
  Vim.screen = new Screen(SIZE);

  const code = `
function _vscode_copy_text(text, line, char)
  vim.api.nvim_command('undojoin')
  vim.api.nvim_buf_set_lines(0, 0, -1, true, text)
  vim.api.nvim_call_function('setpos', {'.', {0, line, char, false}})
end
`;

  await Vim.nv.lua(code, []);
  await nvim.command('autocmd!');

  // todo(chilli): Create this map just from RPCHandlers and a decorator.
  const autocmdMap: { [autocmd: string]: string } = {
    BufWriteCmd: 'writeBuf',
    QuitPre: 'closeBuf',
    BufEnter: 'enterBuf',
    TabNewEntered: 'newTabEntered',
  };

  for (const autocmd of Object.keys(autocmdMap)) {
    await nvim.command(
      `autocmd ${autocmd} * :call rpcrequest(${Vim.channelId}, "${autocmdMap[
        autocmd
      ]}", expand("<abuf>"), fnamemodify(expand('<afile>'), ':p'), expand("<afile>"))`
    );
  }

  // Overriding commands to handle them on the vscode side.
  // await nvim.command(`nnoremap gd :call rpcrequest(${Vim.channelId},"goToDefinition")<CR>`);

  await NvUtil.setSettings(['noswapfile', 'hidden']);
  nvim.on('notification', (method: any, args: any) => {
    if (vscode.window.activeTextEditor && method === 'redraw') {
      Vim.screen.redraw(args);
    }
  });

  nvim.on('request', async (method: string, args: Array<any>, resp: any) => {
    if (RpcRequest[method] !== undefined) {
      const f = RpcRequest[method];
      f(args, resp);
    } else {
      console.log(`${method} is not defined!`);
    }
  });

  if (vscode.window.activeTextEditor) {
    await VscHandlers.handleActiveTextEditorChange();
  }
}

function overrideCommand(
  context: vscode.ExtensionContext,
  command: string,
  callback: (...args: any[]) => any
) {
  let disposable = vscode.commands.registerCommand(command, async args => {
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
