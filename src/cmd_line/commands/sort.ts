import * as vscode from 'vscode';

import { isVisualMode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import * as node from '../node';

export interface ISortCommandArguments extends node.ICommandArgs {
  reverse: boolean;
  ignoreCase: boolean;
  unique: boolean;
}

export class SortCommand extends node.CommandBase {
  private readonly arguments: ISortCommandArguments;

  constructor(args: ISortCommandArguments) {
    super();
    this.arguments = args;
  }

  public neovimCapable(): boolean {
    return true;
  }

  async execute(vimState: VimState): Promise<void> {
    if (isVisualMode(vimState.currentMode)) {
      const { start, end } = vimState.editor.selection;
      await this.sortLines(vimState, start.line, end.line);
    } else {
      await this.sortLines(vimState, 0, vimState.document.lineCount - 1);
    }
  }

  async sortLines(vimState: VimState, startLine: number, endLine: number) {
    let originalLines: string[] = [];

    for (
      let currentLine = startLine;
      currentLine <= endLine && currentLine < vimState.document.lineCount;
      currentLine++
    ) {
      originalLines.push(vimState.document.lineAt(currentLine).text);
    }
    if (this.arguments.unique) {
      originalLines = [...new Set(originalLines)];
    }

    const lastLineLength = originalLines[originalLines.length - 1].length;

    const sortedLines = this.arguments.ignoreCase
      ? originalLines.sort((a: string, b: string) => a.localeCompare(b))
      : originalLines.sort();

    if (this.arguments.reverse) {
      sortedLines.reverse();
    }

    const sortedContent = sortedLines.join('\n');

    await TextEditor.replace(
      vimState.editor,
      new vscode.Range(startLine, 0, endLine, lastLineLength),
      sortedContent
    );
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);

    await this.sortLines(vimState, start, end);
  }
}
