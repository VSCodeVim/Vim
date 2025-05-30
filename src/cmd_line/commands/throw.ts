import { Parser, whitespace } from 'parsimmon';
import { VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { expressionParser } from '../../vimscript/expression/parser';
import { Expression } from '../../vimscript/expression/types';
import { EvaluationContext, toString } from '../../vimscript/expression/evaluate';

export class ThrowCommand extends ExCommand {
  public static readonly argParser: Parser<ThrowCommand> = whitespace
    .then(expressionParser)
    .map((expr) => new ThrowCommand(expr));

  public readonly expr: Expression;
  constructor(expr: Expression) {
    super();
    this.expr = expr;
  }

  async execute(vimState: VimState): Promise<void> {
    const ctx = new EvaluationContext(vimState);
    const message = toString(ctx.evaluate(this.expr));
    throw VimError.ExceptionNotCaught(message);
  }
}
