import { oneOf, optWhitespace, Parser, seq } from 'parsimmon';
import { NumericString, NumericStringRadix } from '../../common/number/numericString';
import * as vscode from 'vscode';
import { PositionDiff } from '../../common/motion/position';

import { isVisualMode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { bangParser } from '../../vimscript/parserUtils';

export interface ISortCommandArguments {
  reverse: boolean;
  ignoreCase: boolean;
  unique: boolean;
  numeric: boolean;
  // TODO: support other flags
  // TODO(#6676): support pattern
}

export class SortCommand extends ExCommand {
  public static readonly argParser: Parser<SortCommand> = seq(
    bangParser,
    optWhitespace.then(oneOf('bfilnorux').many()),
  ).map(
    ([bang, flags]) =>
      new SortCommand({
        reverse: bang,
        ignoreCase: flags.includes('i'),
        unique: flags.includes('u'),
        numeric: flags.includes('n'),
      }),
  );

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

    const lastLineLength = originalLines[originalLines.length - 1].length;

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

    let sortedLines;
    if (this.arguments.numeric) {
      sortedLines = originalLines.sort(
        (a: string, b: string) =>
          (NumericString.parse(a, NumericStringRadix.Dec)?.num.value ?? Number.MAX_VALUE) -
          (NumericString.parse(b, NumericStringRadix.Dec)?.num.value ?? Number.MAX_VALUE),
      );
    } else if (this.arguments.ignoreCase) {
      sortedLines = originalLines.sort((a: string, b: string) => a.localeCompare(b));
    } else {
      sortedLines = originalLines.sort();
    }

    if (this.arguments.reverse) {
      sortedLines.reverse();
    }

    const sortedContent = sortedLines.join('\n');

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      range: new vscode.Range(startLine, 0, endLine, lastLineLength),
      text: sortedContent,
      diff: PositionDiff.exactPosition(
        new vscode.Position(startLine, sortedLines[0].match(/\S/)?.index ?? 0),
      ),
    });
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { start, end } = range.resolve(vimState);

    await this.sortLines(vimState, start, end);
  }
}
