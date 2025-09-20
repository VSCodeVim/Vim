import { all } from 'parsimmon';
import { displayValue } from './displayValue';
import { configuration } from '../../configuration/configuration';
import { ErrorCode, VimError } from '../../error';
import { globalState } from '../../state/globalState';
import {
  bool,
  float,
  funcref,
  int,
  str,
  list,
  funcCall,
  blob,
  dictionary,
  funcrefCall,
} from './build';
import { expressionParser, floatParser, numberParser } from './parser';
import {
  BinaryOp,
  ComparisonOp,
  DictionaryValue,
  Expression,
  FloatValue,
  FuncRefValue,
  FunctionCallExpression,
  ListValue,
  NumberValue,
  UnaryOp,
  Value,
  VariableExpression,
} from './types';
import { Pattern, SearchDirection } from '../pattern';
import { escapeRegExp, isInteger } from 'lodash';

// ID of next lambda; incremented each time one is created
let lambdaNumber = 1;

export function toInt(value: Value): number {
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
    case 'blob':
      throw VimError.fromCode(ErrorCode.UsingABlobAsANumber);
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
    case 'blob':
      throw VimError.fromCode(ErrorCode.NumberOrFloatRequired);
  }
}

export function toString(value: Value): string {
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
    case 'blob':
      return displayValue(value);
  }
}

function toList(value: Value): ListValue {
  switch (value.type) {
    case 'number':
    case 'float':
    case 'string':
    case 'funcref':
    case 'dict_val':
    case 'blob':
      throw VimError.fromCode(ErrorCode.ListRequired);
    case 'list':
      return value;
  }
}

function toDict(value: Value): DictionaryValue {
  switch (value.type) {
    case 'number':
    case 'float':
    case 'string':
    case 'list':
    case 'funcref':
    case 'blob':
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

  constructor(value: Value, locked: boolean = false) {
    this.value = value;
    this.locked = locked;
  }
}

export type VariableStore = Map<string, Variable>;

export class EvaluationContext {
  private static globalVariables: VariableStore = new Map();

  private localScopes: VariableStore[] = [];
  private errors: string[] = [];

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
      case 'blob':
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
        return dictionary(items);
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
        return this.evaluateFunctionCall(expression);
      case 'index': {
        return this.evaluateIndex(
          this.evaluate(expression.expression),
          this.evaluate(expression.index),
        );
      }
      case 'slice': {
        return this.evaluateSlice(
          this.evaluate(expression.expression),
          expression.start ? this.evaluate(expression.start) : int(0),
          expression.end ? this.evaluate(expression.end) : int(-1),
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
          return this.evaluateFunctionCall(
            funcCall(
              fref.name,
              (fref.arglist?.items ?? []).concat(expression.args.map((x) => this.evaluate(x))),
            ),
          );
        }
      }
      case 'methodCall': {
        const obj = this.evaluate(expression.expression);
        return this.evaluateFunctionCall(
          funcCall(expression.methodName, [obj, ...expression.args]),
        );
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
          toInt(this.evaluate(expression.if)) !== 0 ? expression.then : expression.else,
        );
      case 'comparison':
        return bool(
          this.evaluateComparison(
            expression.operator,
            expression.matchCase ?? configuration.ignorecase,
            this.evaluate(expression.lhs),
            this.evaluate(expression.rhs),
          ),
        );
      default: {
        const guard: never = expression;
        throw new Error(`evaluate() got unexpected expression type`);
      }
    }
  }

  public setVariable(varExpr: VariableExpression, value: Value, lock: boolean): void {
    if (value.type === 'funcref' && varExpr.name[0] === varExpr.name[0].toLowerCase()) {
      throw VimError.fromCode(ErrorCode.FuncrefVariableNameMustStartWithACapital, varExpr.name);
    }

    const store = this.getVariableStore(varExpr.namespace);

    if (store) {
      const _var = store.get(varExpr.name);
      if (_var) {
        if (lock) {
          throw VimError.fromCode(ErrorCode.CannotModifyExistingVariable);
        }
        if (_var.locked) {
          throw VimError.fromCode(ErrorCode.ValueIsLocked, varExpr.name);
        }
        _var.value = value;
      } else {
        store.set(varExpr.name, new Variable(value, lock));
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
          varExpr.namespace ? `${varExpr.namespace}:${varExpr.name}` : varExpr.name,
        );
      } else {
        return _var.value;
      }
    } else if (varExpr.namespace === 'v') {
      // TODO: v:count, v:count1, v:prevcount
      // TODO: v:operator
      // TODO: v:register
      // TODO: v:statusmsg, v:warningmsg, v:errmsg
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
      } else if (varExpr.name === 't_blob') {
        return int(10);
      } else if (varExpr.name === 'numbermax') {
        return int(Number.MAX_SAFE_INTEGER);
      } else if (varExpr.name === 'numbermin') {
        return int(Number.MIN_SAFE_INTEGER);
      } else if (varExpr.name === 'numbersize') {
        // NOTE: In VimScript this refers to a 64 bit integer; we have a 64 bit float because JavaScript
        return int(64);
      } else if (varExpr.name === 'errors') {
        return list(this.errors.map(str));
      } else if (varExpr.name === 'searchforward') {
        return int(globalState.searchState?.direction === SearchDirection.Backward ? 0 : 1);
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
      varExpr.namespace ? `${varExpr.namespace}:${varExpr.name}` : varExpr.name,
    );
  }

  public getVariableStore(namespace: string | undefined): VariableStore | undefined {
    if (this.localScopes.length > 0 && namespace === undefined) {
      return this.localScopes.at(-1);
    } else if (namespace === 'g' || namespace === undefined) {
      return EvaluationContext.globalVariables;
    }
    // TODO
    return undefined;
  }

  private evaluateIndex(sequence: Value, index: Value): Value {
    switch (sequence.type) {
      case 'string':
      case 'number':
      case 'float': {
        const idx = toInt(index);
        return str(idx >= 0 ? (toString(sequence)[idx] ?? '') : '');
      }
      case 'list': {
        let idx = toInt(index);
        idx = idx < 0 ? sequence.items.length - idx : idx;
        if (idx < 0 || idx >= sequence.items.length) {
          throw VimError.fromCode(ErrorCode.ListIndexOutOfRange, idx.toString());
        }
        return sequence.items[idx];
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
      case 'blob': {
        const bytes = new Uint8Array(sequence.data);
        return int(bytes[toInt(index)]);
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
      case 'blob': {
        return blob(new Uint8Array(sequence.data).slice(_start, _end + 1));
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
    let [lhs, rhs] = [this.evaluate(lhsExpr), this.evaluate(rhsExpr)];

    const arithmetic = (f: (x: number, y: number) => number) => {
      const numType = lhs.type === 'float' || rhs.type === 'float' ? float : int;
      if (lhs.type === 'string') {
        lhs = int(toInt(lhs));
      }
      if (rhs.type === 'string') {
        rhs = int(toInt(rhs));
      }
      return numType(f(toFloat(lhs), toFloat(rhs)));
    };

    switch (operator) {
      case '+':
        if (lhs.type === 'list' && rhs.type === 'list') {
          return list(lhs.items.concat(rhs.items));
        } else {
          return arithmetic((x, y) => x + y);
        }
      case '-':
        return arithmetic((x, y) => x - y);
      case '*':
        return arithmetic((x, y) => x * y);
      case '/':
        return arithmetic((x, y) => x / y);
      case '.':
      case '..':
        return str(toString(lhs) + toString(rhs));
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
    lhs: Value,
    rhs: Value,
  ): boolean {
    switch (operator) {
      case '==':
        return this.evaluateBasicComparison('==', matchCase, lhs, rhs);
      case '!=':
        return !this.evaluateBasicComparison('==', matchCase, lhs, rhs);
      case '>':
        return this.evaluateBasicComparison('>', matchCase, lhs, rhs);
      case '>=':
        return (
          this.evaluateBasicComparison('>', matchCase, lhs, rhs) ||
          this.evaluateBasicComparison('==', matchCase, lhs, rhs)
        );
      case '<':
        return this.evaluateBasicComparison('>', matchCase, rhs, lhs);
      case '<=':
        return !this.evaluateBasicComparison('>', matchCase, lhs, rhs);
      case '=~':
        return this.evaluateBasicComparison('=~', matchCase, lhs, rhs);
      case '!~':
        return !this.evaluateBasicComparison('=~', matchCase, lhs, rhs);
      case 'is':
        return this.evaluateBasicComparison('is', matchCase, lhs, rhs);
      case 'isnot':
        return !this.evaluateBasicComparison('is', matchCase, lhs, rhs);
    }
  }

  private evaluateBasicComparison(
    operator: '==' | '>' | '=~' | 'is',
    matchCase: boolean,
    lhs: Value,
    rhs: Value,
    topLevel: boolean = true,
  ): boolean {
    if (operator === 'is' && lhs.type !== rhs.type) {
      return false;
    }

    if (lhs.type === 'list') {
      if (rhs.type === 'list') {
        switch (operator) {
          case '==':
            const rhsItems = rhs.items;
            return (
              lhs.items.length === rhsItems.length &&
              lhs.items.every((left, idx) =>
                this.evaluateBasicComparison('==', matchCase, left, rhsItems[idx], false),
              )
            );
          case 'is':
            return lhs.items === rhs.items;
          default:
            throw VimError.fromCode(ErrorCode.InvalidOperationForList);
        }
      } else {
        throw VimError.fromCode(ErrorCode.CanOnlyCompareListWithList);
      }
    } else if (rhs.type === 'list') {
      throw VimError.fromCode(ErrorCode.CanOnlyCompareListWithList);
    } else if (lhs.type === 'dict_val') {
      if (rhs.type === 'dict_val') {
        switch (operator) {
          case '==':
            const rhsItems = rhs.items;
            return (
              lhs.items.size === rhsItems.size &&
              [...lhs.items.entries()].every(
                ([key, value]) =>
                  rhsItems.has(key) &&
                  this.evaluateBasicComparison('==', matchCase, value, rhsItems.get(key)!, false),
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
    } else if (rhs.type === 'dict_val') {
      throw VimError.fromCode(ErrorCode.CanOnlyCompareDictionaryWithDictionary);
    } else if (lhs.type === 'funcref') {
      if (rhs.type === 'funcref') {
        switch (operator) {
          case '==':
            return lhs.name === rhs.name && lhs.dict === rhs.dict;
          case 'is':
            return lhs === rhs;
          default:
            throw VimError.fromCode(ErrorCode.InvalidOperationForFuncrefs);
        }
      } else {
        return false;
      }
    } else if (rhs.type === 'funcref') {
      return false;
    } else if (lhs.type === 'blob') {
      if (rhs.type === 'blob') {
        switch (operator) {
          case '==':
            const [_lhs, _rhs] = [new Uint8Array(lhs.data), new Uint8Array(rhs.data)];
            return _lhs.length === _rhs.length && _lhs.every((byte, idx) => byte === _rhs[idx]);
          case 'is':
            return lhs.data === rhs.data;
          default:
            throw VimError.fromCode(ErrorCode.InvalidOperationForBlob);
        }
      } else {
        throw VimError.fromCode(ErrorCode.CanOnlyCompareBlobWithBlob);
      }
    } else if (rhs.type === 'blob') {
      throw VimError.fromCode(ErrorCode.CanOnlyCompareBlobWithBlob);
    } else {
      if (lhs.type === 'float' || rhs.type === 'float') {
        [lhs, rhs] = [float(toFloat(lhs)), float(toFloat(rhs))];
      } else if (lhs.type === 'number' || rhs.type === 'number') {
        if (topLevel) {
          // Strings are automatically coerced to numbers, except within a list/dict
          // i.e. 4 == "4" but [4] != ["4"]
          [lhs, rhs] = [int(toInt(lhs)), int(toInt(rhs))];
        }
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
          const pattern = Pattern.parser({
            direction: SearchDirection.Forward,
            delimiter: '/', // TODO: Are these params right?
          }).tryParse(toString(rhs));
          return pattern.regex.test(toString(lhs));
      }
    }
  }

  private evaluateFunctionCall(call: FunctionCallExpression): Value {
    const assertPassed = () => {
      return int(0);
    };
    const assertFailed = (msg: string) => {
      // TODO: Include file & line
      this.errors.push(msg);
      return int(1);
    };
    const getArgs = (min: number, max?: number) => {
      if (max === undefined) {
        max = min;
      }
      if (call.args.length < min) {
        throw VimError.fromCode(ErrorCode.NotEnoughArgs, call.func);
      }
      if (call.args.length > max) {
        throw VimError.fromCode(ErrorCode.TooManyArgs, call.func);
      }
      const args: Array<Value | undefined> = call.args.map((arg) => this.evaluate(arg));
      while (args.length < max) {
        args.push(undefined);
      }
      return args;
    };
    switch (call.func) {
      case 'abs': {
        const [x] = getArgs(1);
        return float(Math.abs(toFloat(x!)));
      }
      case 'acos': {
        const [x] = getArgs(1);
        return float(Math.acos(toFloat(x!)));
      }
      case 'add': {
        const [l, item] = getArgs(2);
        if (l!.type === 'blob') {
          const newBytes = new Uint8Array(l!.data.byteLength + 1);
          newBytes.set(new Uint8Array(l!.data));
          newBytes[newBytes.length - 1] = toInt(item!);
          l!.data = newBytes;
          return blob(newBytes);
        }
        const lst = toList(l!);
        lst.items.push(item!);
        return lst;
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
        // eslint-disable-next-line no-bitwise
        return int(toInt(x!) & toInt(y!));
      }
      case 'assert_beeps': {
        return assertFailed('VSCodeVim does not support beeps');
      }
      case 'assert_equal': {
        const [expected, actual, msg] = getArgs(2, 3);
        if (
          expected!.type === actual!.type &&
          this.evaluateComparison('==', true, expected!, actual!)
        ) {
          return assertPassed();
        }
        return assertFailed(
          msg
            ? toString(msg)
            : `Expected ${displayValue(expected!)} but got ${displayValue(actual!)}`,
        );
      }
      // TODO: assert_equalfile()
      // TODO: assert_exception()
      // TODO: assert_fails()
      case 'assert_false': {
        const [actual, msg] = getArgs(1, 2);
        if (this.evaluateComparison('==', true, bool(false), actual!)) {
          return assertPassed();
        }
        return assertFailed(
          msg ? toString(msg) : `Expected False but got ${displayValue(actual!)}`,
        );
      }
      case 'assert_inrange': {
        const [lower, upper, actual, msg] = getArgs(3, 4);
        if (
          this.evaluateComparison('>=', true, actual!, lower!) &&
          this.evaluateComparison('<=', true, actual!, upper!)
        ) {
          return assertPassed();
        }
        return assertFailed(
          msg
            ? toString(msg)
            : `Expected range ${displayValue(lower!)} - ${displayValue(upper!)} but got ${displayValue(actual!)}`,
        );
      }
      case 'assert_match': {
        const [pattern, actual, msg] = getArgs(2, 3);
        if (this.evaluateComparison('=~', true, actual!, pattern!)) {
          return assertPassed();
        }
        return assertFailed(
          msg
            ? toString(msg)
            : `Pattern '${toString(pattern!)}' does not match '${toString(actual!)}'`,
        );
      }
      case 'assert_nobeep': {
        return assertPassed();
      }
      case 'assert_notequal': {
        const [expected, actual, msg] = getArgs(2, 3);
        if (this.evaluateComparison('!=', true, expected!, actual!)) {
          return assertPassed();
        }
        return assertFailed(
          msg ? toString(msg) : `Expected not equal to ${displayValue(expected!)}`,
        );
      }
      case 'assert_notmatch': {
        const [pattern, actual, msg] = getArgs(2, 3);
        if (!this.evaluateComparison('=~', true, actual!, pattern!)) {
          return assertPassed();
        }
        return assertFailed(
          msg ? toString(msg) : `Pattern '${toString(pattern!)}' does match '${toString(actual!)}'`,
        );
      }
      case 'assert_report': {
        return assertFailed(toString(getArgs(1)[0]!));
      }
      case 'assert_true': {
        const [actual, msg] = getArgs(1, 2);
        if (this.evaluateComparison('!=', true, bool(false), actual!)) {
          return assertPassed();
        }
        return assertFailed(msg ? toString(msg) : `Expected True but got ${displayValue(actual!)}`);
      }
      case 'call': {
        const [_func, arglist, dict] = getArgs(2, 3);
        if (arglist!.type !== 'list') {
          throw VimError.fromCode(ErrorCode.ListRequiredForArgument, '2');
        }
        const func: FuncRefValue = (() => {
          if (_func?.type === 'funcref') {
            return _func;
          }
          return funcref(toString(_func!), list([]), dict ? toDict(dict) : undefined);
        })();
        return this.evaluate(funcrefCall(func, arglist!.items));
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
            return dictionary(new Map(x.items));
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
      case 'count': {
        let [comp, expr, ic, start] = getArgs(2, 4);
        const matchCase = toInt(ic ?? bool(false)) === 0;
        if (start !== undefined) {
          if (comp!.type !== 'list') {
            throw VimError.fromCode(ErrorCode.InvalidArgument474);
          }
          if (toInt(start) >= comp!.items.length) {
            throw VimError.fromCode(ErrorCode.ListIndexOutOfRange, toInt(start).toString());
          }
          while (toInt(start) < 0) {
            start = int(toInt(start) + comp!.items.length);
          }
        }
        let count = 0;
        switch (comp!.type) {
          case 'string':
            const s = toString(expr!);
            if (s) {
              const regex = new RegExp(escapeRegExp(s), matchCase ? 'g' : 'ig');
              count = [...comp!.value.matchAll(regex)].length;
            }
            break;
          case 'list':
            const startIdx = start ? toInt(start) : 0;
            for (let i = startIdx; i < comp!.items.length; i++) {
              if (this.evaluateComparison('==', matchCase, comp!.items[i], expr!)) {
                count++;
              }
            }
            break;
          case 'dict_val':
            for (const val of comp!.items.values()) {
              if (this.evaluateComparison('==', matchCase, val, expr!)) {
                count++;
              }
            }
            break;
          default:
            throw VimError.fromCode(ErrorCode.ArgumentOfMaxMustBeAListOrDictionary);
        }
        return int(count);
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
          case 'blob':
            return bool(x.data.byteLength === 0);
          default:
            return bool(false);
        }
      }
      case 'eval': {
        const [expr] = getArgs(1);
        return this.evaluate(expressionParser.tryParse(toString(expr!)));
      }
      // TODO: exists()
      case 'exp': {
        const [x] = getArgs(1);
        return float(Math.exp(toFloat(x!)));
      }
      // TODO: extend/extendnew()
      // TODO: filter
      case 'flatten':
      case 'flattennew': {
        const [l, _depth] = getArgs(1, 2);
        if (l!.type !== 'list') {
          throw VimError.fromCode(ErrorCode.ArgumentOfSortMustBeAList); // TODO: Correct error message
        }
        const depth = _depth ? toInt(_depth) : 99999999;
        if (depth < 0) {
          throw VimError.fromCode(ErrorCode.MaxDepthMustBeANonNegativeNumber);
        }
        let newItems: Value[] = [...l!.items];
        for (let i = 0; i < depth; ++i) {
          const temp: Value[] = [];
          let foundList = false;
          for (const item of newItems) {
            if (item.type === 'list') {
              foundList = true;
              for (const _item of item.items) {
                temp.push(_item);
              }
            } else {
              temp.push(item);
            }
          }
          if (!foundList) {
            break;
          }
          newItems = temp;
        }
        if (call.func === 'flatten') {
          l!.items = newItems;
        }
        return list(newItems);
      }
      case 'float2nr': {
        const [x] = getArgs(1);
        return int(toFloat(x!));
      }
      // TODO: fullcommand()
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
      // TODO: funcref()
      case 'get': {
        const [_haystack, _idx, _default] = getArgs(2, 3);
        const haystack = this.evaluate(_haystack!);
        if (haystack.type === 'list') {
          let idx = toInt(this.evaluate(_idx!));
          idx = idx < 0 ? haystack.items.length + idx : idx;
          return idx < haystack.items.length ? haystack.items[idx] : (_default ?? int(0));
        } else if (haystack.type === 'blob') {
          const bytes = new Uint8Array(haystack.data);
          let idx = toInt(this.evaluate(_idx!));
          idx = idx < 0 ? bytes.length + idx : idx;
          return idx < bytes.length ? int(bytes[idx]) : (_default ?? int(-1));
        } else if (haystack.type === 'dict_val') {
          const key = this.evaluate(_idx!);
          const val = haystack.items.get(toString(key));
          return val ? val : (_default ?? int(0));
        }
        return _default ?? int(0);
        // TODO: get({func}, {what})
      }
      // TODO: getcurpos()
      // TODO: getline()
      // TODO: getreg()
      // TODO: getreginfo()
      // TODO: getregtype()
      // TODO: gettext()
      case 'gettext': {
        const [s] = getArgs(1);
        return str(toString(s!));
      }
      // TODO: glob2regpat()
      case 'has': {
        const [feature] = getArgs(1);
        return bool(toString(feature!) === 'vscode');
      }
      case 'has_key': {
        const [d, k] = getArgs(2);
        return bool(toDict(d!).items.has(toString(k!)));
      }
      // TODO: hasmapto()
      // TODO: histadd()/histdel()/histget()/histnr()
      // TODO: id()
      case 'index': {
        const [_haystack, _needle, _start, ic] = getArgs(2, 4);
        const haystack = this.evaluate(_haystack!);
        const needle = this.evaluate(_needle!);

        if (haystack.type === 'list') {
          let start: number | undefined;
          if (_start) {
            start = toInt(_start);
            start = start < 0 ? haystack.items.length + start : start;
          }

          for (const [idx, item] of haystack.items.entries()) {
            if (start && idx < start) {
              continue;
            }
            if (this.evaluateComparison('==', true, item, needle)) {
              return int(idx);
            }
          }
          return int(-1);
        }
        // TODO: handle blob
        throw VimError.fromCode(ErrorCode.ListOrBlobRequired);
      }
      // TODO: indexof()
      // TODO: input()/inputlist()
      case 'insert': {
        const [l, item, _idx] = getArgs(2, 3);
        const idx = _idx ? toInt(_idx) : 0;
        if (l!.type === 'blob') {
          if (idx > l!.data.byteLength) {
            throw VimError.fromCode(ErrorCode.InvalidArgument475, idx.toString());
          }
          const bytes = new Uint8Array(l!.data);
          const newBytes = new Uint8Array(bytes.length + 1);
          newBytes.set(bytes.subarray(0, idx), 0);
          newBytes[idx] = toInt(item!);
          newBytes.set(bytes.subarray(idx), idx + 1);
          l!.data = newBytes;
          return blob(newBytes);
        }
        const lst = toList(l!);
        if (idx > lst.items.length) {
          throw VimError.fromCode(ErrorCode.ListIndexOutOfRange, idx.toString());
        }
        lst.items.splice(idx, 0, item!);
        return lst;
      }
      case 'invert': {
        const [x] = getArgs(1);
        // eslint-disable-next-line no-bitwise
        return int(~toInt(x!));
      }
      // TODO: isabsolutepath()
      // TODO: isdirectory()
      case 'isinf': {
        const [x] = getArgs(1);
        const _x = toFloat(x!);
        return int(_x === Infinity ? 1 : _x === -Infinity ? -1 : 0);
      }
      // TODO: islocked()
      case 'isnan': {
        const [x] = getArgs(1);
        return bool(isNaN(toFloat(x!)));
      }
      case 'items': {
        const [d] = getArgs(1);
        return list([...toDict(d!).items.entries()].map(([k, v]) => list([str(k), v])));
      }
      case 'join': {
        const [l, sep] = getArgs(1, 2);
        return str(
          toList(l!)
            .items.map(toString)
            .join(sep ? toString(sep) : ''),
        );
      }
      case 'json_decode': {
        const fromJSObj = (x: any): Value => {
          if (Array.isArray(x)) {
            return list(x.map(fromJSObj));
          } else if (typeof x === 'number') {
            if (isInteger(x)) {
              return int(x);
            } else {
              return float(x);
            }
          } else if (typeof x === 'string') {
            return str(x);
          } else {
            const items: Map<string, Value> = new Map();
            for (const key in x) {
              if (Object.hasOwnProperty.call(x, key)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                items.set(key, fromJSObj(x[key]));
              }
            }
            return dictionary(items);
          }
        };
        const [expr] = getArgs(1);
        return fromJSObj(JSON.parse(toString(expr!)));
      }
      case 'json_encode': {
        const toJSObj = (x: Value): unknown => {
          switch (x.type) {
            case 'number':
              return x.value;
            case 'string':
              return x.value;
            case 'list':
              return x.items.map(toJSObj);
            case 'dict_val':
              const d: Record<string, unknown> = {};
              for (const [key, val] of x.items) {
                d[key] = toJSObj(val);
              }
              return d;
            case 'blob':
              return Array.from(new Uint8Array(x.data));
            case 'float':
              return x.value;
            case 'funcref':
              throw VimError.fromCode(ErrorCode.InvalidArgument474);
          }
        };
        const [expr] = getArgs(1);
        return str(JSON.stringify(toJSObj(this.evaluate(expr!)), null, 0)); // TODO: Fix whitespace
      }
      case 'keys': {
        const [d] = getArgs(1);
        return list([...toDict(d!).items.keys()].map(str));
      }
      case 'len': {
        const [x] = getArgs(1);
        switch (x!.type) {
          case 'number':
            return int(x!.value.toString().length);
          case 'string':
            return int(x!.value.length);
          case 'list':
            return int(x!.items.length);
          case 'dict_val':
            return int(x!.items.size);
          case 'blob':
            return int(x!.data.byteLength);
          default:
            throw VimError.fromCode(ErrorCode.InvalidTypeForLen);
        }
      }
      case 'localtime': {
        return int(Date.now() / 1000);
      }
      case 'log': {
        const [x] = getArgs(1);
        return float(Math.log(toFloat(x!)));
      }
      case 'log10': {
        const [x] = getArgs(1);
        return float(Math.log10(toFloat(x!)));
      }
      case 'map':
      case 'mapnew': {
        const [seq, fn] = getArgs(2);
        switch (seq?.type) {
          case 'list':
            const newItems = seq.items.map((val, idx) => {
              switch (fn?.type) {
                case 'funcref':
                  return this.evaluate(funcrefCall(fn, [int(idx), val]));
                default:
                  this.localScopes.push(
                    new Map([
                      ['v:key', new Variable(int(idx))],
                      ['v:val', new Variable(val)],
                    ]),
                  );
                  const retval = this.evaluate(expressionParser.tryParse(toString(fn!)));
                  this.localScopes.pop();
                  return retval;
              }
            });
            if (call.func === 'map') {
              seq.items = newItems;
            }
            return list(newItems);
          case 'dict_val':
          // TODO
          // case 'blob':
          // TODO
          // eslint-disable-next-line no-fallthrough
          default:
            throw VimError.fromCode(ErrorCode.ArgumentOfMapMustBeAListDictionaryOrBlob);
        }
      }
      // TODO: matchadd()/matchaddpos()/matcharg()/matchdelete()
      // TODO: match()/matchend()/matchlist()/matchstr()/matchstrpos()
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
      // TODO: mode()
      case 'or': {
        const [x, y] = getArgs(2);
        // eslint-disable-next-line no-bitwise
        return int(toInt(x!) | toInt(y!));
      }
      case 'pow': {
        const [x, y] = getArgs(2);
        return float(Math.pow(toFloat(x!), toFloat(y!)));
      }
      // TODO: printf()
      // TODO: rand()
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
      // TODO: reduce()
      // TODO: reg_executing()
      // TODO: reg_recorded()
      // TODO: reg_recording()
      // TODO: reltime*()
      case 'repeat': {
        const [val, count] = getArgs(2);
        if (val?.type === 'list') {
          const items: Value[] = new Array<Value[]>(toInt(count!)).fill(val.items).flat();
          return list(items);
        } else {
          return str(toString(val!).repeat(toInt(count!)));
        }
      }
      case 'remove': {
        const [_haystack, _idx, _end] = getArgs(2, 3);
        const haystack = this.evaluate(_haystack!);
        if (haystack.type === 'list') {
          let idx = toInt(this.evaluate(_idx!));
          idx = idx < 0 ? haystack.items.length + idx : idx;
          if (_end === undefined) {
            return haystack.items.splice(idx, 1)[0]; // TODO: This doesn't remove the item?
          } else {
            // TODO: remove({list}, {idx}, {end})
          }
        }
        // TODO: remove({blob}, {idx}, [{end}])
        else if (haystack.type === 'dict_val') {
          const key = toString(this.evaluate(_idx!));
          const val = haystack.items.get(key);
          if (val) {
            haystack.items.delete(key);
            return val;
          }
        }
        return int(0);
      }
      case 'reverse': {
        const [l] = getArgs(1);
        if (l?.type === 'list') {
          l.items.reverse();
          return l;
        } else if (l?.type === 'blob') {
          l.data = new Uint8Array(l.data).reverse();
          return l;
        }
        return int(0);
      }
      case 'round': {
        const [x] = getArgs(1);
        const _x = toFloat(x!);
        // Halfway between integers, Math.round() rounds toward infinity while Vim's round() rounds away from 0.
        return float(_x < 0 ? -Math.round(-_x) : Math.round(_x));
      }
      // TODO: setreg()
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
          if (func.type === 'string' || func.type === 'number') {
            if (func.value === 1 || func.value === '1' || func.value === 'i') {
              // Ignore case
              compare = (x, y) => {
                const [_x, _y] = [displayValue(x).toLowerCase(), displayValue(y).toLowerCase()];
                return _x === _y ? 0 : _x > _y ? 1 : -1;
              };
            } else {
              // TODO: handle other special cases ('l', 'n', 'N', 'f')
              throw Error('compare() with function name is not yet implemented');
            }
          } else if (func.type === 'funcref') {
            compare = (x, y) => toInt(this.evaluate(funcrefCall(func, [x, y])));
          } else {
            throw VimError.fromCode(ErrorCode.InvalidArgument474);
          }
        } else {
          compare = (x, y) => (displayValue(x) > displayValue(y) ? 1 : -1);
        }
        // TODO: Numbers after Strings, Lists after Numbers
        return list(l.items.sort(compare));
      }
      case 'split': {
        const [s, pattern, keepempty] = getArgs(1, 3);
        // TODO: Actually parse pattern
        const result = toString(s!).split(pattern && toString(pattern) ? toString(pattern) : /\s+/);
        if (!(keepempty && toInt(this.evaluate(keepempty)))) {
          if (result[0] === '') {
            result.shift();
          }
          if (result.at(-1) === '') {
            result.pop();
          }
        }
        return list(result.map(str));
      }
      case 'sqrt': {
        const [x] = getArgs(1);
        return float(Math.sqrt(toFloat(x!)));
      }
      case 'str2float': {
        // TODO: There are differences. See `:help str2float`
        const [s, quoted] = getArgs(1, 2);
        const result = floatParser.parse(toString(s!));
        return result.status === true ? result.value : float(0);
      }
      case 'str2list': {
        const [s, _ignored] = getArgs(1, 2);
        const result: number[] = [];
        for (const char of toString(s!)) {
          result.push(char.charCodeAt(0));
        }
        return list(result.map(int));
      }
      case 'str2nr': {
        const [_s, _base] = getArgs(1, 2);
        const base = _base ? toInt(_base) : 10;
        let s = toString(_s!);

        if (base === 16) {
          s = s.replace(/^0x/i, '');
        } else if (base === 8) {
          s = s.replace(/^0o/i, '');
        } else if (base === 2) {
          s = s.replace(/^0b/i, '');
        } else if (base !== 10) {
          throw VimError.fromCode(ErrorCode.InvalidArgument474);
        }
        const parsed = Number.parseInt(s, base);
        return int(isNaN(parsed) ? 0 : parsed);
      }
      case 'stridx': {
        const [haystack, needle, start] = getArgs(2, 3);

        return int(toString(haystack!).indexOf(toString(needle!), start ? toInt(start) : 0));
      }
      case 'string': {
        const [x] = getArgs(1);
        return str(displayValue(x!));
      }
      case 'strlen': {
        const [s] = getArgs(1);
        return int(toString(s!).length);
      }
      case 'strpart': {
        const [_src, _start, _len, chars] = getArgs(2, 4);
        const src = toString(_src!);
        const start = toInt(_start!);
        const len = _len ? toInt(_len) : src.length - start;
        return str(src.substring(start, start + len));
      }
      // TODO: submatch()
      // TODO: substitute()
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
      case 'tr': {
        const [_src, _from, _to] = getArgs(1, 3);
        const src = toString(_src!);
        const from = toString(_from!);
        const to = toString(_to!);
        if (from.length !== to.length) {
          throw VimError.fromCode(ErrorCode.InvalidArgument475, from);
        }
        const charMap = new Map<string, string>();
        for (let i = 0; i < from.length; i++) {
          charMap.set(from[i], to[i]);
        }
        return str([...src].map((c) => charMap.get(c) ?? c).join(''));
      }
      case 'trim': {
        const [_s, mask, _dir] = getArgs(1, 3);
        // TODO: use mask
        let s = toString(_s!);
        const dir = _dir ? toInt(_dir) : 0;
        if (dir === 0) {
          // Trim start and end
          s = s.trimStart().trimEnd();
        } else if (dir === 1) {
          // Trim start
          s = s.trimStart();
        } else if (dir === 2) {
          // Trim end
          s = s.trimEnd();
        } else {
          throw VimError.fromCode(ErrorCode.InvalidArgument475, dir.toString());
        }
        return str(s);
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
          //   return int(6);
          // case 'null':
          //   return int(7);
          case 'blob':
            return int(8);
          default:
            const guard: never = x;
            throw new Error('type() got unexpected type');
        }
      }
      case 'uniq': {
        const [l, func, dict] = getArgs(1, 3);
        // TODO: Use func (see sort() and try to re-use implementation)
        // TODO: Use dict
        if (l!.type !== 'list') {
          throw VimError.fromCode(ErrorCode.ArgumentOfSortMustBeAList); // TODO: Correct error message
        }
        if (l!.items.length > 1) {
          let prev: Value = l!.items[0];
          for (let i = 1; i < l!.items.length; ) {
            const val = l!.items[i];
            if (this.evaluateComparison('==', true, prev, val)) {
              l!.items.splice(i, 1);
            } else {
              prev = val;
              i++;
            }
          }
        }
        return l!;
      }
      case 'values': {
        const [d] = getArgs(1);
        return list([...toDict(d!).items.values()]);
      }
      // TODO: visualmode()
      // TODO: wordcount()
      case 'xor': {
        const [x, y] = getArgs(2);
        // eslint-disable-next-line no-bitwise
        return int(toInt(x!) ^ toInt(y!));
      }
      default: {
        throw VimError.fromCode(ErrorCode.UnknownFunction_call, call.func);
      }
    }
  }
}
