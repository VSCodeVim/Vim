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
  vimColor: number;
  decorator?: vscode.TextEditorDecorationType;
}

export class Screen {
  term: Array<Array<Cell>> = [];
  x: number;
  y: number;
  size: number;
  highlighter: any;
  cmdline: vscode.StatusBarItem;
  wildmenu: vscode.StatusBarItem[];
  highlightGroups: {
    IncSearch: HighlightGroup;
    Search: HighlightGroup;
  };

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
    this.cmdline = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10001);
    this.wildmenu = [];
    for (let i = 0; i < 10; i++) {
      this.wildmenu.push(
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10000 - i)
      );
      // this.wildmenu[i].show();
    }
    // todo(chilli): Offer some way of binding these from the client side.
    let hlGroups = {
      IncSearch: {
        vimColor: 1,
        decorator: vscode.window.createTextEditorDecorationType({
          backgroundColor: new vscode.ThemeColor('editor.findMatchBackground'),
        }),
      },
      Search: {
        vimColor: 2,
        decorator: vscode.window.createTextEditorDecorationType({
          backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
        }),
      },
      multiple_cursors_visual: {
        vimColor: 3,
        decorator: vscode.window.createTextEditorDecorationType({
          backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
        }),
      },
      multiple_cursors_cursor: {
        vimColor: 4,
        decorator: vscode.window.createTextEditorDecorationType({
          backgroundColor: new vscode.ThemeColor('editorCursor.foreground'),
        }),
      },
    };
    for (const hlGroup of Object.keys(hlGroups)) {
      Vim.nv.command(`highlight ${hlGroup} guibg='#00000${hlGroups[hlGroup].vimColor}'`);
    }
    this.highlightGroups = hlGroups;
  }
  private async handleModeChange(mode: [string, number]) {
    if (mode[0] === 'insert') {
      await NvUtil.setSettings(await VimSettings.insertModeSettings());
    } else {
      await NvUtil.updateMode();
      await NvUtil.copyTextFromNeovim();
      await NvUtil.changeSelectionFromMode(Vim.mode.mode);
      await NvUtil.setSettings(VimSettings.normalModeSettings);
    }
    // todo(chilli): Do this in a smarter way that generalizes to more categories ...
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
      } else if (name === 'cmdline_show') {
        console.log(name);
        let text = '';
        for (let hlText of args[0][0]) {
          text += hlText[1];
        }
        this.cmdline.text =
          args[0][2] +
          args[0][3] +
          ' '.repeat(args[0][4]) +
          text.slice(0, args[0][1]) +
          '|' +
          text.slice(args[0][1]);
        this.cmdline.show();
        console.log(args);
      } else if (
        [
          'cmdline_show',
          'cmdline_pos',
          'cmdline_special_char',
          'cmdline_hide',
          'cmdline_block_show',
          'cmdline_block_append',
          'cmdline_block_hide',
        ].indexOf(name) !== -1
      ) {
        // console.log(name);
        // console.log(args);
      } else {
        // console.log(name);
        // console.log(args);
      }
    }

    // If nvim is connected to a TUI, then we can't get external ui for cmdline/wildmenu.
    if (Vim.DEBUG) {
      if (Vim.mode.mode === 'c' || '-:'.indexOf(this.term[this.size - 1][0].v) !== -1) {
        this.cmdline.text = this.term[this.size - 1].map(x => x.v).join('');
        this.cmdline.show();
      } else {
        this.cmdline.text = '';
      }
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
        this.wildmenu[i].text = wildmenu[i];
        this.wildmenu[i].show();
        if (this.term[this.size - 2][wildmenuIdx[i]].highlight.hasOwnProperty('foreground')) {
          this.wildmenu[i].color = 'red';
        } else {
          this.wildmenu[i].color = 'white';
        }
      }
      for (let i = wildmenu.length; i < this.wildmenu.length; i++) {
        this.wildmenu[i].hide();
      }
    } else {
      for (let i = 0; i < this.wildmenu.length; i++) {
        this.wildmenu[i].hide();
      }
    }
    if (!vscode.workspace.getConfiguration('vim').get('enableHighlights')) {
      return;
    }
    for (const hlGroup of Object.keys(this.highlightGroups)) {
      const group = this.highlightGroups[hlGroup];
      if (group.decorator === undefined) {
        continue;
      }
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
