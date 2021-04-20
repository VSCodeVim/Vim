import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';

import * as node from '../node';

export interface IWallCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  range?: node.LineRange;
}

//
//  Implements :wall (write all)
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:wall
//
export class WallCommand extends node.CommandBase {
  private readonly arguments: IWallCommandArguments;

  constructor(args: IWallCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO : overwrite readonly files when bang? == true
    await vscode.workspace.saveAll(false);
  }
}
