import { optWhitespace, Parser, seq } from 'parsimmon';
import { Range } from 'vscode';
import { configuration } from '../../configuration/configuration';
import { isVisualMode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { bangParser, numberParser } from '../../vimscript/parserUtils';
import { SetCommand } from './set';

export interface IRetabCommandArguments {
  replaceSpaces: boolean;
  newTabstop?: number;
}

interface UpdatedLineSegment {
  value: string;
  length: number;
}

// :[range]ret[ab][!] [new_tabstop]
export class RetabCommand extends ExCommand {
  public static readonly argParser: Parser<RetabCommand> = seq(
    bangParser,
    optWhitespace.then(numberParser).fallback(undefined),
  ).map(
    ([replaceSpaces, newTabstop]) =>
      new RetabCommand({
        replaceSpaces,
        newTabstop,
      }),
  );

  private readonly arguments: IRetabCommandArguments;

  constructor(args: IRetabCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    if (isVisualMode(vimState.currentMode)) {
      const { start, end } = vimState.editor.selection;
      this.retab(vimState, start.line, end.line);
    } else {
      this.retab(vimState, 0, vimState.document.lineCount - 1);
    }
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { start, end } = range.resolve(vimState);
    this.retab(vimState, start, end);
  }

  private concat(count: number, char: string): string {
    let result = '';

    for (let i = 0; i < count; i++) {
      result += char;
    }

    return result;
  }

  private hasTabs(str: string): boolean {
    return str.indexOf('\t') >= 0;
  }

  expandtab(str: string, start = 0, tabstop = configuration.tabstop): string {
    let expanded = '';

    let i = start;
    for (const char of str) {
      if (char === '\t') {
        const spaces = tabstop - (i % tabstop) || tabstop;

        expanded += this.concat(spaces, ' ');
        i += spaces;
      } else {
        expanded += char;
        i++;
      }
    }

    return expanded;
  }

  retabLineSegment(
    segment: string,
    start: number,
    tabstop = configuration.tabstop,
  ): UpdatedLineSegment {
    const retab = this.arguments.replaceSpaces || this.hasTabs(segment);

    if (!retab) {
      return {
        value: segment,
        length: segment.length,
      };
    }

    const retabTabstop = this.arguments.newTabstop || tabstop;
    const detabbed = this.expandtab(segment, start, tabstop);

    const spaces = Math.min((start + detabbed.length) % retabTabstop, detabbed.length);
    const tabs = Math.ceil((detabbed.length - spaces) / retabTabstop);

    let result = '';

    result += this.concat(tabs, '\t');
    result += this.concat(spaces, ' ');

    return {
      value: result,
      length: detabbed.length,
    };
  }

  retabLine(line: string, tabstop = configuration.tabstop): string {
    const segments = line.split(/(\s+)/);
    let i = 0;

    let retabbed = '';
    for (const str of segments) {
      if (!str) {
        continue;
      }

      if (![' ', '\t'].includes(str[0])) {
        retabbed += str;
        i += str.length;
      } else {
        const result = this.retabLineSegment(str, i, tabstop);

        retabbed += result.value;
        i += result.length;
      }
    }

    return retabbed;
  }

  public retab(vimState: VimState, startLine: number, endLine: number) {
    const originalLines: string[] = [];

    const lastLine = Math.min(endLine, vimState.document.lineCount - 1);
    for (let i = startLine; i <= lastLine; i++) {
      originalLines.push(vimState.document.lineAt(i).text);
    }

    const replacedLines = originalLines.map((line: string) => {
      return configuration.expandtab ? this.expandtab(line) : this.retabLine(line);
    });

    const replacedContent = replacedLines.join('\n');
    const lastLineLength = originalLines[originalLines.length - 1].length;

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      range: new Range(startLine, 0, endLine, lastLineLength),
      text: replacedContent,
    });

    if (this.arguments.newTabstop) {
      const setTabstop = new SetCommand({
        type: 'equal',
        option: 'tabstop',
        value: this.arguments.newTabstop.toString(),
      });

      void setTabstop.execute(vimState);
    }
  }
}
