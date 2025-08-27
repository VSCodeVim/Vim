// eslint-disable-next-line id-denylist
import { Parser, all, optWhitespace, regexp, seq, string } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { Pattern, SearchDirection } from '../../vimscript/pattern';

export interface IGlobalCommandArguments {
  pattern: Pattern;
  command: string;
  inverse: boolean;
}

export class GlobalCommand extends ExCommand {
  public static readonly argParser: Parser<GlobalCommand> = optWhitespace.then(
    regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(
        Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
        // Command is everything remaining (Pattern.parser consumes the delimiter)
        all,
      ).map(([pattern, command]) => new GlobalCommand({ pattern, command, inverse: false })),
    ),
  );

  // Parser for :g! commands (inverse global)
  public static readonly gInverseArgParser: Parser<GlobalCommand> = optWhitespace.then(
    regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(
        Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
        // Command is everything remaining (Pattern.parser consumes the delimiter)
        all,
      ).map(([pattern, command]) => new GlobalCommand({ pattern, command, inverse: true })),
    ),
  );

  // Parser for :v[global] commands (inverse global)
  public static readonly vArgParser: Parser<GlobalCommand> = optWhitespace.then(
    regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(
        Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
        // Command is everything remaining (Pattern.parser consumes the delimiter)
        all,
      ).map(([pattern, command]) => new GlobalCommand({ pattern, command, inverse: true })),
    ),
  );

  private readonly arguments: IGlobalCommandArguments;

  constructor(args: IGlobalCommandArguments) {
    super();
    this.arguments = args;
  }

  public override neovimCapable(): boolean {
    return false;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: Implement in next task
    throw new Error('GlobalCommand.execute not implemented yet');
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    // TODO: Implement in next task
    throw new Error('GlobalCommand.executeWithRange not implemented yet');
  }
}
