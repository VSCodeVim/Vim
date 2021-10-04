import { VimState } from '../../state/vimState';
import { CommandUndo } from '../../actions/commands/actions';
import { Position } from 'vscode';
import { ExCommand } from '../../vimscript/exCommand';

//
//  Implements :u[ndo]
//  http://vimdoc.sourceforge.net/htmldoc/undo.html
//
export class UndoCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    await new CommandUndo().exec(new Position(0, 0), vimState);
  }
}
