import { optWhitespace, Parser, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { EvaluationContext } from '../../vimscript/expression/evaluate';
import { expressionParser } from '../../vimscript/expression/parser';
import { Expression } from '../../vimscript/expression/types';
import { displayValue } from '../../vimscript/expression/displayValue';

export class EchoCommand extends ExCommand {
  public static argParser(echoArgs: { sep: string; error: boolean }): Parser<EchoCommand> {
    return optWhitespace
      .then(expressionParser.sepBy(whitespace))
      .map((expressions) => new EchoCommand(echoArgs, expressions));
  }

  private sep: string;
  private error: boolean;
  private expressions: Expression[];
  private constructor(args: { sep: string; error: boolean }, expressions: Expression[]) {
    super();
    this.sep = args.sep;
    this.error = args.error;
    this.expressions = expressions;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  public async execute(vimState: VimState): Promise<void> {
    const ctx = new EvaluationContext();
    const values = this.expressions.map((x) => ctx.evaluate(x));
    const message = values.map((v) => displayValue(v)).join(this.sep);
    StatusBar.setText(vimState, message, this.error);
  }
}
