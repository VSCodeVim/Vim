import { optWhitespace, Parser } from 'parsimmon';
import { Position } from 'vscode';
import { Redo } from '../../actions/commands/undo';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
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
    await new Redo().exec(new Position(0, 0), vimState);
  }
}
