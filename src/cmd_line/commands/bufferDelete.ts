import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export interface IBufferDeleteCommandArguments {
  bang?: boolean;
  tabPosition?: string;
}

//
//  Implements :bd
// http://vimdoc.sourceforge.net/htmldoc/windows.html#buffers
//
export class BufferDeleteCommand extends ExCommand {
  public readonly arguments: IBufferDeleteCommandArguments;

  constructor(args: IBufferDeleteCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    if (vimState.document.isDirty && !this.arguments.bang) {
      throw error.VimError.fromCode(error.ErrorCode.NoWriteSinceLastChange);
    }

    if (this.arguments.tabPosition !== undefined) {
      try {
        await vscode.commands.executeCommand(
          `workbench.action.openEditorAtIndex${this.arguments.tabPosition}`
        );
      } catch (e) {
        throw error.VimError.fromCode(error.ErrorCode.NoBuffersDeleted);
      }
    }

    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  }
}
