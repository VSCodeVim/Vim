'use strict';

import * as vscode from 'vscode';
import { Global } from "./extension";
import { TextEditor } from "./src/textEditor";


export class Neovim {
  static async copyTextFromNeovim(text: string) {
    const buf = await Global.nvim.getCurrentBuf();
    await TextEditor.replace(
      new vscode.Range(0, 0, TextEditor.getLineCount() - 1,
        TextEditor.getLineMaxColumn(TextEditor.getLineCount() - 1)),
      (await buf.getLines(0, -1, false)).join('\n')
    );
  }
  private static async getPos(name: string):Promise<[number, number]> {
    let [row, character] = (await Global.nvim.callFunction("getpos", [name]) as Array<number>).slice(1, 3);
    return [row - 1, character - 1];
  }
  static async getCursorPosition(): Promise<[number, number]> {
    return this.getPos(".");
  }

  static async getSelectionStartPosition(): Promise<[number, number]> {
    return this.getPos("v");
  }

}