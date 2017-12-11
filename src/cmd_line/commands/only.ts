import * as vscode from 'vscode';

import * as node from '../node';

export class OnlyCommand extends node.CommandBase {
  protected _arguments: {};

  constructor(args: {}) {
    super();

    this._name = 'only';
    this._arguments = args;
  }

  get arguments(): {} {
    return this._arguments;
  }

  async execute(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeEditorsInOtherGroups');
    return;
  }
}
