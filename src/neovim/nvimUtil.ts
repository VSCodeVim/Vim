"use strict";

import * as vscode from "vscode";
import { VimState } from "../mode/modeHandler";
import { Position } from './../common/motion/position';
import { TextEditor } from "../textEditor";
import { Configuration } from '../configuration/configuration';
import { spawn } from "child_process";
import { attach } from "promised-neovim-client";
import { Register, RegisterMode } from "../register/register";
import { ModeName } from "../mode/mode";
import * as fs from "fs";
import * as os from "os";

type UndoTree = {entries: Array<{seq: number, time: number}>, save_cur: number, save_last: number, seq_cur: number, seq_last: number, synced: number, time_cur: number};

export class Neovim {

  static async initNvim(vimState: VimState) {
    this.syncVSSettingsToVim();
    const proc = spawn(Configuration.neovimPath, ['-u', '~/.config/nvim/init.vim', '-N', '--embed'], { cwd: __dirname });
    proc.on('error', function (err) {
      console.log(err);
      vscode.window.showErrorMessage("Unable to setup neovim instance! Check your path.");
      Configuration.enableNeovim = false;
    });
    vimState.nvim = await attach(proc.stdin, proc.stdout);
  }

  // Data flows from VS to Vim
  static async syncVSToVim(vimState: VimState) {
    const nvim = vimState.nvim;
    const buf = await nvim.getCurrentBuf();
    await buf.setLines(0, -1, true, TextEditor.getText().split('\n'));
    const [rangeStart, rangeEnd] = [Position.EarlierOf(vimState.cursorPosition, vimState.cursorStartPosition),
    Position.LaterOf(vimState.cursorPosition, vimState.cursorStartPosition)];
    await nvim.callFunction("setpos", [".", [0, vimState.cursorPosition.line + 1, vimState.cursorPosition.character, false]]);
    await nvim.callFunction("setpos", ["'<", [0, rangeStart.line + 1, rangeEnd.character, false]]);
    await nvim.callFunction("setpos", ["'>", [0, rangeEnd.line + 1, rangeEnd.character, false]]);
    for (const mark of vimState.historyTracker.getMarks()) {
      await nvim.callFunction("setpos", [`'${mark.name}`, [0, mark.position.line + 1, mark.position.character, false]]);
    }

    const effectiveRegisterMode = (register: RegisterMode) => {
      if (register === RegisterMode.FigureItOutFromCurrentMode) {
        if (vimState.currentMode === ModeName.VisualLine) {
          return RegisterMode.LineWise;
        } else if (vimState.currentMode === ModeName.VisualBlock) {
          return RegisterMode.BlockWise;
        } else {
          return RegisterMode.CharacterWise;
        }
      } else {
        return register;
      }
    };

    // We only copy over " register for now, due to our weird handling of macros.
    let reg = await Register.get(vimState);
    let vsRegTovimReg = [undefined, "c", "l", "b"];
    await nvim.callFunction("setreg", ['"', reg.text as string, vsRegTovimReg[effectiveRegisterMode(reg.registerMode)] as string]);
  }

  // Data flows from Vim to VS
  static async syncVimToVs(vimState: VimState) {
    const nvim = vimState.nvim;
    const buf = await nvim.getCurrentBuf();

    await TextEditor.replace(
      new vscode.Range(0, 0, TextEditor.getLineCount() - 1,
        TextEditor.getLineMaxColumn(TextEditor.getLineCount() - 1)),
      (await buf.getLines(0, -1, false)).join('\n')
    );

    let [row, character] = (await nvim.callFunction("getpos", ["."]) as Array<number>).slice(1, 3);
    vimState.editor.selection = new vscode.Selection(new Position(row - 1, character), new Position(row - 1, character));
    vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.active)
    vimState.cursorStartPosition = Position.FromVSCodePosition(vimState.editor.selection.anchor);

    // We're only syncing back the default register for now, due to the way we could
    // be storing macros in registers.
    const vimRegToVsReg = { "v": RegisterMode.CharacterWise, "V": RegisterMode.LineWise, "\x16": RegisterMode.BlockWise };
    vimState.currentRegisterMode = vimRegToVsReg[await nvim.callFunction("getregtype", ['"']) as string];
    Register.put(await nvim.callFunction("getreg", ['"']) as string, vimState);
  }

  static async command(vimState: VimState, command: string) {
    const nvim = vimState.nvim;
    await this.syncVSToVim(vimState);
    command = ":" + command + "\n";
    command = command.replace('<', '<lt>');

    await nvim.input(command);
    if ((await nvim.getMode()).blocking) {
      await nvim.input('<esc>');
    }
    await this.syncVimToVs(vimState);

    return;
  }

  static async input(vimState: VimState, keys: string) {
    const nvim = vimState.nvim;
    await this.syncVSToVim(vimState);
    await nvim.input(keys);
    await this.syncVimToVs(vimState);
    return;
  }

  static async inputNoSync(vimState: VimState, keys: string) {
    await vimState.nvim.input(keys);
  }

  static async getUndoTree(vimState: VimState): Promise<UndoTree> {
    return await vimState.nvim.callFunction("undotree", []) as UndoTree;
  }

  static async syncVSSettingsToVim() {
    const editorSettings = vscode.workspace.getConfiguration("editor");
    const currentFileSettings = vscode.window.activeTextEditor!.options;
    const vimSettings = vscode.workspace.getConfiguration("vim");
    const settingsPath = vimSettings.neovimSettingsPath;
    const plugins: Array<String> = vimSettings.neovimPlugins;

    const BEGINNING_MESSAGE =
`"Do not touch this block. These lines will be overwritten by VSCodeVim upon startup"
"Future customization of this portion of code will come eventually"
`;
    const PLUGIN_BEGIN =
`call plug#begin('~/.config/nvim/plugged')
`;
    const PLUGIN_LIST = plugins.map(x => `Plug '${ x }'\n`).join('');
    const PLUGIN_END =
`call plug#end()
PlugInstall
hide
`;
    const settingsMap = [
      [vimSettings.ignorecase, 'ignorecase'],
      [vimSettings.smartcase, 'smartcase'],
      [vimSettings.hlsearch, 'hlsearch'],
      [vimSettings.incsearch, 'incsearch'],
      [currentFileSettings.insertSpaces, 'expandtab'],
      [currentFileSettings.tabSize, 'tabstop'],
      [currentFileSettings.tabSize, 'shiftwidth']
      ]

    const SETTINGS= settingsMap.map(
      ([vsSettingVal, settingName]) =>{
        if (typeof vsSettingVal === "boolean") {
          return (vsSettingVal ? `set ${ settingName }\n` : '');
        } else {
          return `set ${ settingName }=${ vsSettingVal }\n`;
        }
      }).join('');
    const END_MESSAGE =
`"---VSCode Config Done---"
`;

    let origConfig: String;
    try {
      origConfig = fs.readFileSync(settingsPath).toString();
    } catch (err) {
      origConfig = "";
    }

    let newLines = [
      BEGINNING_MESSAGE,
      PLUGIN_BEGIN,
      PLUGIN_LIST,
      PLUGIN_END,
      SETTINGS,
      END_MESSAGE
    ];
    const endMessagePos = origConfig.indexOf(END_MESSAGE);
    if (endMessagePos !== -1) {
      origConfig = origConfig.substring(endMessagePos + END_MESSAGE.length);
    }
    const text = newLines.join('') + origConfig;
    fs.writeFileSync(settingsPath, text);
    return;
  }

}