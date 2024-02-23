import { Parser, all, seq, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';

export class NormalCommand extends ExCommand {
  public static readonly argParser: Parser<NormalCommand> = seq(whitespace, all).map(
    ([_, keystroke]) => new NormalCommand(keystroke),
  );

  private readonly keystroke: string;
  constructor(argument: string) {
    super();
    this.keystroke = argument;
  }

  override async execute(vimState: VimState): Promise<void> {
    const keystroke = this.keystroke;
    vimState.recordedState.transformer.addTransformation({
      type: 'executeNormal',
      keystroke,
    });
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    await this.execute(vimState);
  }
}
