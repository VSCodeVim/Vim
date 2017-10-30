'use strict';

import * as vscode from 'vscode';
import { Vim } from '../extension';
import { TextEditor } from '../src/textEditor';
import { Position } from '../src/common/motion/position';
import { Configuration } from '../src/configuration/configuration';

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
      backgroundColor: 'rgba(240, 240, 240, 0.6)',
      borderColor: 'rgba(0, 0, 0, 1.0)',
    },
    light: {
      // used for light colored themes
      backgroundColor: 'rgba(32, 32, 32, 0.6)',
      borderColor: 'rgba(0, 0, 0, 1.0)',
    },
    borderStyle: 'solid',
    borderWidth: '1px',
  });

  static async copyTextFromNeovim() {
    Vim.numVimChangesToApply++;
    let lines = await Vim.nv.buffer.lines;
    TextEditor.replace(
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
      // todo(chilli): Causes race condition that seems very tricky to fix :/
      // await Vim.nv.input('<C-g>U<Right>'.repeat(target - start));
    } else if (start > target) {
      await Vim.nv.input('<C-g>U<Left>'.repeat(start - target));
    }
  }
  static atomCall(funcName: string, args?: any[]): Array<any> {
    if (args) {
      return ['nvim_call_function', [funcName, args]];
    } else {
      return ['nvim_call_function', [funcName, []]];
    }
  }

  static atomCommand(command: string): Array<any> {
    return ['nvim_command', [command]];
  }

  static atomBufSetLines(
    lines: Array<string>,
    buffer = 0,
    start = 0,
    end = -1,
    strictIndexing = 1
  ) {
    return ['nvim_buf_set_lines', [buffer, start, end, strictIndexing, lines]];
  }

  static atomFeedKeys(keys: string, mode = '', escapeCsi = false) {
    return ['nvim_feed_keys', [keys, mode, escapeCsi]];
  }

  // An utility function for joining multiple arrays for use in nvim_atomic_call
  static atomJoin(...arrays: Array<any>): Array<any> {
    let ret: Array<any> = [];
    for (const a of arrays) {
      if (a[0] instanceof Array) {
        ret.concat(a);
      } else {
        ret = ret.concat([a]);
      }
    }
    return ret;
  }

  static async setSelection(pos: vscode.Range) {
    await Vim.nv.callAtomic(
      NvUtil.atomJoin(
        NvUtil.atomCall('setpos', ['.', [0, pos.start.line + 1, pos.start.character + 1, false]]),
        NvUtil.atomFeedKeys('v'),
        NvUtil.atomCall('setpos', ['.', [0, pos.end.line + 1, pos.end.character + 1, false]])
      )
    );
  }

  private static async getPos(name: string): Promise<Position> {
    let [row, character] = ((await Vim.nv.callFunction('getpos', [name])) as Array<number>).slice(
      1,
      3
    );
    return new Position(row - 1, character - 1);
  }

  static async getCurWant(): Promise<number> {
    return (await Vim.nv.call('getcurpos'))[4] - 1;
  }

  static async getCursorPos(): Promise<Position> {
    return this.getPos('.');
  }

  static async getSelectionStartPos(): Promise<Position> {
    return this.getPos('v');
  }
  static async getUndoTree(): Promise<UndoTree> {
    return (await Vim.nv.call('undotree', [])) as UndoTree;
  }
  static async changeSelectionFromMode(mode: string) {
    return this.changeSelectionFromModeSync(
      mode,
      await this.getCursorPos(),
      await this.getSelectionStartPos(),
      await this.getCurWant()
    );
  }

  static changeSelectionFromModeSync(
    mode: string,
    curPos: Position,
    startPos: Position,
    curWant: number
  ) {
    const cursorPos = new Position(curPos.line, curPos.character);
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
        const left = Math.min(startPos.character, curWant);
        const right = Math.max(startPos.character, curWant) + 1;
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
        vscode.window.activeTextEditor!.options.cursorStyle = Configuration.userCursor;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(curPos, curPos);
        break;
      case 'R':
        vscode.window.activeTextEditor!.options.cursorStyle =
          vscode.TextEditorCursorStyle.Underline;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(curPos, curPos);
        break;
      case 'n':
      default:
        vscode.window.activeTextEditor!.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
        vscode.window.activeTextEditor!.selection = new vscode.Selection(curPos, curPos);
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

  static async updateMode() {
    Vim.mode = await Vim.nv.mode;
  }

  static async setSettings(arg: Array<string>) {
    Vim.nv.command(`set ${arg.join(' ')}`);
  }
}
