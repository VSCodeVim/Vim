import * as node from '../node';
import { window } from 'vscode';
import { VimState } from '../../state/vimState';

export class ShCommand extends node.CommandBase {
  async execute(vimState: VimState): Promise<void> {
    window.createTerminal().show();
  }
}
