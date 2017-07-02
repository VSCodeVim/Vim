'use strict';

import * as vscode from 'vscode';
import { Vim } from './extension';
import { TextEditor } from './src/textEditor';
import { Position } from './src/common/motion/position';

export class NvUtil {
  static async copyTextFromNeovim() {
    const lines = await Vim.nv.buffer.lines;
    await TextEditor.replace(
      new vscode.Range(
        0,
        0,
        TextEditor.getLineCount() - 1,
        TextEditor.getLineMaxColumn(TextEditor.getLineCount() - 1)
      ),
      (await lines).join('\n')
    );
  }

  static async setCursorPos(pos: vscode.Position) {
    await Vim.nv.callFunction('setpos', ['.', [0, pos.line + 1, pos.character + 1, false]]);
  }

  static async setSelection(pos: vscode.Range) {
    await Vim.nv.callFunction('setpos', [
      '.',
      [0, pos.start.line + 1, pos.start.character + 1, false],
    ]);
    await Vim.nv.feedKeys('v', '', false);
    await Vim.nv.callFunction('setpos', ['.', [0, pos.end.line + 1, pos.end.character + 1, false]]);
    // await Vim.nv.callFunction("setpos", ["'", [0, pos.line + 1, pos.character + 1, false]]);
  }

  private static async getPos(name: string): Promise<[number, number]> {
    let [row, character] = ((await Vim.nv.callFunction('getpos', [name])) as Array<number>).slice(
      1,
      3
    );
    return [row - 1, character - 1];
  }

  static async getCursorPos(): Promise<[number, number]> {
    return this.getPos('.');
  }

  static async getSelectionStartPos(): Promise<[number, number]> {
    return this.getPos('v');
  }

  static async changeSelectionFromMode(mode: string): Promise<void> {
    let [row, character] = await NvUtil.getCursorPos();
    let [startRow, startCharacter] = await NvUtil.getSelectionStartPos();
    switch (mode) {
      case 'v':
      case 'V':
        let startPos = new Position(startRow, startCharacter);
        let curPos = new Position(row, character);
        if (startPos.isBeforeOrEqual(curPos)) {
          curPos = curPos.getRightThroughLineBreaks();
        } else {
          startPos = startPos.getRightThroughLineBreaks();
        }
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(startPos, curPos);
        break;
      case 'i':
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(
          new Position(row, character),
          new Position(row, character)
        );
        break;
      case 'n':
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(
          new Position(row, character),
          new Position(row, character)
        );
        break;
      default:
        vscode.window.activeTextEditor!.selection = new vscode.Selection(
          new Position(row, character),
          new Position(row, character)
        );
        break;
    }
  }
}
