import { all, optWhitespace, Parser, seq } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { expressionParser, functionCallParser } from '../../vimscript/expression/parser';
import { Expression } from '../../vimscript/expression/types';
import { EvaluationContext } from '../../vimscript/expression/evaluate';
import { VimError } from '../../error';

export class EvalCommand extends ExCommand {
  public override isRepeatableWithDot = false;

  public static argParser: Parser<EvalCommand> = optWhitespace
    .then(seq(expressionParser.fallback(undefined), all))
    .map(([expression, trailing]) => {
      if (expression === undefined) {
        throw VimError.InvalidExpression(trailing);
      }
      if (trailing) {
        throw VimError.TrailingCharacters(trailing);
      }
      return new EvalCommand(expression);
    });

  private expression: Expression;
  private constructor(expression: Expression) {
    super();
    this.expression = expression;
  }

  public async execute(vimState: VimState): Promise<void> {
    const ctx = new EvaluationContext(vimState);
    ctx.evaluate(this.expression);
  }
}

export class CallCommand extends ExCommand {
  public override isRepeatableWithDot = false;

  public static argParser: Parser<CallCommand> = optWhitespace
    .then(functionCallParser)
    .map((call) => new CallCommand(call));

  private expression: Expression;
  private constructor(funcCall: Expression) {
    super();
    this.expression = funcCall;
  }

  public async execute(vimState: VimState): Promise<void> {
    const ctx = new EvaluationContext(vimState);
    ctx.evaluate(this.expression);
  }
}
