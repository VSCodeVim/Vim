import * as vscode from 'vscode';
import { PositionDiff } from '../../common/motion/position';

import { isVisualMode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
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

  public override neovimCapable(): boolean {
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
      const seen = new Set<string>();
      const uniqueLines: string[] = [];
      for (const line of originalLines) {
        const adjustedLine = this.arguments.ignoreCase ? line.toLowerCase() : line;
        if (!seen.has(adjustedLine)) {
          seen.add(adjustedLine);
          uniqueLines.push(line);
        }
      }
      originalLines = uniqueLines;
    }

    const lastLineLength = originalLines[originalLines.length - 1].length;

    const sortedLines = this.arguments.ignoreCase
      ? originalLines.sort((a: string, b: string) => a.localeCompare(b))
      : originalLines.sort();

    if (this.arguments.reverse) {
      sortedLines.reverse();
    }

    const sortedContent = sortedLines.join('\n');

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      range: new vscode.Range(startLine, 0, endLine, lastLineLength),
      text: sortedContent,
      diff: PositionDiff.exactPosition(
        new vscode.Position(startLine, sortedLines[0].match(/\S/)?.index ?? 0)
      ),
    });
  }

  override async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);

    await this.sortLines(vimState, start, end);
  }
}
