import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';

import * as node from '../node';

export class OnlyCommand extends node.CommandBase {
  async execute(vimState: VimState): Promise<void> {
    await Promise.allSettled([
      vscode.commands.executeCommand('workbench.action.closeEditorsInOtherGroups'),
      vscode.commands.executeCommand('workbench.action.maximizeEditor'),
      vscode.commands.executeCommand('workbench.action.closePanel'),
    ]);
  }
}
