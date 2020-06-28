import * as node from '../node';
import { Logger } from '../../util/logger';
import { StatusBar } from '../../statusBar';
import { VimState } from '../../state/vimState';
import { Range } from '../../common/motion/range';

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
    const newPositions = await vimState.historyTracker.goBackHistoryStep();

    if (newPositions === undefined) {
      StatusBar.setText(vimState, 'Already at oldest change');
    } else {
      vimState.cursors = newPositions.map((x) => new Range(x, x));
    }

    vimState.alteredHistory = true;

    return;
  }
}
