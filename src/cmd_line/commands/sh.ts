import * as node from '../node';
import { globalState } from '../../state/globalState';
import { window } from 'vscode';

export class ShCommand extends node.CommandBase {
  async execute(): Promise<void> {
    window.createTerminal().show();
  }
}
