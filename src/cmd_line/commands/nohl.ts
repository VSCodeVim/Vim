import { VimState } from '../../state/vimState';
import * as node from '../node';
import { StatusBar } from '../../statusBar';
import { globalState } from '../../state/globalState';

export class NohlCommand extends node.CommandBase {
  protected _arguments: {};

  constructor(args: {}) {
    super();

    this._name = 'nohl';
    this._arguments = args;
  }

  get arguments(): {} {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    globalState.hl = false;

    // Clear the `match x of y` message from status bar
    StatusBar.Set('', vimState.currentMode, vimState.isRecordingMacro, true);
  }
}
