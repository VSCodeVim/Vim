import { Parser, all } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export class NormalCommand extends ExCommand {
  public static readonly argParser: Parser<NormalCommand> = all.map(
    (argument) => new NormalCommand(argument),
  );

  private readonly argument: string;
  constructor(argument: string) {
    super();
    this.argument = argument;
  }

  override execute(vimState: VimState): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
