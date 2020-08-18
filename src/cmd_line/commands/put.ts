import * as node from '../node';
import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';

import { Position } from '../../common/motion/position';
import { PutCommand, IPutCommandOptions } from '../../actions/commands/put';
import { Register } from '../../register/register';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';

export interface IPutCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  register?: string;
}

//
// Implements :put
// http://vimdoc.sourceforge.net/htmldoc/change.html#:put
//

export class PutExCommand extends node.CommandBase {
  protected _arguments: IPutCommandArguments;

  constructor(args: IPutCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IPutCommandArguments {
    return this._arguments;
  }

  public neovimCapable(): boolean {
    return true;
  }

  async doPut(vimState: VimState, position: Position): Promise<void> {
    const registerName = this.arguments.register || (configuration.useSystemClipboard ? '*' : '"');
    if (!Register.isValidRegister(registerName)) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.TrailingCharacters));
      return;
    }

    vimState.recordedState.registerName = registerName;

    let options: IPutCommandOptions = {
      forceLinewise: true,
      forceCursorLastLine: true,
      pasteBeforeCursor: this.arguments.bang,
    };

    await new PutCommand().exec(position, vimState, options);
  }

  async execute(vimState: VimState): Promise<void> {
    await this.doPut(vimState, vimState.cursorStopPosition);
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [_, end] = range.resolve(vimState);
    await this.doPut(vimState, new Position(end, 0).getLineEnd());
  }
}
