import { alt, optWhitespace, Parser, seq, whitespace } from 'parsimmon';
import * as vscode from 'vscode';

import { VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser, fileNameParser, numberParser } from '../../vimscript/parserUtils';
import { find } from 'lodash';
import { findTabInActiveTabGroup } from '../../util/util';

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
      throw VimError.NoWriteSinceLastChange();
    }

    let deletedBuffers = 0;

    if (this.arguments.buffers.length === 0) {
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    } else {
      for (let buffer of this.arguments.buffers) {
        if (typeof buffer === 'string') {
          const [idx, tab] = findTabInActiveTabGroup(buffer);
          buffer = idx + 1;
        }

        if (buffer < 1) {
          throw VimError.PositiveCountRequired();
        }
        if (buffer > vscode.window.tabGroups.activeTabGroup.tabs.length) {
          continue;
        }

        try {
          await vscode.commands.executeCommand('workbench.action.openEditorAtIndex', buffer - 1);
        } catch (e) {
          continue;
        }

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        ++deletedBuffers;
      }
    }

    if (deletedBuffers === 0) {
      throw VimError.NoBuffersDeleted();
    }
  }
}
