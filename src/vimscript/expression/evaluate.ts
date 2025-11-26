import { escapeRegExp, isInteger } from 'lodash';
import { all, alt } from 'parsimmon';
import { Position } from 'vscode';
import { configuration } from '../../configuration/configuration';
import { VimError } from '../../error';
import { Mode } from '../../mode/mode';
import { Register, RegisterMode } from '../../register/register';
import { globalState } from '../../state/globalState';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { Pattern, SearchDirection } from '../pattern';
import {
  blob,
  bool,
  dictionary,
  float,
  funcCall,
  funcref,
  funcrefCall,
  int,
  list,
  str,
  toExpr,
  variable,
} from './build';
import { displayValue } from './displayValue';
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

// ID of next lambda; incremented each time one is created
let lambdaNumber = 1;

export function toInt(value: Value): number {
  switch (value.type) {
    case 'number':
      return value.value;
    case 'float':
      throw VimError.UsingAFloatAsANumber();
    case 'string':
      const parsed = numberParser.skip(all).parse(value.value);
      if (parsed.status === false) {
        return 0;
      }
      return parsed.value.value;
    case 'list':
      throw VimError.UsingAListAsANumber();
    case 'dictionary':
      throw VimError.UsingADictionaryAsANumber();
    case 'funcref':
      throw VimError.UsingAFuncrefAsANumber();
    case 'blob':
      throw VimError.UsingABlobAsANumber();
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
    case 'dictionary':
    case 'funcref':
    case 'blob':
      throw VimError.NumberOrFloatRequired();
  }
}

export function toString(value: Value): string {
  switch (value.type) {
    case 'number':
      return value.value.toString();
    case 'float':
      throw VimError.UsingFloatAsAString();
    case 'string':
      return value.value;
    case 'list':
      throw VimError.UsingListAsAString();
    case 'dictionary':
      throw VimError.UsingDictionaryAsAString();
    case 'funcref':
      throw VimError.UsingFuncrefAsAString();
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
    case 'dictionary':
    case 'blob':
      throw VimError.ListRequired();
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
      throw VimError.DictionaryRequired();
    case 'dictionary':
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

  private vimState: VimState | undefined;
  private localScopes: VariableStore[] = [];
  private errors: string[] = [];

  constructor(vimState: VimState | undefined) {
    this.vimState = vimState;
  }

  /**
   * Fully evaluates the given expression and returns the resulting value.
   * May throw a variety of VimErrors if the expression is semantically invalid.
   */
  public evaluate(expression: Expression): Value {
    switch (expression.type) {
      case 'number':
      case 'float':
      case 'string':
        return expression;
      case 'blob':
        return blob(expression.data);
      case 'list':
        return list(expression.items.map((x) => this.evaluate(x)));
      case 'dictionary': {
        const items = new Map<string, Value>();
        for (const [key, val] of expression.items) {
          const keyStr = toString(this.evaluate(key));
          if (items.has(keyStr)) {
            throw VimError.DuplicateKeyInDictionary(keyStr);
          } else {
            items.set(keyStr, this.evaluate(val));
          }
        }
        return dictionary(items);
      }
      case 'funcref':
        const arglist = expression.arglist
          ? list(expression.arglist.items.map((e) => this.evaluate(e)))
          : undefined;
        const dict = expression.dict
          ? dictionary(
              new Map(
                [...expression.dict.items].map(([k, v]) => [
                  toString(this.evaluate(k)),
                  this.evaluate(v),
                ]),
              ),
            )
          : undefined;
        return funcref({ name: expression.name, body: expression.body, arglist, dict });
      case 'variable':
        return this.evaluateVariable(expression);
      case 'register':
        const reg = Register.getSync(expression.name);
        if (reg === undefined || reg.text instanceof RecordedState) {
          return str(''); // TODO: Handle RecordedState?
        }
        return str(reg.text);
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
          throw VimError.KeyNotPresentInDictionary(expression.entryName);
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
            funcCall(fref.name, (fref.arglist?.items.map(toExpr) ?? []).concat(expression.args)),
          );
        }
      }
      case 'methodCall': {
        const obj = this.evaluate(expression.expression);
        return this.evaluateFunctionCall(
          funcCall(expression.methodName, [toExpr(obj), ...expression.args]),
        );
      }
      case 'lambda': {
        return funcref({
          name: `<lambda>${lambdaNumber++}`,
          arglist: list([]),
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
        });
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
      throw VimError.FuncrefVariableNameMustStartWithACapital(varExpr.name);
    }

    const store = this.getVariableStore(varExpr.namespace);

    if (store) {
      const _var = store.get(varExpr.name);
      if (_var) {
        if (lock) {
          throw VimError.CannotModifyExistingVariable();
        }
        if (_var.locked) {
          throw VimError.ValueIsLocked(varExpr.name);
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
        throw VimError.UndefinedVariable(
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
      return this.evaluate(variable(`v:${varExpr.name}`));
    }

    throw VimError.UndefinedVariable(
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
          throw VimError.ListIndexOutOfRange(idx);
        }
        return sequence.items[idx];
      }
      case 'dictionary': {
        const key = toString(index);
        const result = sequence.items.get(key);
        if (result === undefined) {
          throw VimError.KeyNotPresentInDictionary(key);
        }
        return result;
      }
      case 'funcref': {
        throw VimError.CannotIndexAFuncref();
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
      case 'dictionary': {
        throw VimError.CannotUseSliceWithADictionary();
      }
      case 'funcref': {
        throw VimError.CannotIndexAFuncref();
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
          throw VimError.CannotUseModuloWithFloat();
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
            // NOTE: `id` field should match if and only if they are the same list
            return lhs.items === rhs.items;
          default:
            throw VimError.InvalidOperationForList();
        }
      } else {
        throw VimError.CanOnlyCompareListWithList();
      }
    } else if (rhs.type === 'list') {
      throw VimError.CanOnlyCompareListWithList();
    } else if (lhs.type === 'dictionary') {
      if (rhs.type === 'dictionary') {
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
            // NOTE: `id` field should match if and only if they are the same dictionary
            return lhs.items === rhs.items;
          default:
            throw VimError.InvalidOperationForDictionary();
        }
      } else {
        throw VimError.CanOnlyCompareDictionaryWithDictionary();
      }
    } else if (rhs.type === 'dictionary') {
      throw VimError.CanOnlyCompareDictionaryWithDictionary();
    } else if (lhs.type === 'funcref') {
      if (rhs.type === 'funcref') {
        switch (operator) {
          case '==':
            return lhs.name === rhs.name && lhs.dict === rhs.dict;
          case 'is':
            // NOTE: `id` field should match if and only if they are the same funcref
            return lhs === rhs;
          default:
            throw VimError.InvalidOperationForFuncrefs();
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
            // NOTE: `id` field should match if and only if they are the same blob
            return lhs.data === rhs.data;
          default:
            throw VimError.InvalidOperationForBlob();
        }
      } else {
        throw VimError.CanOnlyCompareBlobWithBlob();
      }
    } else if (rhs.type === 'blob') {
      throw VimError.CanOnlyCompareBlobWithBlob();
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

    const getpos = (arg: string) => {
      const pos: Position | undefined = (() => {
        if (arg === '.') {
          return this.vimState!.cursorStopPosition;
        } else if (arg === '$') {
          return new Position(this.vimState!.document.lineCount, 0);
        } else if (arg.startsWith("'") && arg.length === 2) {
          const mark = this.vimState!.historyTracker.getMark(arg[1]);
          return mark?.position;
        } else if (arg === 'w0') {
          return new Position(this.vimState!.editor.visibleRanges[0].start.line, 0);
        } else if (arg === 'w$') {
          return new Position(this.vimState!.editor.visibleRanges[0].end.line, 0);
        } else if (arg === 'v') {
          return this.vimState!.cursorStartPosition;
        }
        return undefined;
      })();
      return {
        bufnum: 0, // TODO
        lnum: (pos?.line ?? -1) + 1,
        col: (pos?.character ?? -1) + 1,
        off: 0,
      };
    };

    // See `:help non-zero-arg`
    const nonZeroArg = (arg: Value): boolean => {
      if (arg.type === 'number' && arg.value !== 0) {
        return true;
      } else if (arg.type === 'string' && arg.value.length !== 0) {
        return true;
      }
      return false;
    };

    const copy = (arg: Value, deep: boolean): Value => {
      switch (arg.type) {
        case 'list':
          return list(deep ? arg.items.map((item) => copy(item, true)) : arg.items);
        case 'dictionary':
          return dictionary(
            new Map(deep ? [...arg.items].map(([k, v]) => [k, copy(v, true)]) : arg.items),
          );
      }
      return arg;
    };

    const getArgs = (min: number, max?: number) => {
      if (max === undefined) {
        max = min;
      }
      if (call.args.length < min) {
        throw VimError.NotEnoughArgs(call.func);
      }
      if (call.args.length > max) {
        throw VimError.TooManyArgs(call.func);
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
      case 'byte2line': {
        const [_byte] = getArgs(1);
        const byte = toInt(_byte!);
        if (byte <= 0) {
          return int(-1);
        }
        return int(this.vimState!.document.positionAt(byte - 1).line + 1);
      }
      // TODO: byteidx[comp]
      case 'call': {
        const [_func, arglist, dict] = getArgs(2, 3);
        if (arglist!.type !== 'list') {
          throw VimError.ListRequiredForArgument(2);
        }
        const func: FuncRefValue = (() => {
          if (_func?.type === 'funcref') {
            return _func;
          }
          return funcref({
            name: toString(_func!),
            arglist: list([]),
            dict: dict ? toDict(dict) : undefined,
          });
        })();
        return this.evaluate(funcrefCall(toExpr(func), arglist!.items.map(toExpr)));
      }
      case 'ceil': {
        const [x] = getArgs(1);
        return float(Math.ceil(toFloat(x!)));
      }
      case 'col': {
        const [s] = getArgs(1);
        return int(getpos(toString(s!)).col);
      }
      case 'copy': {
        const [x] = getArgs(1);
        return copy(x!, false);
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
            throw VimError.InvalidArgument474();
          }
          if (toInt(start) >= comp!.items.length) {
            throw VimError.ListIndexOutOfRange(toInt(start));
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
          case 'dictionary':
            for (const val of comp!.items.values()) {
              if (this.evaluateComparison('==', matchCase, val, expr!)) {
                count++;
              }
            }
            break;
          default:
            throw VimError.ArgumentOfFuncMustBeAListOrDictionary(call.func);
        }
        return int(count);
      }
      // TODO: cursor()
      case 'deepcopy': {
        const [x] = getArgs(1);
        return copy(x!, true);
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
          case 'dictionary':
            return bool(x.items.size === 0);
          case 'blob':
            return bool(x.data.byteLength === 0);
          default:
            return bool(false);
        }
      }
      case 'environ': {
        return dictionary(new Map(Object.entries(process.env).map(([k, v]) => [k, str(v ?? '')])));
      }
      case 'escape': {
        const [s, chars] = getArgs(2);
        return str(
          toString(s!).replace(new RegExp(`[${escapeRegExp(toString(chars!))}]`, 'g'), '\\$&'),
        );
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
      // TODO: filecopy()
      // TODO: filereadable()/filewritable()
      // TODO: filter()
      case 'flatten':
      case 'flattennew': {
        const [l, _depth] = getArgs(1, 2);
        if (l!.type !== 'list') {
          throw VimError.ArgumentMustBeAList(call.func);
        }
        const depth = _depth ? toInt(_depth) : 99999999;
        if (depth < 0) {
          throw VimError.MaxDepthMustBeANonNegativeNumber();
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
      case 'floor': {
        const [x] = getArgs(1);
        return float(Math.floor(toFloat(x!)));
      }
      case 'fmod': {
        const [x, y] = getArgs(2);
        return float(toFloat(x!) % toFloat(y!));
      }
      // TODO: Fix circular dependency
      // case 'fullcommand': {
      //   const [name] = getArgs(1);
      //   try {
      //     return str(exCommandParser.tryParse(toString(name!)).name);
      //   } catch {
      //     return str('');
      //   }
      // }
      case 'function': {
        const [name, arglist, dict] = getArgs(1, 3);
        if (arglist) {
          if (arglist.type === 'list') {
            if (dict && dict.type !== 'dictionary') {
              throw VimError.ExpectedADict();
            }
            return funcref({ name: toString(name!), arglist, dict });
          } else if (arglist.type === 'dictionary') {
            if (dict) {
              // function('abs', {}, {})
              throw VimError.SecondArgumentOfFunction();
            }
            return funcref({ name: toString(name!), dict: arglist });
          } else {
            throw VimError.SecondArgumentOfFunction();
          }
        }
        if (dict && dict.type !== 'dictionary') {
          throw VimError.ExpectedADict();
        }
        // TODO:
        // if (toString(name!) is invalid function) {
        //   throw VimError.fromCode(ErrorCode.UnknownFunction_funcref, toString(name!));
        // }
        return funcref({ name: toString(name!), arglist, dict });
      }
      // TODO: funcref()
      case 'garbagecollect': {
        const [atexit] = getArgs(0, 1);
        return int(0); // No-op
      }
      case 'get': {
        const [_haystack, _idx, _default] = getArgs(2, 3);
        const haystack: Value = _haystack!;
        if (haystack.type === 'list') {
          let idx = toInt(_idx!);
          idx = idx < 0 ? haystack.items.length + idx : idx;
          return idx < haystack.items.length ? haystack.items[idx] : (_default ?? int(0));
        } else if (haystack.type === 'blob') {
          const bytes = new Uint8Array(haystack.data);
          let idx = toInt(_idx!);
          idx = idx < 0 ? bytes.length + idx : idx;
          return idx < bytes.length ? int(bytes[idx]) : (_default ?? int(-1));
        } else if (haystack.type === 'dictionary') {
          const val = haystack.items.get(toString(_idx!));
          return val ? val : (_default ?? int(0));
        }
        return _default ?? int(0);
        // TODO: get({func}, {what})
      }
      case 'getcurpos': {
        const { bufnum, lnum, col, off } = getpos('.');
        const curswant = this.vimState!.desiredColumn + 1;
        return list([int(bufnum), int(lnum), int(col), int(off), int(curswant)]);
      }
      case 'getline': {
        const [lnum, _end] = getArgs(1, 2);
        // TODO: When {lnum} is a String that doesn't start with a digit, line() is called
        if (_end === undefined) {
          return str(this.vimState!.document.lineAt(toInt(lnum!)).text);
        }
        const lines: string[] = [];
        for (let i = toInt(lnum!); i <= toInt(_end); i++) {
          lines.push(this.vimState!.document.lineAt(i).text);
        }
        return list(lines.map(str));
      }
      case 'getpid': {
        return int(process.pid);
      }
      case 'getpos': {
        const [s] = getArgs(1);
        const { bufnum, lnum, col, off } = getpos(toString(s!));
        return list([int(bufnum), int(lnum), int(col), int(off)]);
      }
      // TODO: getreg()
      // TODO: getreginfo()
      case 'getregtype': {
        const [regname] = getArgs(1);
        const reg = Register.getSync(toString(regname!));
        if (reg === undefined) {
          return str('');
        }
        if (reg.registerMode === RegisterMode.CharacterWise) {
          return str('v');
        } else if (reg.registerMode === RegisterMode.LineWise) {
          return str('V');
        } else if (reg.registerMode === RegisterMode.BlockWise) {
          const text = reg.text as string;
          const idx = text.indexOf('\n');
          const width = idx === -1 ? text.length : idx;
          const ctrlV = '\x16';
          return str(`${ctrlV}${width}`);
        }
        const guard: never = reg.registerMode;
        return str('');
      }
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
      case 'id': {
        // NOTE: Vim behaves differently (generally returning pointer addresses), but this serves the purpose
        const [x] = getArgs(1);
        if (x!.type === 'number' || x!.type === 'float' || x!.type === 'string') {
          return str(x!.value.toString());
        }
        return str(x!.id);
      }
      case 'index': {
        const [_haystack, _needle, _start, ic] = getArgs(2, 4);
        const haystack: Value = _haystack!;

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
            if (this.evaluateComparison('==', true, item, _needle!)) {
              return int(idx);
            }
          }
          return int(-1);
        }
        // TODO: handle blob
        throw VimError.ListOrBlobRequired();
      }
      // TODO: indexof()
      // TODO: input()/inputlist()
      case 'insert': {
        const [l, item, _idx] = getArgs(2, 3);
        const idx = _idx ? toInt(_idx) : 0;
        if (l!.type === 'blob') {
          if (idx > l!.data.byteLength) {
            throw VimError.InvalidArgument475(idx.toString());
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
          throw VimError.ListIndexOutOfRange(idx);
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
            case 'dictionary':
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
              throw VimError.InvalidArgument474();
          }
        };
        const [expr] = getArgs(1);
        return str(JSON.stringify(toJSObj(expr!), null, 0)); // TODO: Fix whitespace
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
          case 'dictionary':
            return int(x!.items.size);
          case 'blob':
            return int(x!.data.byteLength);
          default:
            throw VimError.InvalidTypeForLen();
        }
      }
      case 'line': {
        const [s, winid] = getArgs(1, 2);
        return int(getpos(toString(s!)).lnum);
      }
      case 'line2byte': {
        const [_line] = getArgs(1);
        const line = toInt(_line!);
        if (line <= 0) {
          return int(-1);
        }
        return int(this.vimState!.document.offsetAt(new Position(line - 1, 0)) + 1);
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
                  return this.evaluate(funcrefCall(toExpr(fn), [int(idx), toExpr(val)]));
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
          case 'dictionary':
          // TODO
          // case 'blob':
          // TODO
          // eslint-disable-next-line no-fallthrough
          default:
            throw VimError.ArgumentOfMapMustBeAListDictionaryOrBlob();
        }
      }
      // TODO: matchadd()/matchaddpos()/matcharg()/matchdelete()
      // TODO: match()/matchend()/matchlist()/matchstr()/matchstrpos()
      case 'max': {
        const [l] = getArgs(1);
        let values: Value[];
        if (l?.type === 'list') {
          values = l.items;
        } else if (l?.type === 'dictionary') {
          values = [...l.items.values()];
        } else {
          throw VimError.ArgumentOfFuncMustBeAListOrDictionary(call.func);
        }
        return int(values.length === 0 ? 0 : Math.max(...values.map(toInt)));
      }
      case 'min': {
        const [l] = getArgs(1);
        let values: Value[];
        if (l?.type === 'list') {
          values = l.items;
        } else if (l?.type === 'dictionary') {
          values = [...l.items.values()];
        } else {
          throw VimError.ArgumentOfFuncMustBeAListOrDictionary(call.func);
        }
        return int(values.length === 0 ? 0 : Math.min(...values.map(toInt)));
      }
      case 'mode': {
        const [arg] = getArgs(1);
        switch (this.vimState!.currentModeIncludingPseudoModes) {
          case Mode.Normal:
            return str('n');
          case Mode.OperatorPendingMode:
            return nonZeroArg(arg!) ? str('n') : str('no');
          case Mode.Visual:
            return str('v');
          case Mode.VisualLine:
            return str('V');
          case Mode.VisualBlock:
            return str('\x16');
          case Mode.Insert:
            return str('i');
          case Mode.Replace:
            return str('R');
          case Mode.CommandlineInProgress:
          case Mode.SearchInProgressMode:
            return str('c');
          default:
            return str(''); // TODO: Other modes
        }
      }
      case 'nextnonblank': {
        const [_line] = getArgs(1);
        const line = toInt(_line!);
        if (line <= 0) {
          return int(0);
        }
        for (let i = line - 1; i < this.vimState!.document.lineCount; i++) {
          if (this.vimState!.document.lineAt(i).text.length > 0) {
            return int(i + 1);
          }
        }
        return int(0);
      }
      case 'or': {
        const [x, y] = getArgs(2);
        // eslint-disable-next-line no-bitwise
        return int(toInt(x!) | toInt(y!));
      }
      case 'pow': {
        const [x, y] = getArgs(2);
        return float(Math.pow(toFloat(x!), toFloat(y!)));
      }
      case 'prevnonblank': {
        const [_line] = getArgs(1);
        const line = toInt(_line!);
        if (line > this.vimState!.document.lineCount) {
          return int(0);
        }
        for (let i = line - 1; i >= 0; i--) {
          if (this.vimState!.document.lineAt(i).text.length > 0) {
            return int(i + 1);
          }
        }
        return int(0);
      }
      // TODO: printf()
      // TODO: rand()
      case 'range': {
        const [val, max, stride] = getArgs(1, 3);
        const start = max !== undefined ? toInt(val!) : 0;
        const end = max !== undefined ? toInt(max) : toInt(val!) - 1;
        const step = stride !== undefined ? toInt(stride) : 1;
        if (step === 0) {
          throw VimError.StrideIsZero();
        }
        if (step > 0 !== start < end && Math.abs(start - end) > 1) {
          throw VimError.StartPastEnd();
        }
        const items: Value[] = [];
        for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
          items.push(int(i));
        }
        return list(items);
      }
      // TODO: reduce()
      case 'reg_executing': {
        return str(this.vimState?.isReplayingMacro ? this.vimState.recordedState.registerName : '');
      }
      case 'reg_recording': {
        return str(this.vimState?.macro?.registerName ?? '');
      }
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
        const haystack: Value = _haystack!;
        if (haystack.type === 'list') {
          let idx = toInt(_idx!);
          idx = idx < 0 ? haystack.items.length + idx : idx;
          if (_end === undefined) {
            return haystack.items.splice(idx, 1)[0]; // TODO: This doesn't remove the item?
          } else {
            // TODO: remove({list}, {idx}, {end})
          }
        }
        // TODO: remove({blob}, {idx}, [{end}])
        else if (haystack.type === 'dictionary') {
          const key = toString(_idx!);
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
      // TODO: setpos()
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
          throw VimError.ArgumentMustBeAList(call.func);
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
            compare = (x, y) =>
              toInt(this.evaluate(funcrefCall(toExpr(func), [toExpr(x), toExpr(y)])));
          } else {
            throw VimError.InvalidArgument474();
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
        if (!(keepempty && toInt(keepempty))) {
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
        // TODO: Support 1e40 (rather than 1.0e40)
        const [_s, quoted] = getArgs(1, 2);
        const s = toString(_s!);
        if (/^inf/i.test(s)) return float(Infinity);
        if (/^-inf/i.test(s)) return float(-Infinity);
        if (/^nan/i.test(s)) return float(NaN);
        const result = alt<FloatValue | NumberValue>(floatParser, numberParser).skip(all).parse(s);
        return float(result.status ? result.value.value : 0);
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
          throw VimError.InvalidArgument474();
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
      // TODO: timer*()
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
          throw VimError.InvalidArgument475(from);
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
          throw VimError.InvalidArgument475(dir.toString());
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
          case 'dictionary':
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
          throw VimError.ArgumentMustBeAList(call.func);
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
      case 'visualmode': {
        const [arg] = getArgs(1); // TODO: Use arg
        const mode = this.vimState?.lastVisualSelection?.mode;
        if (mode === undefined) {
          return str('');
        }
        return mode === Mode.Visual ? str('v') : mode === Mode.VisualLine ? str('V') : str('\x16');
      }
      // TODO: wordcount()
      case 'xor': {
        const [x, y] = getArgs(2);
        // eslint-disable-next-line no-bitwise
        return int(toInt(x!) ^ toInt(y!));
      }
      default: {
        throw VimError.UnknownFunction_call(call.func);
      }
    }
  }
}
