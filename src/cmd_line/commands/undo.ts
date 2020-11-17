import * as node from '../node';
import { Logger } from '../../util/logger';
import { VimState } from '../../state/vimState';
import { CommandUndo } from '../../actions/commands/actions';
import { Position } from 'vscode';

//
//  Implements :u[ndo]
//  http://vimdoc.sourceforge.net/htmldoc/undo.html
//
export class UndoCommand extends node.CommandBase {
  protected _arguments: {};
  private readonly _logger = Logger.get('Undo');

  constructor(args: {}) {
    super();
    this._arguments = args;
  }

  get arguments(): {} {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    await new CommandUndo().exec(new Position(0, 0), vimState);
    return;
  }
}
