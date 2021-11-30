import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';

import { Register } from '../../register/register';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { Position } from 'vscode';
import { PutBeforeFromCmdLine, PutFromCmdLine } from '../../actions/commands/put';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { any, optWhitespace, Parser, seq } from 'parsimmon';
import { bangParser } from '../../vimscript/parserUtils';

export interface IPutCommandArguments {
  bang: boolean;
  register?: string;
}

//
// Implements :put
// http://vimdoc.sourceforge.net/htmldoc/change.html#:put
//

export class PutExCommand extends ExCommand {
  public static readonly argParser: Parser<PutExCommand> = seq(
    bangParser,
    optWhitespace.then(any).fallback(undefined)
  ).map(([bang, register]) => new PutExCommand({ bang, register }));

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

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { end } = range.resolve(vimState);
    await this.doPut(vimState, new Position(end, 0).getLineEnd());
  }
}
