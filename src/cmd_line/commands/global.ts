// eslint-disable-next-line id-denylist
import { Parser, string } from 'parsimmon';
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
  // Placeholder parser - will be implemented in task 2
  public static readonly argParser: Parser<GlobalCommand> = string('').chain(() => {
    throw new Error('GlobalCommand parser not implemented yet');
  });

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
