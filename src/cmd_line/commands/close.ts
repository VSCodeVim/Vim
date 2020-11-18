import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
import * as node from '../node';

export interface ICloseCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  range?: node.LineRange;
  quitAll?: boolean;
}

//
//  Implements :close
//  http://vimdoc.sourceforge.net/htmldoc/windows.html#:close
//
export class CloseCommand extends node.CommandBase {
  protected _arguments: ICloseCommandArguments;

  constructor(args: ICloseCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): ICloseCommandArguments {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    if (vimState.document.isDirty && !this.arguments.bang) {
      throw error.VimError.fromCode(error.ErrorCode.NoWriteSinceLastChange);
    }

    if (vscode.window.visibleTextEditors.length === 1) {
      throw error.VimError.fromCode(error.ErrorCode.CannotCloseLastWindow);
    }

    let oldViewColumn = vimState.editor.viewColumn;
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    if (
      vscode.window.activeTextEditor !== undefined &&
      vscode.window.activeTextEditor.viewColumn === oldViewColumn
    ) {
      await vscode.commands.executeCommand('workbench.action.previousEditor');
    }
  }
}
