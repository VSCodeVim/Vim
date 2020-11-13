import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';

import * as node from '../node';

export class OnlyCommand extends node.CommandBase {
  protected _arguments: {};

  constructor(args: {}) {
    super();
    this._arguments = args;
  }

  get arguments(): {} {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    await Promise.all([
      vscode.commands.executeCommand('workbench.action.closeEditorsInOtherGroups'),
      vscode.commands.executeCommand('workbench.action.maximizeEditor'),
      vscode.commands.executeCommand('workbench.action.closePanel'),
    ]);
  }
}
