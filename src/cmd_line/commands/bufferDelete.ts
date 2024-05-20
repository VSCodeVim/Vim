import { alt, optWhitespace, Parser, seq, whitespace } from 'parsimmon';
import * as vscode from 'vscode';

import * as error from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser, fileNameParser, numberParser } from '../../vimscript/parserUtils';

interface IBufferDeleteCommandArguments {
  bang: boolean;
  buffers: Array<string | number>;
}

//
//  Implements :bd
// http://vimdoc.sourceforge.net/htmldoc/windows.html#buffers
//
export class BufferDeleteCommand extends ExCommand {
  public static readonly argParser: Parser<BufferDeleteCommand> = seq(
    bangParser.skip(optWhitespace),
    alt<string | number>(numberParser, fileNameParser).sepBy(whitespace),
  ).map(([bang, buffers]) => new BufferDeleteCommand({ bang, buffers }));

  public readonly arguments: IBufferDeleteCommandArguments;
  constructor(args: IBufferDeleteCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    if (vimState.document.isDirty && !this.arguments.bang) {
      throw error.VimError.fromCode(error.ErrorCode.NoWriteSinceLastChange);
    }

    if (this.arguments.buffers.length === 0) {
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    } else {
      for (const buffer of this.arguments.buffers) {
        if (typeof buffer === 'string') {
          // TODO
          StatusBar.setText(
            vimState,
            ':bd[elete][!] {bufname} is not yet implemented (PRs are welcome!)',
            true,
          );
          continue;
        }

        try {
          await vscode.commands.executeCommand(`workbench.action.openEditorAtIndex${buffer}`);
        } catch (e) {
          throw error.VimError.fromCode(error.ErrorCode.NoBuffersDeleted);
        }

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    }
  }
}
