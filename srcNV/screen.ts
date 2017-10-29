import * as vscode from 'vscode';
import { Position } from '../src/common/motion/position';
import { TextEditor } from '../src/textEditor';
import { VimSettings } from './vimSettings';
import { NvUtil } from './nvUtil';
import { Vim } from '../extension';
export class Cell {
  v: string;
  highlight: any;
  constructor(v: string) {
    this.v = v;
    this.highlight = {};
  }
}

export interface IgnoredKeys {
  all: string[];
  normal: string[];
  insert: string[];
  visual: string[];
}
export interface HighlightGroup {
  hlGroup: string;
  vimColor: number;
  decorator: vscode.TextEditorDecorationType;
}

const _caretDecoration = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(240, 240, 240, 0.6)',
  borderColor: 'rgba(0, 0, 0, 1.0)',
  borderStyle: 'solid',
  borderWidth: '1px',
});

export class Screen {
  term: Array<Array<Cell>> = [];
  x: number;
  y: number;
  size: number;
  highlighter: any;
  cmdline: vscode.StatusBarItem[];
  highlightGroups: HighlightGroup[];

  constructor(size: number) {
    this.size = size;
    for (let i = 0; i < this.size; i++) {
      this.term[i] = [];
      for (let j = 0; j < this.size; j++) {
        this.term[i][j] = new Cell(' ');
      }
    }
    this.x = 0;
    this.y = 0;
    this.highlighter = {};
    this.cmdline = [];
    for (let i = 0; i < 10; i++) {
      this.cmdline.push(
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10000 - i)
      );
      this.cmdline[i].show();
    }
    let idx = 1;
    let hlGroups = [
      {
        hlGroup: 'IncSearch',
        vimColor: idx++,
        decorator: vscode.window.createTextEditorDecorationType({
          backgroundColor: new vscode.ThemeColor('editor.findMatchBackground'),
        }),
      },
      {
        hlGroup: 'Search',
        vimColor: idx++,
        decorator: vscode.window.createTextEditorDecorationType({
          backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
        }),
      },
    ];
    for (const group of hlGroups) {
      Vim.nv.command(`highlight ${group.hlGroup} guibg='#00000${group.vimColor}'`);
    }
    this.highlightGroups = hlGroups;
  }
  private async handleModeChange(mode: [string, number]) {
    if (mode[0] === 'insert') {
      await NvUtil.setSettings(await VimSettings.insertModeSettings());
    } else {
      await NvUtil.updateMode();
      await NvUtil.copyTextFromNeovim();
      await NvUtil.changeSelectionFromMode(
        Vim.mode.mode,
        await NvUtil.getCursorPos(),
        await NvUtil.getSelectionStartPos()
      );
      await NvUtil.setSettings(VimSettings.normalModeSettings);
    }
    const ignoreKeys: IgnoredKeys = vscode.workspace
      .getConfiguration('vim')
      .get('ignoreKeys') as IgnoredKeys;
    if (mode[0] === 'insert') {
      for (const key of ignoreKeys.visual.concat(ignoreKeys.normal)) {
        vscode.commands.executeCommand('setContext', `vim.use_${key}`, true);
      }
      for (const key of ignoreKeys.insert) {
        vscode.commands.executeCommand('setContext', `vim.use_${key}`, false);
      }
    } else if (mode[0] === 'visual') {
      for (const key of ignoreKeys.normal.concat(ignoreKeys.insert)) {
        vscode.commands.executeCommand('setContext', `vim.use_${key}`, true);
      }
      for (const key of ignoreKeys.visual) {
        vscode.commands.executeCommand('setContext', `vim.use_${key}`, false);
      }
    } else {
      // I assume normal is just all "other" modes.
      for (const key of ignoreKeys.visual.concat(ignoreKeys.insert)) {
        vscode.commands.executeCommand('setContext', `vim.use_${key}`, true);
      }
      for (const key of ignoreKeys.normal) {
        vscode.commands.executeCommand('setContext', `vim.use_${key}`, false);
      }
    }
    for (const key of ignoreKeys.all) {
      vscode.commands.executeCommand('setContext', `vim.use_${key}`, false);
    }
  }
  redraw(changes: Array<any>) {
    for (let change of changes) {
      change = change as Array<any>;
      const name = change[0];
      const args = change.slice(1);
      if (name === 'cursor_goto') {
        this.y = args[0][0];
        this.x = args[0][1];
      } else if (name === 'eol_clear') {
        for (let i = 0; i < this.size - this.x; i++) {
          this.term[this.y][this.x + i].v = ' ';
          this.term[this.y][this.x + i].highlight = {};
        }
      } else if (name === 'put') {
        for (const cs of args) {
          for (const c of cs) {
            this.term[this.y][this.x].v = c;
            this.term[this.y][this.x].highlight = this.highlighter;
            this.x += 1;
          }
        }
      } else if (name === 'highlight_set') {
        this.highlighter = args[args.length - 1][0];
      } else if (name === 'mode_change') {
        this.handleModeChange(args[0]);
      } else {
        console.log(name);
        console.log(args);
      }
    }

    console.log(Vim.mode);
    if (Vim.mode.mode === 'c' || '-:'.indexOf(this.term[this.size - 1][0].v) !== -1) {
      this.cmdline[0].text = this.term[this.size - 1].map(x => x.v).join('');
    } else {
      this.cmdline[0].text = '';
    }
    const wildmenuText = this.term[this.size - 2]
      .map(x => x.v)
      .join('')
      .replace(/\s+$/, '');
    let wildmenu: string[] = wildmenuText.split(/\s+/);
    // Doesn't always work, who cares??? What a pain in the ass. I don't want to not use regex.
    let wildmenuIdx = wildmenu.map(x => wildmenuText.indexOf(x));
    if (wildmenu[0] === '<' || wildmenu[wildmenu.length - 1] === '>') {
      for (let i = 0; i < wildmenu.length; i++) {
        this.cmdline[i + 1].text = wildmenu[i];
        this.cmdline[i + 1].show();
        if (this.term[this.size - 2][wildmenuIdx[i]].highlight.hasOwnProperty('foreground')) {
          // console.log(this.term[this.size - 2][wil]);
          this.cmdline[i + 1].color = 'red';
        } else {
          this.cmdline[i + 1].color = 'white';
        }
      }
      for (let i = wildmenu.length; i < this.cmdline.length - 1; i++) {
        this.cmdline[i + 1].hide();
      }
    } else {
      for (let i = 1; i < this.cmdline.length; i++) {
        this.cmdline[i].hide();
      }
    }
    if (!vscode.workspace.getConfiguration('vim').get('enableHighlights')) {
      return;
    }
    for (const group of this.highlightGroups) {
      let decorations: vscode.Range[] = [];
      let result = '';
      for (let i = 0; i < this.size; i++) {
        let isRange = false;
        let start = 0;
        for (let j = 0; j < this.size; j++) {
          result += this.term[i][j].v;
          if (!isRange && this.term[i][j].highlight.background === group.vimColor) {
            start = j;
            isRange = true;
          } else if (isRange && !(this.term[i][j].highlight.background === group.vimColor)) {
            isRange = false;
            decorations.push(
              new vscode.Range(new vscode.Position(i, start), new vscode.Position(i, j))
            );
          }
        }
        result += '\n';
      }

      if (vscode.window.activeTextEditor) {
        vscode.window.activeTextEditor!.setDecorations(group.decorator, decorations);
      }
    }
  }
}
