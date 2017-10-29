'use strict';

/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as _ from 'lodash';
import { attach } from 'neovim';
import { NeovimClient } from 'neovim/lib/api/client';
import { TaskQueue } from 'aurelia-task-queue';
import { Position } from './src/common/motion/position';
import { Globals } from './src/globals';
import { AngleBracketNotation } from './src/notation';
import { Configuration } from './src/configuration/configuration';

import { spawn } from 'child_process';
import { NvUtil } from './srcNV/nvUtil';
import { RpcRequest } from './srcNV/rpcHandlers';
import { TextEditor } from './src/textEditor';
import { Screen, IgnoredKeys } from './srcNV/screen';
import { VimSettings } from './srcNV/vimSettings';

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
  export let prevState: { bufferTick: number; prevPos: Position } = {
    bufferTick: -1,
    prevPos: new Position(0, 0),
  };
  export let taskQueue = new TaskQueue();
  export let DEBUG = true;
}

export async function activate(context: vscode.ExtensionContext) {
  async function handleActiveTextEditorChange() {
    if (vscode.window.activeTextEditor === undefined) {
      return;
    }
    const active_editor_file = vscode.window.activeTextEditor!.document.fileName;
    await nvim.command(`edit! ${active_editor_file}`);
    await NvUtil.copyTextFromNeovim();
    await NvUtil.setCursorPos(vscode.window.activeTextEditor!.selection.active);
    await NvUtil.setSettings(await VimSettings.enterFileSettings());
    await NvUtil.changeSelectionFromMode(Vim.mode.mode);
  }

  async function handleTextDocumentChange(e: vscode.TextDocumentChangeEvent) {
    if (e.contentChanges.length === 0) {
      return;
    }
    for (const change of e.contentChanges) {
      const changeBegin = Position.FromVSCodePosition(change.range.start);
      const changeEnd = Position.FromVSCodePosition(change.range.end);
      const curPos = Position.FromVSCodePosition(vscode.window.activeTextEditor!.selection.active);
      const curSel = vscode.window.activeTextEditor!.selection;
      const docEnd = new Position(0, 0).getDocumentEnd();
      // This ugly if statement is to differentiate the "real" vscode changes that
      // should be included in dot repeat(like autocomplete, auto-close parens,
      // all regular typing, etc.) from the vscode changes that should not be
      // included (the entire buffer syncing, autoformatting, etc.)

      const isInsertModeChange = () => {
        if (Vim.mode.mode !== 'i') {
          return false;
        }
        // Handles the case where we press backsapce at the beginning of a line.
        if (change.text === '' && changeEnd.character === 0 && change.rangeLength === 1) {
          return true;
        }
        // If the change is spanning multiple lines then it's almost definitely
        // not an insert mode change (except for a couple of special cases.)
        if (!(changeBegin.line === curPos.line && changeBegin.line === changeEnd.line)) {
          return false;
        }
        // Mainly for mouse cursor selection/multicursor stuff.
        if (
          curSel.active.line !== curSel.anchor.line ||
          curSel.active.character !== curSel.anchor.character
        ) {
          return false;
        }
        // Tries to handle the case about editing on the first line.
        if (changeBegin.line === 0 && changeBegin.character === 0 && change.rangeLength !== 0) {
          if (change.text[change.text.length - 1] === '\n') {
            return false;
          } else if (TextEditor.getLineCount() === 1) {
            return false;
          }
        }
        return true;
      };
      await NvUtil.updateMode();
      if (isInsertModeChange()) {
        if (!Vim.mode.blocking) {
          const nvPos = await NvUtil.getCursorPos();
          if (nvPos.line !== curPos.line) {
            await NvUtil.setCursorPos(curPos);
          } else {
            // Is necessary for parentheses autocompletion but causes issues
            // when non-atomic with fast text.
            await NvUtil.ctrlGMove(nvPos.character, changeEnd.character);
          }
        }
        await nvim.input('<BS>'.repeat(change.rangeLength));
        await nvim.input(change.text);
      } else {
        // todo: Optimize this to only replace relevant lines. Probably not worth
        // doing until diffs come in from the neovim side though, since that's the
        // real blocking factor.
        // todo(chilli):  Tests if change is a change that replaces the entire text (ie: the copy
        // from neovim buffer to vscode buffer). It's a hack. Won't work if your
        // change (refactor) for example, doesn't modify the length of the file
        const isRealChange = change.text.length !== change.rangeLength;
        if (isRealChange) {
          // todo(chilli): Doesn't work if there was just an undo command (undojoin
          // fails and prevents the following command from executing)

          const newPos = vscode.window.activeTextEditor!.selection.active;
          let t = await Vim.nv.lua('return _vscode_copy_text(...)', [
            TextEditor.getText().split('\n'),
            newPos.line + 1,
            newPos.character + 1,
          ]);
          // const newPos = vscode.window.activeTextEditor!.selection.active;
          // await nvim.command('undojoin');
          // await nvim.buffer.setLines(TextEditor.getText().split('\n'));
          // await NvUtil.setCursorPos(newPos);
          // await NvUtil.updateMode();
        }
        break;
      }
      Vim.prevState.prevPos = curPos;
    }
  }

  vscode.workspace.onDidCloseTextDocument(async event => {
    const deleted_file = event.fileName;
    let buf_id = await nvim.call('bufnr', [`^${deleted_file}$`]);
    if (buf_id === -1) {
      return;
    }
    // await nvim.command(`noautocmd ${buf_id}bw!`);
  });

  vscode.window.onDidChangeActiveTextEditor(handleActiveTextEditorChange, this);

  vscode.window.onDidChangeTextEditorSelection(async e => {
    if (e.kind === vscode.TextEditorSelectionChangeKind.Mouse) {
      if (e.selections[0]) {
        await NvUtil.setSelection(e.selections[0]);
      }
    }
  });
  vscode.workspace.onDidChangeTextDocument(handleTextDocumentChange);

  // Event to update active configuration items when changed without restarting vscode
  vscode.workspace.onDidChangeConfiguration((e: void) => {
    Configuration.updateConfiguration();
  });

  // tslint:disable-next-line:no-unused-variable
  async function handleSimple(key: string) {
    await nvim.input(key);
  }

  async function handleKeyEventNV(key: string) {
    const prevMode = Vim.mode.mode;
    const prevBlocking = Vim.mode.blocking;
    async function input(k: string) {
      await nvim.input(k === '<' ? '<lt>' : k);
      await NvUtil.updateMode();
      if (Vim.mode.mode === 'r') {
        await nvim.input('<CR>');
      }
      // Optimization that makes movement very smooth. However, occasionally
      // makes it more difficult to debug so it's turned off for now.
      // const curTick = await Vim.nv.buffer.changedtick;
      // if (curTick === Vim.prevState.bufferTick) {
      //   await NvUtil.changeSelectionFromMode(Vim.mode.mode);
      //   return;
      // }
      // Vim.prevState.bufferTick = curTick;

      const curPos = await NvUtil.getCursorPos();
      const startPos = await NvUtil.getSelectionStartPos();
      const curWant = await NvUtil.getCurWant();
      NvUtil.changeSelectionFromModeSync(Vim.mode.mode, curPos, startPos, curWant);
      await NvUtil.copyTextFromNeovim();
      NvUtil.changeSelectionFromModeSync(Vim.mode.mode, curPos, startPos, curWant);
    }
    if (prevMode !== 'i') {
      await input(key);
    } else {
      if (key.length > 1) {
        await input(key);
      } else {
        await vscode.commands.executeCommand('default:type', { text: key });
      }
    }

    await vscode.commands.executeCommand('setContext', 'vim.mode', Vim.mode.mode);
  }

  overrideCommand(context, 'type', async args => {
    Vim.taskQueue.queueMicroTask(() => {
      handleKeyEventNV(args.text);
    });
  });

  await vscode.commands.executeCommand('setContext', 'vim.active', Globals.active);

  const keysToBind = packagejson.contributes.keybindings;
  const ignoreKeys = Configuration.ignoreKeys;

  for (let key of keysToBind) {
    if (ignoreKeys.all.indexOf(key.vimKey) !== -1) {
      continue;
    }
    vscode.commands.executeCommand('setContext', `vim.use_${key.vimKey}`, true);
    registerCommand(context, key.command, () => {
      Vim.taskQueue.queueMicroTask(() => {
        handleKeyEventNV(`${key.vimKey}`);
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

  proc.on('error', function (err) {
    console.log(err);
    vscode.window.showErrorMessage('Unable to setup neovim instance! Check your path.');
  });
  let nvim: NeovimClient;
  if (fs.existsSync('/tmp/nvim') && fs.lstatSync('/tmp/nvim').isSocket()) {
    nvim = attach({ socket: '/tmp/nvim' });
  } else {
    nvim = attach({ proc: proc });
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
  nvim.on('notification', (y: any, x: any) => {
    if (vscode.window.activeTextEditor && y === 'redraw') {
      Vim.screen.redraw(x);
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

process.on('unhandledRejection', function (reason: any, p: any) {
  console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});
