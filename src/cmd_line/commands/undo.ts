import { VimState } from '../../state/vimState';
import { CommandUndo } from '../../actions/commands/actions';
import { Position } from 'vscode';
import { ExCommand } from '../../vimscript/exCommand';
import { optWhitespace, Parser } from 'parsimmon';
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
    await new CommandUndo().exec(new Position(0, 0), vimState);
  }
}
