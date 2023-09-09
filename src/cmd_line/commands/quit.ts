import { Parser } from 'parsimmon';
import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser } from '../../vimscript/parserUtils';

export interface IQuitCommandArguments {
  bang?: boolean;
  quitAll?: boolean;
}

//
//  Implements :quit
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
export class QuitCommand extends ExCommand {
  public static readonly argParser: (quitAll: boolean) => Parser<QuitCommand> = (
    quitAll: boolean,
  ) =>
    bangParser.map(
      (bang) =>
        new QuitCommand({
          bang,
          quitAll,
        }),
    );

  public override isRepeatableWithDot = false;

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
