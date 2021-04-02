import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
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
  public arguments: IQuitCommandArguments;

  constructor(args: IQuitCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    // NOTE: We can't currently get all open text editors, so this isn't perfect. See #3809
    const duplicatedInSplit =
      vscode.window.visibleTextEditors.filter((editor) => editor.document === vimState.document)
        .length > 1;
    if (
      vimState.document.isDirty &&
      !this.arguments.bang &&
      (!duplicatedInSplit || this.arguments.quitAll)
    ) {
      throw error.VimError.fromCode(error.ErrorCode.NoWriteSinceLastChange);
    }

    if (this.arguments.quitAll) {
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
