import { Parser, all, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';

export class NormalCommand extends ExCommand {
  // TODO: support to parse `:normal!`
  public static readonly argParser: Parser<NormalCommand> = whitespace
    .then(all)
    .map((keystrokes) => new NormalCommand(keystrokes));

  private readonly keystrokes: string;
  constructor(argument: string) {
    super();
    this.keystrokes = argument;
  }

  override async execute(vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.addTransformation({
      type: 'executeNormal',
      keystrokes: this.keystrokes,
    });
  }

  override async executeWithRange(vimState: VimState, lineRange: LineRange): Promise<void> {
    vimState.recordedState.transformer.addTransformation({
      type: 'executeNormal',
      keystrokes: this.keystrokes,
      range: lineRange,
    });
  }
}
