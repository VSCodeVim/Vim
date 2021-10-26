import { all } from 'parsimmon';
import { displayValue } from './displayValue';
import { configuration } from '../../configuration/configuration';
import { ErrorCode, VimError } from '../../error';
import { globalState } from '../../state/globalState';
import { bool, float, funcref, listExpr, int, str, list } from './build';
import { expressionParser, numberParser } from './parser';
import {
  BinaryOp,
  ComparisonOp,
  DictionaryValue,
  Expression,
  FloatValue,
  ListValue,
  NumberValue,
  StringValue,
  UnaryOp,
  Value,
  VariableExpression,
} from './types';

// ID of next lambda; incremented each time one is created
let lambdaNumber = 1;

function toInt(value: Value): number {
  switch (value.type) {
    case 'number':
      return value.value;
    case 'float':
      throw VimError.fromCode(ErrorCode.UsingAFloatAsANumber);
    case 'string':
      const parsed = numberParser.skip(all).parse(value.value);
      if (parsed.status === false) {
        return 0;
      }
      return parsed.value.value;
    case 'list':
      throw VimError.fromCode(ErrorCode.UsingAListAsANumber);
    case 'dict_val':
      throw VimError.fromCode(ErrorCode.UsingADictionaryAsANumber);
    case 'funcref':
      throw VimError.fromCode(ErrorCode.UsingAFuncrefAsANumber);
  }
}

function toFloat(value: Value): number {
  switch (value.type) {
    case 'number':
      return value.value;
    case 'float':
      return value.value;
    case 'string':
    case 'list':
    case 'dict_val':
    case 'funcref':
      throw VimError.fromCode(ErrorCode.NumberOrFloatRequired);
  }
}

function toString(value: Value): string {
  switch (value.type) {
    case 'number':
      return value.value.toString();
    case 'float':
      throw VimError.fromCode(ErrorCode.UsingFloatAsAString);
    case 'string':
      return value.value;
    case 'list':
      throw VimError.fromCode(ErrorCode.UsingListAsAString);
    case 'dict_val':
      throw VimError.fromCode(ErrorCode.UsingDictionaryAsAString);
    case 'funcref':
      throw VimError.fromCode(ErrorCode.UsingFuncrefAsAString);
  }
}

function toDict(value: Value): DictionaryValue {
  switch (value.type) {
    case 'number':
    case 'float':
    case 'string':
    case 'list':
    case 'funcref':
      throw VimError.fromCode(ErrorCode.DictionaryRequired);
    case 'dict_val':
      return value;
  }
}

function mapNumber(value: Value, f: (x: number) => number): NumberValue | FloatValue {
  switch (value.type) {
    case 'float':
      return float(f(value.value));
    default:
      return int(f(toInt(value)));
  }
}

export class Variable {
  public value: Value;
  public locked: boolean = false;

  constructor(value: Value) {
    this.value = value;
  }
}

type VariableStore = Map<string, Variable>;

export class EvaluationContext {
  private static globalVariables: VariableStore = new Map();

  private localScopes: VariableStore[] = [];

  /**
   * Fully evaluates the given expression and returns the resulting value.
   * May throw a variety of VimErrors if the expression is semantically invalid.
   */
  public evaluate(expression: Expression): Value {
    switch (expression.type) {
      case 'number':
      case 'float':
      case 'string':
      case 'dict_val':
      case 'funcref':
        return expression;
      case 'list':
        return list(expression.items.map((x) => this.evaluate(x)));
      case 'dictionary': {
        const items = new Map<string, Value>();
        for (const [key, val] of expression.items) {
          const keyStr = toString(this.evaluate(key));
          if (items.has(keyStr)) {
            throw VimError.fromCode(ErrorCode.DuplicateKeyInDictionary, `"${keyStr}"`);
          } else {
            items.set(keyStr, this.evaluate(val));
          }
        }
        return {
          type: 'dict_val',
          items,
        };
      }
      case 'variable':
        return this.evaluateVariable(expression);
      case 'register':
        return str(''); // TODO
      case 'option':
        return str(''); // TODO
      case 'env_variable':
        return str(process.env[expression.name] ?? '');
      case 'function_call':
        const getArgs = (min: number, max?: number) => {
          if (max === undefined) {
            max = min;
          }
          if (expression.args.length < min) {
            throw VimError.fromCode(ErrorCode.NotEnoughArgs, expression.func);
          }
          if (expression.args.length > max) {
            throw VimError.fromCode(ErrorCode.TooManyArgs, expression.func);
          }
          const args: Array<Value | undefined> = expression.args.map((arg) => this.evaluate(arg));
          while (args.length < max) {
            args.push(undefined);
          }
          return args;
        };
        switch (expression.func) {
          case 'abs': {
            const [x] = getArgs(1);
            return float(Math.abs(toFloat(x!)));
          }
          case 'acos': {
            const [x] = getArgs(1);
            return float(Math.acos(toFloat(x!)));
          }
          case 'asin': {
            const [x] = getArgs(1);
            return float(Math.asin(toFloat(x!)));
          }
          case 'atan2': {
            const [x, y] = getArgs(2);
            return float(Math.atan2(toFloat(x!), toFloat(y!)));
          }
          case 'and': {
            const [x, y] = getArgs(2);
            // tslint:disable-next-line: no-bitwise
            return int(toInt(x!) & toInt(y!));
          }
          case 'ceil': {
            const [x] = getArgs(1);
            return float(Math.ceil(toFloat(x!)));
          }
          case 'copy': {
            const [x] = getArgs(1);
            switch (x?.type) {
              case 'list':
                return list([...x.items]);
              case 'dict_val':
                return {
                  type: 'dict_val',
                  items: new Map(x.items),
                };
            }
            return x!;
          }
          case 'cos': {
            const [x] = getArgs(1);
            return float(Math.cos(toFloat(x!)));
          }
          case 'cosh': {
            const [x] = getArgs(1);
            return float(Math.cosh(toFloat(x!)));
          }
          case 'deepcopy': {
            // TODO: real deep copy once references are implemented
            const [x] = getArgs(1);
            return x!;
          }
          case 'empty': {
            let [x] = getArgs(1);
            x = x!;
            switch (x.type) {
              case 'number':
              case 'float':
                return bool(x.value === 0);
              case 'string':
                return bool(x.value.length === 0);
              case 'list':
                return bool(x.items.length === 0);
              case 'dict_val':
                return bool(x.items.size === 0);
              // TODO:
              // case 'blob':
              default:
                return bool(false);
            }
          }
          case 'eval': {
            const [expr] = getArgs(1);
            return this.evaluate(expressionParser.tryParse(toString(expr!)));
          }
          case 'exp': {
            const [x] = getArgs(1);
            return float(Math.exp(toFloat(x!)));
          }
          case 'float2nr': {
            const [x] = getArgs(1);
            return int(Math.trunc(toFloat(x!)));
          }
          case 'function': {
            const [name, arglist, dict] = getArgs(1, 3);
            if (arglist) {
              if (arglist.type === 'list') {
                if (dict && dict.type !== 'dict_val') {
                  throw VimError.fromCode(ErrorCode.ExpectedADict);
                }
                return funcref(toString(name!), arglist, dict);
              } else if (arglist.type === 'dict_val') {
                if (dict) {
                  // function('abs', {}, {})
                  throw VimError.fromCode(ErrorCode.SecondArgumentOfFunction);
                }
                return funcref(toString(name!), undefined, arglist);
              } else {
                throw VimError.fromCode(ErrorCode.SecondArgumentOfFunction);
              }
            }
            if (dict && dict.type !== 'dict_val') {
              throw VimError.fromCode(ErrorCode.ExpectedADict);
            }
            // TODO:
            // if (toString(name!) is invalid function) {
            //   throw VimError.fromCode(ErrorCode.UnknownFunction_funcref, toString(name!));
            // }
            return {
              type: 'funcref',
              name: toString(name!),
              arglist,
              dict,
            };
          }
          case 'floor': {
            const [x] = getArgs(1);
            return float(Math.floor(toFloat(x!)));
          }
          case 'fmod': {
            const [x, y] = getArgs(2);
            return float(toFloat(x!) % toFloat(y!));
          }
          case 'isinf': {
            const [x] = getArgs(1);
            const _x = toFloat(x!);
            return bool(_x === Infinity || _x === -Infinity);
          }
          case 'isnan': {
            const [x] = getArgs(1);
            return bool(isNaN(toFloat(x!)));
          }
          case 'items': {
            const [d] = getArgs(1);
            return list([...toDict(d!).items.entries()].map(([k, v]) => list([str(k), v])));
          }
          case 'keys': {
            const [d] = getArgs(1);
            return list([...toDict(d!).items.keys()].map(str));
          }
          case 'log': {
            const [x] = getArgs(1);
            return float(Math.log(toFloat(x!)));
          }
          case 'log10': {
            const [x] = getArgs(1);
            return float(Math.log10(toFloat(x!)));
          }
          case 'map': {
            const [seq, fn] = getArgs(2);
            switch (seq?.type) {
              case 'list':
                return list(
                  seq.items.map((val, idx) => {
                    switch (fn?.type) {
                      case 'funcref':
                        return this.evaluate({
                          type: 'funcrefCall',
                          expression: fn,
                          args: [int(idx), val],
                        });
                      default:
                        this.localScopes.push(
                          new Map([
                            ['v:key', new Variable(int(idx))],
                            ['v:val', new Variable(val)],
                          ])
                        );
                        const retval = this.evaluate(expressionParser.tryParse(toString(fn!)));
                        this.localScopes.pop();
                        return retval;
                    }
                  })
                );
              case 'dict_val':
              // TODO
              // case 'blob':
              // TODO
              default:
                throw VimError.fromCode(ErrorCode.ArgumentOfMapMustBeAListDictionaryOrBlob);
            }
          }
          case 'max': {
            const [l] = getArgs(1);
            let values: Value[];
            if (l?.type === 'list') {
              values = l.items;
            } else if (l?.type === 'dict_val') {
              values = [...l.items.values()];
            } else {
              throw VimError.fromCode(ErrorCode.ArgumentOfMaxMustBeAListOrDictionary);
            }
            return int(values.length === 0 ? 0 : Math.max(...values.map(toInt)));
          }
          case 'min': {
            const [l] = getArgs(1);
            let values: Value[];
            if (l?.type === 'list') {
              values = l.items;
            } else if (l?.type === 'dict_val') {
              values = [...l.items.values()];
            } else {
              // TODO: This should say "min", but still have code 712
              throw VimError.fromCode(ErrorCode.ArgumentOfMaxMustBeAListOrDictionary);
            }
            return int(values.length === 0 ? 0 : Math.min(...values.map(toInt)));
          }
          case 'or': {
            const [x, y] = getArgs(2);
            // tslint:disable-next-line: no-bitwise
            return int(toInt(x!) | toInt(y!));
          }
          case 'pow': {
            const [x, y] = getArgs(2);
            return float(Math.pow(toFloat(x!), toFloat(y!)));
          }
          case 'range': {
            const [val, max, stride] = getArgs(1, 3);
            const start = max !== undefined ? toInt(val!) : 0;
            const end = max !== undefined ? toInt(max) : toInt(val!) - 1;
            const step = stride !== undefined ? toInt(stride) : 1;
            if (step === 0) {
              throw VimError.fromCode(ErrorCode.StrideIsZero);
            }
            if (step > 0 !== start < end && Math.abs(start - end) > 1) {
              throw VimError.fromCode(ErrorCode.StartPastEnd);
            }
            const items: Value[] = [];
            for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
              items.push(int(i));
            }
            return list(items);
          }
          case 'repeat': {
            const [val, count] = getArgs(2);
            if (val?.type === 'list') {
              const items: Value[] = new Array<Value[]>(toInt(count!)).fill(val.items).flat();
              return list(items);
            } else {
              return str(toString(val!).repeat(toInt(count!)));
            }
          }
          case 'reverse': {
            const [l] = getArgs(1);
            if (l?.type === 'list') {
              l.items.reverse();
              return l;
            }
            // TODO: handle Blob
            return int(0);
          }
          case 'round': {
            const [x] = getArgs(1);
            const _x = toFloat(x!);
            // Halfway between integers, Math.round() rounds toward infinity while Vim's round() rounds away from 0.
            return float(_x < 0 ? -Math.round(-_x) : _x);
          }
          case 'sin': {
            const [x] = getArgs(1);
            return float(Math.sin(toFloat(x!)));
          }
          case 'sinh': {
            const [x] = getArgs(1);
            return float(Math.sinh(toFloat(x!)));
          }
          case 'sort': {
            // TODO: use dict
            const [l, func, dict] = getArgs(1, 3);
            if (l?.type !== 'list') {
              throw VimError.fromCode(ErrorCode.ArgumentOfSortMustBeAList);
            }
            let compare: (x: Value, y: Value) => number;
            if (func !== undefined) {
              if (func.type === 'string') {
                if (func.value === '1' || func.value === 'i') {
                  // Ignore case
                  compare = (x, y) =>
                    displayValue(x).toLowerCase().localeCompare(displayValue(y).toLowerCase());
                } else {
                  // TODO: handle other special cases ('l', 'n', 'N', 'f')
                  throw Error('compare() with function name is not yet implemented');
                }
              } else if (func.type === 'funcref') {
                compare = (x, y) =>
                  toInt(
                    this.evaluate({
                      type: 'funcrefCall',
                      expression: func,
                      args: [x, y],
                    })
                  );
              } else {
                throw VimError.fromCode(ErrorCode.InvalidArgument);
              }
            } else {
              compare = (x, y) => displayValue(x).localeCompare(displayValue(y));
            }
            // TODO: Numbers after Strings, Lists after Numbers
            return list(l.items.sort(compare));
          }
          case 'sqrt': {
            const [x] = getArgs(1);
            return float(Math.sqrt(toFloat(x!)));
          }
          case 'string': {
            const [x] = getArgs(1);
            return str(displayValue(x!));
          }
          case 'tan': {
            const [x] = getArgs(1);
            return float(Math.tan(toFloat(x!)));
          }
          case 'tanh': {
            const [x] = getArgs(1);
            return float(Math.tanh(toFloat(x!)));
          }
          case 'tolower': {
            const [s] = getArgs(1);
            return str(toString(s!).toLowerCase());
          }
          case 'toupper': {
            const [s] = getArgs(1);
            return str(toString(s!).toUpperCase());
          }
          case 'trunc': {
            const [x] = getArgs(1);
            return float(Math.trunc(toFloat(x!)));
          }
          case 'type': {
            let [x] = getArgs(1);
            x = x!;
            switch (x.type) {
              case 'number':
                return int(0);
              case 'string':
                return int(1);
              case 'funcref':
                return int(2);
              case 'list':
                return int(3);
              case 'dict_val':
                return int(4);
              case 'float':
                return int(5);
              // case 'bool':
              //   return num(6);
              // case 'null':
              //   return num(7);
              // case 'blob':
              //   return num(8);
              default:
                const guard: never = x;
                throw new Error('type() got unexpected type');
            }
          }
          case 'values': {
            const [d] = getArgs(1);
            return list([...toDict(d!).items.values()]);
          }
          case 'xor': {
            const [x, y] = getArgs(2);
            // tslint:disable-next-line: no-bitwise
            return int(toInt(x!) ^ toInt(y!));
          }
          // TODO: many, many more
          default: {
            throw VimError.fromCode(ErrorCode.UnknownFunction_call, expression.func);
          }
        }
      case 'index': {
        return this.evaluateIndex(
          this.evaluate(expression.expression),
          this.evaluate(expression.index)
        );
      }
      case 'slice': {
        return this.evaluateSlice(
          this.evaluate(expression.expression),
          expression.start ? this.evaluate(expression.start) : int(0),
          expression.end ? this.evaluate(expression.end) : int(-1)
        );
      }
      case 'entry': {
        const entry = toDict(this.evaluate(expression.expression)).items.get(expression.entryName);
        if (!entry) {
          throw VimError.fromCode(ErrorCode.KeyNotPresentInDictionary, expression.entryName);
        }
        return entry;
      }
      case 'funcrefCall': {
        const fref = this.evaluate(expression.expression);
        if (fref.type !== 'funcref') {
          // TODO
          throw new Error(`Expected funcref, got ${fref.type}`);
        }
        // TODO: use `fref.dict`
        if (fref.body) {
          return fref.body(expression.args.map((x) => this.evaluate(x)));
        } else {
          return this.evaluate({
            type: 'function_call',
            func: fref.name,
            args: (fref.arglist?.items ?? []).concat(expression.args.map((x) => this.evaluate(x))),
          });
        }
      }
      case 'lambda': {
        return {
          type: 'funcref',
          name: `<lambda>${lambdaNumber++}`,
          body: (args: Value[]) => {
            // TODO: handle wrong # of args
            const store: VariableStore = new Map();
            for (let i = 0; i < args.length; i++) {
              store.set(expression.args[i], new Variable(args[i]));
            }

            this.localScopes.push(store);
            const retval = this.evaluate(expression.body);
            this.localScopes.pop();
            return retval;
          },
        };
      }
      case 'unary':
        return this.evaluateUnary(expression.operator, expression.operand);
      case 'binary':
        return this.evaluateBinary(expression.operator, expression.lhs, expression.rhs);
      case 'ternary':
        return this.evaluate(
          toInt(this.evaluate(expression.if)) !== 0 ? expression.then : expression.else
        );
      case 'comparison':
        return bool(
          this.evaluateComparison(
            expression.operator,
            expression.matchCase ?? configuration.ignorecase,
            expression.lhs,
            expression.rhs
          )
        );
      default: {
        const guard: never = expression;
        throw new Error(`evaluate() got unexpected expression type`);
      }
    }
  }

  public setVariable(varExpr: VariableExpression, value: Value): void {
    if (value.type === 'funcref' && varExpr.name[0] === varExpr.name[0].toLowerCase()) {
      throw VimError.fromCode(ErrorCode.FuncrefVariableNameMustStartWithACapital, varExpr.name);
    }

    let store: VariableStore | undefined;
    if (this.localScopes.length > 0 && varExpr.namespace === undefined) {
      store = this.localScopes[this.localScopes.length - 1];
    } else if (varExpr.namespace === 'g' || varExpr.namespace === undefined) {
      store = EvaluationContext.globalVariables;
    } else {
      // TODO
    }

    if (store) {
      const _var = store.get(varExpr.name);
      if (_var) {
        _var.value = value;
      } else {
        store.set(varExpr.name, new Variable(value));
      }
    }
  }

  private evaluateVariable(varExpr: VariableExpression): Value {
    if (varExpr.namespace === undefined) {
      for (let i = this.localScopes.length - 1; i >= 0; i--) {
        const _var = this.localScopes[i].get(varExpr.name);
        if (_var !== undefined) {
          return _var.value;
        }
      }
    }

    if (varExpr.namespace === 'g' || varExpr.namespace === undefined) {
      const _var = EvaluationContext.globalVariables.get(varExpr.name);
      if (_var === undefined) {
        throw VimError.fromCode(
          ErrorCode.UndefinedVariable,
          varExpr.namespace ? `${varExpr.namespace}:${varExpr.name}` : varExpr.name
        );
      } else {
        return _var.value;
      }
    } else if (varExpr.namespace === 'v') {
      if (varExpr.name === 'true') {
        return bool(true);
      } else if (varExpr.name === 'false') {
        return bool(false);
      } else if (varExpr.name === 'hlsearch') {
        return bool(globalState.hl);
      } else if (varExpr.name === 't_number') {
        return int(0);
      } else if (varExpr.name === 't_string') {
        return int(1);
      } else if (varExpr.name === 't_func') {
        return int(2);
      } else if (varExpr.name === 't_list') {
        return int(3);
      } else if (varExpr.name === 't_dict') {
        return int(4);
      } else if (varExpr.name === 't_float') {
        return int(5);
      } else if (varExpr.name === 't_bool') {
        return int(6);
      } else if (varExpr.name === 'numbermax') {
        return int(Number.MAX_VALUE);
      } else if (varExpr.name === 'numbermin') {
        return int(Number.MIN_VALUE);
      }

      // HACK: for things like v:key & v:val
      return this.evaluate({
        type: 'variable',
        namespace: undefined,
        name: `v:${varExpr.name}`,
      });
    }

    throw VimError.fromCode(
      ErrorCode.UndefinedVariable,
      varExpr.namespace ? `${varExpr.namespace}:${varExpr.name}` : varExpr.name
    );
  }

  private evaluateIndex(sequence: Value, index: Value): Value {
    switch (sequence.type) {
      case 'string':
      case 'number':
      case 'float': {
        const idx = toInt(index);
        return str(idx >= 0 ? toString(sequence)[idx] ?? '' : '');
      }
      case 'list': {
        let idx = toInt(index);
        idx = idx < 0 ? sequence.items.length - idx : 0;
        if (idx < 0 || idx >= sequence.items.length) {
          throw VimError.fromCode(ErrorCode.ListIndexOutOfRange, idx.toString());
        }
        return sequence.items[toInt(index)];
      }
      case 'dict_val': {
        const key = toString(index);
        const result = sequence.items.get(key);
        if (result === undefined) {
          throw VimError.fromCode(ErrorCode.KeyNotPresentInDictionary, key);
        }
        return result;
      }
      case 'funcref': {
        throw VimError.fromCode(ErrorCode.CannotIndexAFuncref);
      }
    }
  }

  private evaluateSlice(sequence: Value, start: Value, end: Value): Value {
    let _start = toInt(start);
    let _end = toInt(end);
    switch (sequence.type) {
      case 'string':
      case 'number':
      case 'float': {
        const _sequence = toString(sequence);
        while (_start < 0) {
          _start += _sequence.length;
        }
        while (_end < 0) {
          _end += _sequence.length;
        }
        if (_end < _start) {
          return str('');
        }
        return str(_sequence.substring(_start, _end + 1));
      }
      case 'list': {
        while (_start < 0) {
          _start += sequence.items.length;
        }
        while (_end < 0) {
          _end += sequence.items.length;
        }
        if (_end < _start) {
          return list([]);
        }
        return list(sequence.items.slice(_start, _end + 1));
      }
      case 'dict_val': {
        throw VimError.fromCode(ErrorCode.CannotUseSliceWithADictionary);
      }
      case 'funcref': {
        throw VimError.fromCode(ErrorCode.CannotIndexAFuncref);
      }
    }
  }

  private evaluateUnary(operator: UnaryOp, operand: Expression): NumberValue | FloatValue {
    return mapNumber(this.evaluate(operand), (x: number) => {
      switch (operator) {
        case '+':
          return x;
        case '-':
          return -x;
        case '!':
          return x === 0 ? 1 : 0;
        default:
          throw new Error('Impossible');
      }
    });
  }

  private evaluateBinary(operator: BinaryOp, lhsExpr: Expression, rhsExpr: Expression): Value {
    const [lhs, rhs] = [this.evaluate(lhsExpr), this.evaluate(rhsExpr)];
    switch (operator) {
      case '+':
        if (lhs.type === 'list' && rhs.type === 'list') {
          return listExpr(lhs.items.concat(rhs.items)) as ListValue;
        } else {
          return int(toInt(lhs) + toInt(rhs));
        }
      case '-':
        return int(toInt(lhs) - toInt(rhs));
      case '.':
      case '..':
        return str(toString(lhs) + toString(rhs));
      case '*':
        return int(toInt(lhs) * toInt(rhs));
      case '/':
        return int(Math.trunc(toInt(lhs) / toInt(rhs)));
      case '%': {
        if (lhs.type === 'float' || rhs.type === 'float') {
          throw VimError.fromCode(ErrorCode.CannotUseModuloWithFloat);
        }
        const [_lhs, _rhs] = [toInt(lhs), toInt(rhs)];
        if (_rhs === 0) {
          return int(0);
        }

        return int(_lhs % _rhs);
      }
      case '&&':
        return bool(toInt(lhs) !== 0 && toInt(rhs) !== 0);
      case '||':
        return bool(toInt(lhs) !== 0 || toInt(rhs) !== 0);
    }
  }

  private evaluateComparison(
    operator: ComparisonOp,
    matchCase: boolean,
    lhsExpr: Expression,
    rhsExpr: Expression
  ): boolean {
    switch (operator) {
      case '==':
        return this.evaluateBasicComparison('==', matchCase, lhsExpr, rhsExpr);
      case '!=':
        return !this.evaluateBasicComparison('==', matchCase, lhsExpr, rhsExpr);
      case '>':
        return this.evaluateBasicComparison('>', matchCase, lhsExpr, rhsExpr);
      case '>=':
        return (
          this.evaluateBasicComparison('>', matchCase, lhsExpr, rhsExpr) ||
          this.evaluateBasicComparison('==', matchCase, lhsExpr, rhsExpr)
        );
      case '<':
        return this.evaluateBasicComparison('>', matchCase, rhsExpr, lhsExpr);
      case '<=':
        return !this.evaluateBasicComparison('>', matchCase, lhsExpr, rhsExpr);
      case '=~':
        return this.evaluateBasicComparison('=~', matchCase, lhsExpr, rhsExpr);
      case '!~':
        return !this.evaluateBasicComparison('=~', matchCase, lhsExpr, rhsExpr);
      case 'is':
        return this.evaluateBasicComparison('is', matchCase, lhsExpr, rhsExpr);
      case 'isnot':
        return !this.evaluateBasicComparison('is', matchCase, lhsExpr, rhsExpr);
    }
  }

  private evaluateBasicComparison(
    operator: '==' | '>' | '=~' | 'is',
    matchCase: boolean,
    lhsExpr: Expression,
    rhsExpr: Expression
  ): boolean {
    if (operator === 'is' && lhsExpr.type !== rhsExpr.type) {
      return false;
    }

    if (lhsExpr.type === 'list') {
      if (rhsExpr.type === 'list') {
        switch (operator) {
          case '==':
            return (
              lhsExpr.items.length === rhsExpr.items.length &&
              lhsExpr.items.every((left, idx) =>
                this.evaluateBasicComparison('==', matchCase, left, rhsExpr.items[idx])
              )
            );
          case 'is':
            return lhsExpr.items === rhsExpr.items;
          default:
            throw VimError.fromCode(ErrorCode.InvalidOperationForList);
        }
      } else {
        throw VimError.fromCode(ErrorCode.CanOnlyCompareListWithList);
      }
    } else if (rhsExpr.type === 'list') {
      throw VimError.fromCode(ErrorCode.CanOnlyCompareListWithList);
    } else if (lhsExpr.type === 'dictionary') {
      if (rhsExpr.type === 'dictionary') {
        const [lhs, rhs] = [this.evaluate(lhsExpr), this.evaluate(rhsExpr)] as [
          DictionaryValue,
          DictionaryValue
        ];
        switch (operator) {
          case '==':
            return (
              lhs.items.size === rhs.items.size &&
              [...lhs.items.entries()].every(
                ([key, value]) =>
                  rhs.items.has(key) &&
                  this.evaluateBasicComparison('==', matchCase, value, rhs.items.get(key)!)
              )
            );
          case 'is':
            return lhs.items === rhs.items;
          default:
            throw VimError.fromCode(ErrorCode.InvalidOperationForDictionary);
        }
      } else {
        throw VimError.fromCode(ErrorCode.CanOnlyCompareDictionaryWithDictionary);
      }
    } else if (rhsExpr.type === 'dictionary') {
      throw VimError.fromCode(ErrorCode.CanOnlyCompareDictionaryWithDictionary);
    } else {
      let [lhs, rhs] = [this.evaluate(lhsExpr), this.evaluate(rhsExpr)] as [
        NumberValue | StringValue,
        NumberValue | StringValue
      ];
      if (lhs.type === 'number' || rhs.type === 'number') {
        // TODO: this conversion should only be done at top level (not in list/dictionary)
        [lhs, rhs] = [int(toInt(lhs)), int(toInt(rhs))];
      } else if (!matchCase) {
        lhs.value = lhs.value.toLowerCase();
        rhs.value = rhs.value.toLowerCase();
      }
      switch (operator) {
        case '==':
          return lhs.value === rhs.value;
        case 'is':
          return lhs.type === rhs.type && lhs.value === rhs.value;
        case '>':
          return lhs.value > rhs.value;
        case '=~':
          return false; // TODO
      }
    }
  }
}
