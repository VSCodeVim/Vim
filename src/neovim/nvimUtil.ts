"use strict";

import * as vscode from "vscode";
import {VimState, ModeHandler} from "../mode/modeHandler";
import { Position, PositionDiff } from './../common/motion/position';
import {attach, RPCValue} from 'promised-neovim-client';
import {spawn} from 'child_process';
import { TextEditor } from "../textEditor";
import { Configuration } from '../configuration/configuration';

export class Neovim {
  // Data flows from VS to Vim
  static async syncVSToVim(vimState: VimState) {
    const nvim = vimState.nvim;
    const buf = await nvim.getCurrentBuf();
    await buf.setLines(0, -1, true, TextEditor.getText().split('\n'));

    await nvim.callFunction("setpos", [".", [0, vimState.cursorPosition.line + 1, vimState.cursorPosition.character, false]]);
    await nvim.callFunction("setpos", ["'>", [0, vimState.cursorPosition.line + 1, vimState.cursorPosition.character, false]]);
    await nvim.callFunction("setpos", ["'<", [0, vimState.cursorStartPosition.line + 1, vimState.cursorStartPosition.character, false]]);
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
    vimState.editor.selection = new vscode.Selection(new Position(row-1, character), new Position(row-1, character));

    if (Configuration.expandtab) {
      await vscode.commands.executeCommand("editor.action.indentationToSpaces");
    }
  }

  static async command(vimState: VimState, command: string) {
    const nvim = vimState.nvim;
    await this.syncVSToVim(vimState);
    command = ":" + command + "\n";
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

}