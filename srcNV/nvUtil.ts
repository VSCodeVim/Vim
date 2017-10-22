'use strict';

import * as vscode from 'vscode';
import { Vim } from '../extension';
import { TextEditor } from '../src/textEditor';
import { Position } from '../src/common/motion/position';

type UndoTree = {
  entries: Array<{ seq: number; time: number }>;
  save_cur: number;
  save_last: number;
  seq_cur: number;
  seq_last: number;
  synced: number;
  time_cur: number;
};

export class NvUtil {
  private static _caretDecoration = vscode.window.createTextEditorDecorationType({
    dark: {
      // used for dark colored themes
      backgroundColor: 'rgba(224, 224, 224, 0.4)',
      borderColor: 'rgba(0, 0, 0, 1.0)',
    },
    light: {
      // used for light colored themes
      backgroundColor: 'rgba(32, 32, 32, 0.4)',
      borderColor: 'rgba(0, 0, 0, 1.0)',
    },
    borderStyle: 'solid',
    borderWidth: '1px',
  });

  static async copyTextFromNeovim() {
    // const curTick = await Vim.nv.buffer.changedtick;
    // console.log(curTick, Vim.prevState.bufferTick);
    // if (curTick === Vim.prevState.bufferTick) {
    //   return;
    // }
    // Vim.prevState.bufferTick = curTick;
    const lines = await Vim.nv.buffer.lines;
    await TextEditor.replace(
      new vscode.Range(
        0,
        0,
        TextEditor.getLineCount() - 1,
        TextEditor.getLineMaxColumn(TextEditor.getLineCount() - 1)
      ),
      lines.join('\n')
    );
  }

  static async setCursorPos(pos: vscode.Position) {
    await Vim.nv.call('setpos', ['.', [0, pos.line + 1, pos.character + 1, false]]);
  }

  // Must be moving to same line
  static async ctrlGMove(start: number, target: number) {
    if (start < target) {
      await Vim.nv.input('<C-g>U<Right>'.repeat(target - start));
    } else if (start > target) {
      await Vim.nv.input('<C-g>U<Left>'.repeat(start - target));
    }
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

  static async getCurWant(): Promise<number> {
    return (await Vim.nv.call('getcurpos'))[4] - 1;
  }

  static async getCursorPos(): Promise<[number, number]> {
    return this.getPos('.');
  }

  static async getSelectionStartPos(): Promise<[number, number]> {
    return this.getPos('v');
  }
  static async getUndoTree(): Promise<UndoTree> {
    return (await Vim.nv.call('undotree', [])) as UndoTree;
  }

  static async changeSelectionFromMode(mode: string): Promise<void> {
    let [row, character] = await NvUtil.getCursorPos();
    let [startRow, startCharacter] = await NvUtil.getSelectionStartPos();
    let startPos = new Position(startRow, startCharacter);
    let curPos = new Position(row, character);
    const cursorPos = new Position(row, character);
    let cursorDecorations = [];
    switch (mode) {
      case 'v':
        if (startPos.isBeforeOrEqual(curPos)) {
          curPos = curPos.getRightThroughLineBreaks();
        } else {
          startPos = startPos.getRightThroughLineBreaks();
        }
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.LineThin;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(startPos, curPos);
        break;
      case 'V':
        if (startPos.isBeforeOrEqual(curPos)) {
          curPos = curPos.getLineEndIncludingEOL();
          startPos = startPos.getLineBegin();
        } else {
          curPos = curPos.getLineBegin();
          startPos = startPos.getLineEndIncludingEOL();
        }
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.LineThin;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(startPos, curPos);
        break;
      case '\x16':
        const top = Position.EarlierOf(curPos, startPos).line;
        const bottom = Position.LaterOf(curPos, startPos).line;
        const left = Math.min(startPos.character, await NvUtil.getCurWant());
        const right = Math.max(startPos.character, await NvUtil.getCurWant()) + 1;
        let selections = [];
        for (let line = top; line <= bottom; line++) {
          selections.push(
            new vscode.Selection(new Position(line, left), new Position(line, right))
          );
        }
        vscode.window.activeTextEditor!.selections = selections;
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.LineThin;

        break;
      case 'i':
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(startPos, curPos);
        break;
      case 'n':
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(startPos, curPos);
        break;
      default:
        break;
    }

    switch (mode) {
      case 'v':
        if (startPos.isEarlierThan(curPos)) {
          cursorDecorations.push(new vscode.Range(curPos.getLeft(), curPos));
        } else {
          cursorDecorations.push(new vscode.Range(curPos, curPos.getRight()));
        }
        break;
      case 'V':
        cursorDecorations.push(new vscode.Range(cursorPos, cursorPos.getRight()));
        break;
      case '\x16':
        cursorDecorations.push(new vscode.Range(curPos, curPos.getRight()));
        break;
      default:
        break;
    }
    vscode.window.activeTextEditor!.setDecorations(this._caretDecoration, cursorDecorations);
    vscode.window.activeTextEditor!.revealRange(new vscode.Range(cursorPos, cursorPos));
  }
}
