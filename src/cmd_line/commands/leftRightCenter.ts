import { optWhitespace, Parser } from 'parsimmon';
import { Range, TextLine } from 'vscode';
import { configuration } from '../../configuration/configuration';
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
            ' '.repeat(this.args.indent) + line.text.slice(line.firstNonWhitespaceCharacterIndex),
        )
        .join('\n'),
    );
  }
}

type RightArgs = {
  width: number;
};

export class RightCommand extends ExCommand {
  public static readonly argParser: Parser<RightCommand> = optWhitespace
    .then(numberParser.fallback(undefined))
    .map((width) => new RightCommand({ width: width ?? configuration.textwidth }));

  private args: RightArgs;
  constructor(args: RightArgs) {
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
        .map((line) => {
          const indent = ' '.repeat(
            Math.max(
              0,
              this.args.width - (line.text.length - line.firstNonWhitespaceCharacterIndex),
            ),
          );
          return indent + line.text.slice(line.firstNonWhitespaceCharacterIndex);
        })
        .join('\n'),
    );
  }
}

type CenterArgs = {
  width: number;
};

export class CenterCommand extends ExCommand {
  public static readonly argParser: Parser<CenterCommand> = optWhitespace
    .then(numberParser.fallback(undefined))
    .map((width) => new CenterCommand({ width: width ?? configuration.textwidth }));

  private args: CenterArgs;
  constructor(args: CenterArgs) {
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
        .map((line) => {
          const indent = ' '.repeat(
            Math.max(
              0,
              this.args.width - (line.text.length - line.firstNonWhitespaceCharacterIndex),
            ) / 2,
          );
          return indent + line.text.slice(line.firstNonWhitespaceCharacterIndex);
        })
        .join('\n'),
    );
  }
}
