import * as vscode from 'vscode';

import { ModeName } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import * as node from '../node';
import * as token from '../token';

export interface ISortCommandArguments extends node.ICommandArgs {
  reverse: boolean;
  ignoreCase: boolean;
}

export class SortCommand extends node.CommandBase {
  protected _arguments: ISortCommandArguments;

  constructor(args: ISortCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): ISortCommandArguments {
    return this._arguments;
  }

  public neovimCapable(): boolean {
    return true;
  }

  async execute(vimState: VimState): Promise<void> {
    let mode = vimState.currentMode;
    if ([ModeName.Visual, ModeName.VisualBlock, ModeName.VisualLine].includes(mode)) {
      const selection = vimState.editor.selection;
      let start = selection.start;
      let end = selection.end;
      if (start.isAfter(end)) {
        [start, end] = [end, start];
      }
      await this.sortLines(start, end);
    } else {
      await this.sortLines(
        new vscode.Position(0, 0),
        new vscode.Position(TextEditor.getLineCount() - 1, 0)
      );
    }
  }

  async sortLines(startLine: vscode.Position, endLine: vscode.Position) {
    let originalLines: String[] = [];

    for (
      let currentLine = startLine.line;
      currentLine <= endLine.line && currentLine < TextEditor.getLineCount();
      currentLine++
    ) {
      originalLines.push(TextEditor.readLineAt(currentLine));
    }

    let lastLineLength = originalLines[originalLines.length - 1].length;

    let sortedLines = this._arguments.ignoreCase
      ? originalLines.sort((a: string, b: string) => a.localeCompare(b))
      : originalLines.sort();

    if (this._arguments.reverse) {
      sortedLines.reverse();
    }

    let sortedContent = sortedLines.join('\n');

    await TextEditor.replace(
      new vscode.Range(startLine.line, 0, endLine.line, lastLineLength),
      sortedContent
    );
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    let startLine: vscode.Position;
    let endLine: vscode.Position;

    if (range.left[0].type === token.TokenType.Percent) {
      startLine = new vscode.Position(0, 0);
      endLine = new vscode.Position(TextEditor.getLineCount() - 1, 0);
    } else {
      startLine = range.lineRefToPosition(vimState.editor, range.left, vimState);
      endLine = range.lineRefToPosition(vimState.editor, range.right, vimState);
    }

    await this.sortLines(startLine, endLine);
  }
}
