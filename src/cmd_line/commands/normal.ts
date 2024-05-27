import { Parser, all, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';

export class NormalCommand extends ExCommand {
  // TODO: support to parse `:normal!`
  public static readonly argParser: Parser<NormalCommand> = whitespace
    .then(all)
    .map((keystroke) => new NormalCommand(keystroke));

  private readonly keystroke: string;
  constructor(argument: string) {
    super();
    this.keystroke = argument;
  }

  override async execute(vimState: VimState): Promise<void> {
    const keystroke = this.keystroke;
    const lineNumber = vimState.cursorStopPosition.line;
    vimState.recordedState.transformer.addTransformation({
      type: 'executeNormal',
      keystroke,
      startLineNumber: lineNumber,
      endLineNumber: lineNumber,
      withRange: false,
    });
  }

  override async executeWithRange(vimState: VimState, lineRange: LineRange): Promise<void> {
    const keystroke = this.keystroke;
    const { start, end } = lineRange.resolve(vimState);
    vimState.recordedState.transformer.addTransformation({
      type: 'executeNormal',
      keystroke,
      startLineNumber: start,
      endLineNumber: end,
      withRange: true,
    });
  }
}
