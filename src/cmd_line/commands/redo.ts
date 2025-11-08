import { VimState } from '../../state/vimState';
import { CommandRedo } from '../../actions/commands/actions';
import { Position } from 'vscode';
import { ExCommand } from '../../vimscript/exCommand';
import { optWhitespace, Parser } from 'parsimmon';
import { numberParser } from '../../vimscript/parserUtils';

//
//  Implements :red[o]
//  http://vimdoc.sourceforge.net/htmldoc/undo.html#redo
//
export class RedoCommand extends ExCommand {
  public static readonly argParser: Parser<RedoCommand> = optWhitespace
    .then(numberParser)
    .fallback(undefined)
    .map((count) => new RedoCommand(count));

  private count?: number;
  private constructor(count?: number) {
    super();
    this.count = count;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: Use `this.count`
    await new CommandRedo().exec(new Position(0, 0), vimState);
  }
}
