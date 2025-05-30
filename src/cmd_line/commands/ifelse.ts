import { optWhitespace, Parser } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { expressionParser } from '../../vimscript/expression/parser';
import { Expression } from '../../vimscript/expression/types';
import { VimError } from '../../error';

export class IfCommand extends ExCommand {
  public static argParser: Parser<IfCommand> = optWhitespace
    .then(expressionParser)
    .map((expression) => new IfCommand(expression));

  public condition: Expression;
  private constructor(condition: Expression) {
    super();
    this.condition = condition;
  }

  public async execute(vimState: VimState): Promise<void> {
    throw new Error(':if not yet implemented outside scripts');
  }
}

export class ElseIfCommand extends ExCommand {
  public static argParser: Parser<ElseIfCommand> = optWhitespace
    .then(expressionParser)
    .map((expression) => new ElseIfCommand(expression));

  public condition: Expression;
  private constructor(condition: Expression) {
    super();
    this.condition = condition;
  }

  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.ElseIfWithoutIf();
  }
}

export class ElseCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.ElseWithoutIf();
  }
}

export class EndIfCommand extends ExCommand {
  public override async execute(vimState: VimState): Promise<void> {
    throw VimError.EndIfWithoutIf();
  }
}
