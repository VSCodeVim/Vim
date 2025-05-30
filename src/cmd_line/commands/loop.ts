import { optWhitespace, Parser, regexp, seqMap, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { expressionParser, variableParser } from '../../vimscript/expression/parser';
import { Expression, VariableExpression } from '../../vimscript/expression/types';
import { ErrorCode, VimError } from '../../error';

export class WhileCommand extends ExCommand {
  public static argParser: Parser<WhileCommand> = optWhitespace
    .then(expressionParser)
    .map((expression) => new WhileCommand(expression));

  public condition: Expression;
  private constructor(condition: Expression) {
    super();
    this.condition = condition;
  }

  public async execute(vimState: VimState): Promise<void> {
    throw new Error(':while not yet implemented outside scripts');
  }
}

export class EndWhileCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.fromCode(ErrorCode.EndWhileWithoutWhile);
  }
}

export class ForCommand extends ExCommand {
  public static argParser: Parser<ForCommand> = seqMap(
    whitespace.then(variableParser),
    regexp(/\s+in\s+/i).then(expressionParser),
    (variable, collection) => new ForCommand(variable, collection),
  );

  public variable: VariableExpression;
  public collection: Expression;
  private constructor(variable: VariableExpression, collection: Expression) {
    super();
    this.variable = variable;
    this.collection = collection;
  }

  public async execute(vimState: VimState): Promise<void> {
    throw new Error(':for not yet implemented outside scripts');
  }
}

export class EndForCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.fromCode(ErrorCode.EndWhileWithoutWhile); // TODO: EndForWithoutFor
  }
}

export class BreakCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.fromCode(ErrorCode.BreakWithoutWhileOrFor);
  }
}

export class ContinueCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.fromCode(ErrorCode.ContinueWithoutWhileOrFor);
  }
}
