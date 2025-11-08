import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export class OnlyCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    await Promise.allSettled([
      vscode.commands.executeCommand('workbench.action.joinAllGroups'),
      vscode.commands.executeCommand('workbench.action.maximizeEditor'),
      vscode.commands.executeCommand('workbench.action.closePanel'),
    ]);
  }
}
