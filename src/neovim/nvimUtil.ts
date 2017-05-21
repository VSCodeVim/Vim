"use strict";

import * as vscode from "vscode";
import { VimState } from "../mode/modeHandler";
import { Position } from './../common/motion/position';
import { TextEditor } from "../textEditor";
import { Configuration } from '../configuration/configuration';
import { spawn } from "child_process";
import { attach } from "promised-neovim-client";
import { Register } from "../register/register";

export class Neovim {

  static async initNvim(vimState: VimState) {
    const proc = spawn(Configuration.neovimPath, ['-u', 'NONE', '-N', '--embed'], {cwd: __dirname });
    vimState.nvim = await attach(proc.stdin, proc.stdout);
    const nvim = vimState.nvim;
    await nvim.setOption("clipboard", await nvim.getOption("clipboard") + "unnamed");
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
    for (const mark of vimState.historyTracker.getMarks()){
      await nvim.callFunction("setpos", [`'${mark.name}`, [0, mark.position.line + 1, mark.position.character, false]]);
    }
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

    let [row, character]  = (await nvim.callFunction("getpos", ["."]) as Array<number>).slice(1, 3);
    vimState.editor.selection = new vscode.Selection(new Position(row - 1, character), new Position(row - 1, character));

    if (Configuration.expandtab) {
      await vscode.commands.executeCommand("editor.action.indentationToSpaces");
    }
    // We're only syncing back the default register for now, due to the way we could
    // be storing macros in registers.
    // I also can't figure out how to properly set register variables right
    // now, so this is a temporary solution.
    if (await nvim.eval('@"') !== "") {
      Register.put(await nvim.eval('@"') as string, vimState);
    }
  }

  static async command(vimState: VimState, command: string) {
    const nvim = vimState.nvim;
    await this.syncVSToVim(vimState);
    // console.log(await nvim.getMode());
    await nvim.command(command);
    // command = ":<C-U>" + command + "\n";
    // for (const key of command) {
    //   await nvim.input(key);
    // }
    // console.log(command);
    // await nvim.input(command);
    // console.log(await nvim.eval("v:errmsg"));
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

}