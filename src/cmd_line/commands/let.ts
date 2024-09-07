// eslint-disable-next-line id-denylist
import { alt, optWhitespace, Parser, seq, string, whitespace } from 'parsimmon';
import { env } from 'process';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import {
  add,
  concat,
  divide,
  modulo,
  multiply,
  str,
  subtract,
} from '../../vimscript/expression/build';
import { EvaluationContext } from '../../vimscript/expression/evaluate';
import {
  envVariableParser,
  expressionParser,
  optionParser,
  registerParser,
  variableParser,
} from '../../vimscript/expression/parser';
import {
  EnvVariableExpression,
  Expression,
  OptionExpression,
  RegisterExpression,
  VariableExpression,
} from '../../vimscript/expression/types';
import { displayValue } from '../../vimscript/expression/displayValue';
import { ErrorCode, VimError } from '../../error';

export type LetCommandOperation = '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '.=' | '..=';
export type LetCommandVariable =
  | VariableExpression
  | OptionExpression
  | RegisterExpression
  | EnvVariableExpression;
export type LetCommandArgs =
  | {
      operation: LetCommandOperation;
      variable: LetCommandVariable;
      expression: Expression;
      lock: boolean;
    }
  | {
      operation: 'print';
      variables: LetCommandVariable[];
    };

const operationParser: Parser<LetCommandOperation> = alt(
  string('='),
  string('+='),
  string('-='),
  string('*='),
  string('/='),
  string('%='),
  string('.='),
  string('..='),
);

const letVarParser = alt<LetCommandVariable>(
  variableParser,
  optionParser,
  envVariableParser,
  registerParser,
);

export class LetCommand extends ExCommand {
  // TODO: Support unpacking
  // TODO: Support indexing
  // TODO: Support slicing
  public static readonly argParser = (lock: boolean) =>
    alt<LetCommand>(
      // `:let {var} = {expr}`
      // `:let {var} += {expr}`
      // `:let {var} -= {expr}`
      // `:let {var} .= {expr}`
      whitespace.then(
        seq(letVarParser, operationParser.wrap(optWhitespace, optWhitespace), expressionParser).map(
          ([variable, operation, expression]) =>
            new LetCommand({
              operation,
              variable,
              expression,
              lock,
            }),
        ),
      ),
      // `:let`
      // `:let {var-name} ...`
      optWhitespace
        .then(letVarParser.sepBy(whitespace))
        .map((variables) => new LetCommand({ operation: 'print', variables })),
    );

  private args: LetCommandArgs;
  constructor(args: LetCommandArgs) {
    super();
    this.args = args;
  }

  async execute(vimState: VimState): Promise<void> {
    const context = new EvaluationContext();
    if (this.args.operation === 'print') {
      if (this.args.variables.length === 0) {
        // TODO
      } else {
        const variable = this.args.variables[this.args.variables.length - 1];
        const value = context.evaluate(variable);
        const prefix = value.type === 'number' ? '#' : value.type === 'funcref' ? '*' : '';
        StatusBar.setText(vimState, `${variable.name}    ${prefix}${displayValue(value)}`);
      }
    } else {
      const variable = this.args.variable;

      if (this.args.lock) {
        if (this.args.operation !== '=') {
          throw VimError.fromCode(ErrorCode.CannotModifyExistingVariable);
        } else if (this.args.variable.type !== 'variable') {
          // TODO: this error message should vary by type
          throw VimError.fromCode(ErrorCode.CannotLockARegister);
        }
      }

      let value = context.evaluate(this.args.expression);
      if (variable.type === 'variable') {
        if (this.args.operation === '+=') {
          value = context.evaluate(add(variable, value));
        } else if (this.args.operation === '-=') {
          value = context.evaluate(subtract(variable, value));
        } else if (this.args.operation === '*=') {
          value = context.evaluate(multiply(variable, value));
        } else if (this.args.operation === '/=') {
          value = context.evaluate(divide(variable, value));
        } else if (this.args.operation === '%=') {
          value = context.evaluate(modulo(variable, value));
        } else if (this.args.operation === '.=') {
          value = context.evaluate(concat(variable, value));
        } else if (this.args.operation === '..=') {
          value = context.evaluate(concat(variable, value));
        }
        context.setVariable(variable, value, this.args.lock);
      } else if (variable.type === 'register') {
        // TODO
      } else if (variable.type === 'option') {
        // TODO
      } else if (variable.type === 'env_variable') {
        value = str(env[variable.name] ?? '');
      }
    }
  }
}
