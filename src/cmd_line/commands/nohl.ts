import { VimState } from '../../state/vimState';
import * as node from '../node';
import { globalState } from '../../state/globalState';
import { StatusBar } from '../../statusBar';

export class NohlCommand extends node.CommandBase {
  async execute(vimState: VimState): Promise<void> {
    globalState.hl = false;

    // Clear the `match x of y` message from status bar
    StatusBar.clear(vimState);
  }
}
