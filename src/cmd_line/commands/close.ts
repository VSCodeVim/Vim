import { Parser } from 'parsimmon';
import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser } from '../../vimscript/parserUtils';

//
//  Implements :close
//  http://vimdoc.sourceforge.net/htmldoc/windows.html#:close
//
export class CloseCommand extends ExCommand {
  public static readonly argParser: Parser<CloseCommand> = bangParser.map(
    (bang) => new CloseCommand(bang),
  );

  public readonly bang: boolean;
  constructor(bang: boolean) {
    super();
    this.bang = bang;
  }

  async execute(vimState: VimState): Promise<void> {
    if (vimState.document.isDirty && !this.bang) {
      throw error.VimError.fromCode(error.ErrorCode.NoWriteSinceLastChange);
    }

    if (vscode.window.visibleTextEditors.length === 1) {
      throw error.VimError.fromCode(error.ErrorCode.CannotCloseLastWindow);
    }

    const oldViewColumn = vimState.editor.viewColumn;
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    if (
      vscode.window.activeTextEditor !== undefined &&
      vscode.window.activeTextEditor.viewColumn === oldViewColumn
    ) {
      await vscode.commands.executeCommand('workbench.action.previousEditor');
    }
  }
}
