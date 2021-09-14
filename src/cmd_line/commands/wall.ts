import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';

export interface IWallCommandArguments {
  bang?: boolean;
  range?: LineRange;
}

//
//  Implements :wall (write all)
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:wall
//
export class WallCommand extends ExCommand {
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
