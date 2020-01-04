import * as vscode from 'vscode';

import * as error from '../../error';
import * as node from '../node';

export interface IBufferDeleteCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  tabPosition?: string;
}

//
//  Implements :bd
// http://vimdoc.sourceforge.net/htmldoc/windows.html#buffers
//
export class BufferDeleteCommand extends node.CommandBase {
  protected _arguments: IBufferDeleteCommandArguments;

  constructor(args: IBufferDeleteCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IBufferDeleteCommandArguments {
    return this._arguments;
  }

  async execute(): Promise<void> {
    const previousEditorPath = vscode.window.activeTextEditor!.document.uri.fsPath;

    if (this.arguments.tabPosition !== undefined) {
      try {
        await vscode.commands.executeCommand(
          `workbench.action.openEditorAtIndex${this.arguments.tabPosition}`
        );
      } catch (e) {
        throw error.VimError.fromCode(error.ErrorCode.E516);
      }
    }

    if (this.activeTextEditor!.document.isDirty && !this.arguments.bang) {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(previousEditorPath));
      throw error.VimError.fromCode(error.ErrorCode.E37);
    }

    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  }
}
