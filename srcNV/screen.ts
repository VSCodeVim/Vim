import * as vscode from 'vscode';
import { Position } from '../src/common/motion/position';
export class Cell {
  v: string;
  highlight: Object;
  constructor(v: string) {
    this.v = v;
    this.highlight = {};
  }
}

const _caretDecoration = vscode.window.createTextEditorDecorationType({
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
export class Screen {
  term: Array<Array<Cell>> = [];
  x: number;
  y: number;
  size: number;
  highlighter: Object;
  cmdline: vscode.StatusBarItem;
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
    this.cmdline = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10000);
    this.cmdline.show();
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
          this.term[this.y][this.x + i] = new Cell(' ');
        }
      } else if (name === 'put') {
        for (const cs of args) {
          for (const c of cs) {
            this.term[this.y][this.x] = new Cell(c);
            this.term[this.y][this.x].highlight = this.highlighter;
            this.x += 1;
          }
        }
      } else if (name === 'highlight_set') {
        this.highlighter = args[0][0];
      } else {
        console.log(name);
        console.log(args);
      }
    }
    let highlighted = [];
    let result = '';
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        result += this.term[i][j].v;
        if (Object.keys(this.term[i][j].highlight).length !== 0) {
          highlighted.push([i, j, Object.keys(this.term[i][j].highlight)]);
        }
      }
      result += '\n';
    }
    // console.log(result);
    let decorations = [];
    for (const i of highlighted) {
      if (
        i[2][0] === 'background' ||
        i[2][0] === 'reverse' ||
        i[2][0] === 'foreground' ||
        ((i[2] as string[]).length > 0 && i[2][0] !== 'bold')
      ) {
        if (i[2][0] === 'foreground') {
          const foregroundDec = vscode.window.createTextEditorDecorationType({
            dark: {
              // used for dark colored themes
              backgroundColor: 'rgba(240, 120, 120, 0.6)',
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
          const pos = new Position(i[0] as number, i[1] as number);
          decorations.push(new vscode.Range(pos, pos.getRight()));
        } else {
          const pos = new Position(i[0] as number, i[1] as number);
          decorations.push(new vscode.Range(pos, pos.getRight()));
        }
      }
    }
    this.cmdline.text = this.term[this.size - 1].map(x => x.v).join('');
    // vscode.window.activeTextEditor!.setDecorations(_caretDecoration, decorations);
    // _caretDecoration.dispose();
    console.log(highlighted);
    console.log('----------------');
  }
}
