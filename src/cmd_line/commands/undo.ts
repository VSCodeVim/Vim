import { optWhitespace, Parser } from 'parsimmon';
import { Position } from 'vscode';
import { Undo } from '../../actions/commands/undo';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { numberParser } from '../../vimscript/parserUtils';

//
//  Implements :u[ndo]
//  http://vimdoc.sourceforge.net/htmldoc/undo.html
//
export class UndoCommand extends ExCommand {
  public static readonly argParser: Parser<UndoCommand> = optWhitespace
    .then(numberParser)
    .fallback(undefined)
    .map((count) => new UndoCommand(count));

  private count?: number;
  private constructor(count?: number) {
    super();
    this.count = count;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: Use `this.count`
    await new Undo().exec(new Position(0, 0), vimState);
  }
}
