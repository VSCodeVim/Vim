import { configuration } from '../../configuration/configuration';
import { VimState } from '../../state/vimState';

// eslint-disable-next-line id-denylist
import { Parser, alt, any, optWhitespace, seq, string } from 'parsimmon';
import { Position } from 'vscode';
import { PutBeforeFromCmdLine, PutFromCmdLine } from '../../actions/commands/put';
import { ErrorCode, VimError } from '../../error';
import { Register } from '../../register/register';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { bangParser } from '../../vimscript/parserUtils';
import { Expression } from '../../vimscript/expression/types';
import { expressionParser } from '../../vimscript/expression/parser';
import { EvaluationContext, toString } from '../../vimscript/expression/evaluate';

export interface IPutCommandArguments {
  bang: boolean;
  register?: string;
  fromExpression?: Expression;
}

//
// Implements :put
// http://vimdoc.sourceforge.net/htmldoc/change.html#:put
//

export class PutExCommand extends ExCommand {
  public static readonly argParser: Parser<PutExCommand> = seq(
    bangParser,
    optWhitespace.then(
      alt<Partial<IPutCommandArguments>>(
        string('=')
          .then(optWhitespace)
          .then(expressionParser)
          .map((expression) => ({ fromExpression: expression })),
        // eslint-disable-next-line id-denylist
        any.map((register) => ({ register })).fallback({ register: undefined }),
      ),
    ),
  ).map(([bang, register]) => new PutExCommand({ bang, ...register }));

  private static lastExpression: Expression | undefined;

  public readonly arguments: IPutCommandArguments;

  constructor(args: IPutCommandArguments) {
    super();
    this.arguments = args;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  async doPut(vimState: VimState, position: Position): Promise<void> {
    if (this.arguments.register === '=' && this.arguments.fromExpression === undefined) {
      if (PutExCommand.lastExpression === undefined) {
        return;
      }
      this.arguments.fromExpression = PutExCommand.lastExpression;
    }

    if (this.arguments.fromExpression) {
      PutExCommand.lastExpression = this.arguments.fromExpression;

      this.arguments.register = '=';

      const value = new EvaluationContext().evaluate(this.arguments.fromExpression);
      const stringified =
        value.type === 'list' ? value.items.map(toString).join('\n') : toString(value);
      Register.overwriteRegister(vimState, this.arguments.register, stringified, 0);
    }

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
