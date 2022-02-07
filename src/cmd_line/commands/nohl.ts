import { VimState } from '../../state/vimState';
import { globalState } from '../../state/globalState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';

export class NohlCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    globalState.hl = false;

    // Clear the `match x of y` message from status bar
    StatusBar.clear(vimState);
  }
}
