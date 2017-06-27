'use strict';

import * as vscode from 'vscode';
import { Vim } from "./extension";
import { TextEditor } from "./src/textEditor";


export class Neovim {
  static async copyTextFromNeovim() {
    const buf = await Vim.nv.getCurrentBuf();
    await TextEditor.replace(
      new vscode.Range(0, 0, TextEditor.getLineCount() - 1,
        TextEditor.getLineMaxColumn(TextEditor.getLineCount() - 1)),
      (await buf.getLines(0, -1, false)).join('\n')
    );
  }

  static async setCursorPos(pos: vscode.Position) {
    await Vim.nv.callFunction("setpos", [".", [0, pos.line + 1, pos.character + 1, false]]);
  }

  static async setSelection(pos: vscode.Range) {
    await Vim.nv.callFunction("setpos", [".", [0, pos.start.line + 1, pos.start.character + 1, false]]);
    await Vim.nv.feedkeys("v", "", false);;
    await Vim.nv.callFunction("setpos", [".", [0, pos.end.line + 1, pos.end.character + 1, false]]);
    // await Vim.nv.callFunction("setpos", ["'", [0, pos.line + 1, pos.character + 1, false]]);
  }

  private static async getPos(name: string):Promise<[number, number]> {
    let [row, character] = (await Vim.nv.callFunction("getpos", [name]) as Array<number>).slice(1, 3);
    return [row - 1, character - 1];
  }

  static async getCursorPos(): Promise<[number, number]> {
    return this.getPos(".");
  }

  static async getSelectionStartPos(): Promise<[number, number]> {
    return this.getPos("v");
  }

}