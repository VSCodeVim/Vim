import { optWhitespace, Parser } from 'parsimmon';
import { Range, TextLine } from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';
import { numberParser } from '../../vimscript/parserUtils';

type LeftArgs = {
  indent: number;
};

export class LeftCommand extends ExCommand {
  public static readonly argParser: Parser<LeftCommand> = optWhitespace
    .then(numberParser.fallback(0))
    .map((indent) => new LeftCommand({ indent }));

  private args: LeftArgs;
  constructor(args: LeftArgs) {
    super();
    this.args = args;
  }

  async execute(vimState: VimState): Promise<void> {
    this.executeWithRange(vimState, new LineRange(new Address({ type: 'current_line' })));
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { start, end } = range.resolve(vimState);

    const lines: TextLine[] = [];
    for (let line = start; line <= end; line++) {
      lines.push(vimState.document.lineAt(line));
    }

    vimState.recordedState.transformer.replace(
      new Range(lines[0].range.start, lines[lines.length - 1].range.end),
      lines
        .map(
          (line) =>
            new Array(this.args.indent).fill(' ').join('') +
            line.text.slice(line.firstNonWhitespaceCharacterIndex)
        )
        .join('\n')
    );
  }
}
