import * as node from '../node';
import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';

import { Register } from '../../register/register';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { Position } from 'vscode';
import { PutBeforeFromCmdLine, PutFromCmdLine } from '../../actions/commands/put';

export interface IPutCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  register?: string;
}

//
// Implements :put
// http://vimdoc.sourceforge.net/htmldoc/change.html#:put
//

export class PutExCommand extends node.CommandBase {
  public readonly arguments: IPutCommandArguments;

  constructor(args: IPutCommandArguments) {
    super();
    this.arguments = args;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  async doPut(vimState: VimState, position: Position): Promise<void> {
    const registerName = this.arguments.register || (configuration.useSystemClipboard ? '*' : '"');
    if (!Register.isValidRegister(registerName)) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.TrailingCharacters));
      return;
    }

    vimState.recordedState.registerName = registerName;

    const putCmd = this.arguments.bang ? new PutBeforeFromCmdLine() : new PutFromCmdLine();
    putCmd.setInsertionLine(position.line);
    await putCmd.exec(position, vimState);
  }

  async execute(vimState: VimState): Promise<void> {
    await this.doPut(vimState, vimState.cursorStopPosition);
  }

  override async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [_, end] = range.resolve(vimState);
    await this.doPut(vimState, new Position(end, 0).getLineEnd());
  }
}
