// eslint-disable-next-line id-denylist
import { alt, optWhitespace, Parser, sepBy, seq, seqMap, string, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import {
  add,
  concat,
  divide,
  int,
  modulo,
  multiply,
  subtract,
} from '../../vimscript/expression/build';
import { EvaluationContext, toInt, toString } from '../../vimscript/expression/evaluate';
import {
  envVariableParser,
  expressionParser,
  optionParser,
  registerParser,
  variableParser,
  varNameParser,
} from '../../vimscript/expression/parser';
import {
  EnvVariableExpression,
  Expression,
  OptionExpression,
  RegisterExpression,
  Value,
  VariableExpression,
} from '../../vimscript/expression/types';
import { displayValue } from '../../vimscript/expression/displayValue';
import { ErrorCode, VimError } from '../../error';
import { bangParser } from '../../vimscript/parserUtils';

type Unpack = {
  type: 'unpack';
  names: string[];
};
type Index = {
  type: 'index';
  variable: VariableExpression;
  index: Expression;
};
type Slice = {
  type: 'slice';
  variable: VariableExpression;
  start: Expression | undefined;
  end: Expression | undefined;
};

export type LetCommandOperation = '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '.=' | '..=';
export type LetCommandVariable =
  | VariableExpression
  | OptionExpression
  | RegisterExpression
  | EnvVariableExpression;
export type LetCommandArgs =
  | {
      operation: LetCommandOperation;
      variable: LetCommandVariable | Unpack | Index | Slice;
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

const unpackParser: Parser<Unpack> = sepBy(varNameParser, string(',').trim(optWhitespace))
  .wrap(string('[').then(optWhitespace), optWhitespace.then(string(']')))
  .map((names) => ({
    type: 'unpack',
    names,
  }));

const indexParser: Parser<Index> = seq(
  variableParser,
  expressionParser.wrap(string('[').then(optWhitespace), optWhitespace.then(string(']'))),
).map(([variable, index]) => ({
  type: 'index',
  variable,
  index,
}));

const sliceParser: Parser<Slice> = seq(
  variableParser,
  string('[').then(optWhitespace).then(expressionParser).fallback(undefined),
  string(':').trim(optWhitespace),
  expressionParser.fallback(undefined).skip(optWhitespace.then(string(']'))),
).map(([variable, start, _, end]) => ({
  type: 'slice',
  variable,
  start,
  end,
}));

export class LetCommand extends ExCommand {
  public static readonly argParser = (lock: boolean) =>
    alt<LetCommand>(
      // `:let {var} = {expr}`
      // `:let {var} += {expr}`
      // `:let {var} -= {expr}`
      // `:let {var} .= {expr}`
      whitespace.then(
        seq(
          alt<LetCommandVariable | Unpack | Index | Slice>(
            unpackParser,
            sliceParser,
            indexParser,
            letVarParser,
          ),
          operationParser.trim(optWhitespace),
          expressionParser,
        ).map(
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
        const variable = this.args.variables.at(-1)!;
        const value = context.evaluate(variable);
        const prefix = value.type === 'number' ? '#' : value.type === 'funcref' ? '*' : '';
        StatusBar.setText(vimState, `${variable.name}    ${prefix}${displayValue(value)}`);
      }
    } else {
      const variable = this.args.variable;

      if (this.args.lock) {
        if (this.args.operation !== '=') {
          throw VimError.fromCode(ErrorCode.CannotModifyExistingVariable);
        } else if (variable.type !== 'variable') {
          // TODO: this error message should vary by type
          throw VimError.fromCode(ErrorCode.CannotLockARegister);
        }
      }

      const value = context.evaluate(this.args.expression);
      const newValue = (_var: Expression, _value: Value) => {
        if (this.args.operation === '+=') {
          return context.evaluate(add(_var, _value));
        } else if (this.args.operation === '-=') {
          return context.evaluate(subtract(_var, _value));
        } else if (this.args.operation === '*=') {
          return context.evaluate(multiply(_var, _value));
        } else if (this.args.operation === '/=') {
          return context.evaluate(divide(_var, _value));
        } else if (this.args.operation === '%=') {
          return context.evaluate(modulo(_var, _value));
        } else if (this.args.operation === '.=') {
          return context.evaluate(concat(_var, _value));
        } else if (this.args.operation === '..=') {
          return context.evaluate(concat(_var, _value));
        }
        return _value;
      };

      if (variable.type === 'variable') {
        context.setVariable(variable, newValue(variable, value), this.args.lock);
      } else if (variable.type === 'register') {
        // TODO
      } else if (variable.type === 'option') {
        // TODO
      } else if (variable.type === 'env_variable') {
        // TODO
      } else if (variable.type === 'unpack') {
        // TODO: Support :let [a, b; rest] = ["aval", "bval", 3, 4]
        if (value.type !== 'list') {
          throw VimError.fromCode(ErrorCode.ListRequired);
        }
        if (variable.names.length < value.items.length) {
          throw VimError.fromCode(ErrorCode.LessTargetsThanListItems);
        }
        if (variable.names.length > value.items.length) {
          throw VimError.fromCode(ErrorCode.MoreTargetsThanListItems);
        }
        for (const [i, name] of variable.names.entries()) {
          const item: VariableExpression = { type: 'variable', namespace: undefined, name };
          context.setVariable(item, newValue(item, value.items[i]), this.args.lock);
        }
      } else if (variable.type === 'index') {
        const varValue = context.evaluate(variable.variable);
        if (varValue.type === 'list') {
          const idx = toInt(context.evaluate(variable.index));
          const newItem = newValue(
            {
              type: 'index',
              expression: variable.variable,
              index: int(idx),
            },
            value,
          );
          varValue.items[idx] = newItem;
          context.setVariable(variable.variable, varValue, this.args.lock);
        } else if (varValue.type === 'dict_val') {
          const key = toString(context.evaluate(variable.index));
          const newItem = newValue(
            {
              type: 'entry',
              expression: variable.variable,
              entryName: key,
            },
            value,
          );
          varValue.items.set(key, newItem);
          context.setVariable(variable.variable, varValue, this.args.lock);
        } else {
          // TODO: Support blobs
          throw VimError.fromCode(ErrorCode.CanOnlyIndexAListDictionaryOrBlob);
        }
      } else if (variable.type === 'slice') {
        // TODO: Operations other than `=`?
        // TODO: Support blobs
        const varValue = context.evaluate(variable.variable);
        if (varValue.type !== 'list' || value.type !== 'list') {
          throw VimError.fromCode(ErrorCode.CanOnlyIndexAListDictionaryOrBlob);
        }
        if (value.type !== 'list') {
          throw VimError.fromCode(ErrorCode.SliceRequiresAListOrBlobValue);
        }
        const start = variable.start ? toInt(context.evaluate(variable.start)) : 0;
        if (start > varValue.items.length - 1) {
          throw VimError.fromCode(ErrorCode.ListIndexOutOfRange, start.toString());
        }
        // NOTE: end is inclusive, unlike in JS
        const end = variable.end
          ? toInt(context.evaluate(variable.end))
          : varValue.items.length - 1;
        const slots = end - start + 1;
        if (slots > value.items.length) {
          throw VimError.fromCode(ErrorCode.ListValueHasNotEnoughItems);
        } else if (slots < value.items.length) {
          // TODO: Allow this when going past end of list and end === undefined
          throw VimError.fromCode(ErrorCode.ListValueHasMoreItemsThanTarget);
        }
        let i = start;
        for (const item of value.items) {
          varValue.items[i] = item;
          ++i;
        }
        context.setVariable(variable.variable, varValue, this.args.lock);
      }
    }
  }
}

export class UnletCommand extends ExCommand {
  public static readonly argParser = seqMap(
    bangParser,
    whitespace.then(variableParser.sepBy(whitespace)),
    (bang, variables) => {
      if (variables.length === 0) {
        throw VimError.fromCode(ErrorCode.ArgumentRequired);
      }
      return new UnletCommand(variables, bang);
    },
  );

  private variables: VariableExpression[];
  private bang: boolean;
  public constructor(variables: VariableExpression[], bang: boolean) {
    super();
    this.variables = variables;
    this.bang = bang;
  }

  async execute(vimState: VimState): Promise<void> {
    const ctx = new EvaluationContext();
    for (const variable of this.variables) {
      const store = ctx.getVariableStore(variable.namespace);
      const existed = store?.delete(variable.name);
      if (!existed && !this.bang) {
        throw VimError.fromCode(ErrorCode.NoSuchVariable, `"${variable.name}"`);
      }
    }
  }
}
