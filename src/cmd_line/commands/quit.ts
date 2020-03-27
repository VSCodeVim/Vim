import * as vscode from 'vscode';

import * as error from '../../error';
import * as node from '../node';

export interface IQuitCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  range?: node.LineRange;
  quitAll?: boolean;
}

//
//  Implements :quit
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
export class QuitCommand extends node.CommandBase {
  protected _arguments: IQuitCommandArguments;

  constructor(args: IQuitCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IQuitCommandArguments {
    return this._arguments;
  }

  async execute(): Promise<void> {
    // NOTE: We can't currently get all open text editors, so this isn't perfect. See #3809
    const duplicatedInSplit =
      vscode.window.visibleTextEditors.filter(
        (editor) => editor.document === this.activeTextEditor!.document
      ).length > 1;
    if (
      this.activeTextEditor!.document.isDirty &&
      !this.arguments.bang &&
      (!duplicatedInSplit || this._arguments.quitAll)
    ) {
      throw error.VimError.fromCode(error.ErrorCode.NoWriteSinceLastChange);
    }

    if (this._arguments.quitAll) {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } else {
      if (!this.arguments.bang) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      } else {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
      }
    }
  }
}
