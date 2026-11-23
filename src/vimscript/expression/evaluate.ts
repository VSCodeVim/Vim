import { escapeRegExp, isInteger } from 'lodash';
// eslint-disable-next-line id-denylist
import { all, alt, optWhitespace, string } from 'parsimmon';
import { Position } from 'vscode';
import { configuration } from '../../configuration/configuration';
import { VimError } from '../../error';
import { Mode } from '../../mode/mode';
import { Register, RegisterMode } from '../../register/register';
import { globalState } from '../../state/globalState';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { exCommandNameParser, fullCommandName } from '../exCommandNames';
import { LineRange } from '../lineRange';
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
  Expression,
  FloatValue,
  FuncRefValue,
  FunctionCallExpression,
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

/**
 * Makes a converter that returns a value of the given type unchanged, and throws the given error
 * for any other value
 */
function expectType<T extends Value['type']>(
  type: T,
  error: () => VimError,
): (value: Value) => Extract<Value, { type: T }> {
  return (value) => {
    if (value.type !== type) {
      throw error();
    }
    return value as Extract<Value, { type: T }>;
  };
}

const toList = expectType('list', () => VimError.ListRequired());
const toDict = expectType('dictionary', () => VimError.DictionaryRequired());

function toFloat(value: Value): number {
  if (value.type !== 'number' && value.type !== 'float') {
    throw VimError.NumberOrFloatRequired();
  }
  return value.value;
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

function mapNumber(value: Value, f: (x: number) => number): NumberValue | FloatValue {
  switch (value.type) {
    case 'float':
      return float(f(value.value));
    default:
      return int(f(toInt(value)));
  }
}

/**
 * Resolves an index into a sequence of the given length, where a negative index counts back from
 * the end. An index that is out of range stays out of range.
 */
function resolveIndex(idx: number, length: number): number {
  return idx < 0 ? length + idx : idx;
}

/** A tuple of `N` required arguments */
type RequiredArgs<N extends number, R extends Value[] = []> = R['length'] extends N
  ? R
  : RequiredArgs<N, [...R, Value]>;
/** Pads `R` with optional arguments until it has length `N` */
type PadArgs<N extends number, R extends Array<Value | undefined>> = R['length'] extends N
  ? R
  : PadArgs<N, [...R, Value | undefined]>;
/** The evaluated arguments of a function taking between `Min` and `Max` arguments */
type FunctionArgs<Min extends number, Max extends number> = PadArgs<Max, RequiredArgs<Min>>;
/** Converts a function argument; `undefined` leaves the argument as a `Value` */
type ArgConverter = ((value: Value) => unknown) | undefined;
/** The arguments `A`, each passed through the corresponding converter in `C`, if any */
type ConvertedArgs<A, C extends readonly ArgConverter[]> = {
  [K in keyof A]: K extends keyof C
    ? C[K] extends (value: Value) => infer T
      ? T | Exclude<A[K], Value>
      : A[K]
    : A[K];
};

type BasicComparisonOp = '==' | '>' | '=~' | 'is';

/** Whether items of a List or Dictionary are equal; unlike at the top level, types must match */
function itemsEqual(lhs: Value, rhs: Value, matchCase: boolean): boolean {
  return basicComparison('==', matchCase, lhs, rhs, false);
}

function listItemsEqual(lhs: Value[], rhs: Value[], matchCase: boolean): boolean {
  return lhs.length === rhs.length && lhs.every((item, i) => itemsEqual(item, rhs[i], matchCase));
}

function dictItemsEqual(
  lhs: Map<string, Value>,
  rhs: Map<string, Value>,
  matchCase: boolean,
): boolean {
  return (
    lhs.size === rhs.size &&
    [...lhs].every(([key, value]) => {
      const rhsValue = rhs.get(key);
      return rhsValue !== undefined && itemsEqual(value, rhsValue, matchCase);
    })
  );
}

/** Whether a Funcref is a partial, i.e. has arguments or a Dictionary bound to it */
function isPartial(func: FuncRefValue): boolean {
  return (func.arglist?.items.length ?? 0) > 0 || func.dict !== undefined;
}

/** Converts a Number, Float, or String operand of `=~` to the String to match */
function toMatchString(value: Value): string {
  return value.type === 'float' ? displayValue(value) : toString(value);
}

/** Converts an operand to a Float for comparison with a Float */
function toComparisonFloat(value: Value): number {
  if (value.type === 'string') {
    throw VimError.UsingAStringAsAFloat();
  }
  return toFloat(value);
}

/**
 * Compares two values with one of the operators that the others are defined in terms of.
 * `topLevel` is false when comparing items of a List or Dictionary.
 */
function basicComparison(
  operator: BasicComparisonOp,
  matchCase: boolean,
  lhs: Value,
  rhs: Value,
  topLevel: boolean = true,
): boolean {
  if (operator === 'is' && lhs.type !== rhs.type) {
    return false;
  }

  // Like Vim, check for these types in this order, so that e.g. comparing a List with a Blob is
  // an error about Blobs
  if (lhs.type === 'blob' || rhs.type === 'blob') {
    if (lhs.type !== 'blob' || rhs.type !== 'blob') {
      throw VimError.CanOnlyCompareBlobWithBlob();
    }
    switch (operator) {
      case '==':
        const [lhsBytes, rhsBytes] = [new Uint8Array(lhs.data), new Uint8Array(rhs.data)];
        return lhsBytes.length === rhsBytes.length && lhsBytes.every((b, i) => b === rhsBytes[i]);
      case 'is':
        // Two Blobs share `data` if and only if they are the same Blob
        return lhs.data === rhs.data;
      default:
        throw VimError.InvalidOperationForBlob();
    }
  }
  if (lhs.type === 'list' || rhs.type === 'list') {
    if (lhs.type !== 'list' || rhs.type !== 'list') {
      throw VimError.CanOnlyCompareListWithList();
    }
    switch (operator) {
      case '==':
        return listItemsEqual(lhs.items, rhs.items, matchCase);
      case 'is':
        // Two Lists share `items` if and only if they are the same List
        return lhs.items === rhs.items;
      default:
        throw VimError.InvalidOperationForList();
    }
  }
  if (lhs.type === 'dictionary' || rhs.type === 'dictionary') {
    if (lhs.type !== 'dictionary' || rhs.type !== 'dictionary') {
      throw VimError.CanOnlyCompareDictionaryWithDictionary();
    }
    switch (operator) {
      case '==':
        return dictItemsEqual(lhs.items, rhs.items, matchCase);
      case 'is':
        // Two Dictionaries share `items` if and only if they are the same Dictionary
        return lhs.items === rhs.items;
      default:
        throw VimError.InvalidOperationForDictionary();
    }
  }
  if (lhs.type === 'funcref' || rhs.type === 'funcref') {
    if (lhs.type !== 'funcref' || rhs.type !== 'funcref') {
      return false;
    }
    switch (operator) {
      case '==':
        return (
          lhs.name === rhs.name &&
          listItemsEqual(lhs.arglist?.items ?? [], rhs.arglist?.items ?? [], matchCase) &&
          (lhs.dict === undefined || rhs.dict === undefined
            ? lhs.dict === rhs.dict
            : dictItemsEqual(lhs.dict.items, rhs.dict.items, matchCase))
        );
      case 'is':
        // A partial is only identical to itself
        return isPartial(lhs) || isPartial(rhs) ? lhs === rhs : lhs.name === rhs.name;
      default:
        throw VimError.InvalidOperationForFuncrefs();
    }
  }

  // Both are Numbers, Floats, or Strings
  if (operator === '=~') {
    const pattern = Pattern.parser({
      direction: SearchDirection.Forward,
      delimiter: '/', // TODO: Are these params right?
      ignoreCase: !matchCase,
    }).tryParse(toMatchString(rhs));
    return pattern.regex.test(toMatchString(lhs));
  }
  if (!topLevel && lhs.type !== rhs.type) {
    return false;
  }
  let lhsValue: number | string;
  let rhsValue: number | string;
  if (lhs.type === 'float' || rhs.type === 'float') {
    [lhsValue, rhsValue] = [toComparisonFloat(lhs), toComparisonFloat(rhs)];
  } else if (lhs.type === 'number' || rhs.type === 'number') {
    // A String is converted to a Number, e.g. 4 == '4'
    [lhsValue, rhsValue] = [toInt(lhs), toInt(rhs)];
  } else {
    [lhsValue, rhsValue] = [toString(lhs), toString(rhs)];
    if (!matchCase) {
      [lhsValue, rhsValue] = [lhsValue.toLowerCase(), rhsValue.toLowerCase()];
    }
  }
  return operator === '>' ? lhsValue > rhsValue : lhsValue === rhsValue;
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

  // Static v: variables whose values never change
  private static readonly vConstants: ReadonlyMap<string, Value> = new Map([
    ['true', bool(true)],
    ['false', bool(false)],
    ['t_number', int(0)],
    ['t_string', int(1)],
    ['t_func', int(2)],
    ['t_list', int(3)],
    ['t_dict', int(4)],
    ['t_float', int(5)],
    ['t_bool', int(6)],
    ['t_blob', int(10)],
    ['numbermax', int(Number.MAX_SAFE_INTEGER)],
    ['numbermin', int(Number.MIN_SAFE_INTEGER)],
    // NOTE: In VimScript this refers to a 64 bit integer; we have a 64 bit float because JavaScript
    ['numbersize', int(64)],
  ]);

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
            expression.matchCase ?? !configuration.ignorecase,
            this.evaluate(expression.lhs),
            this.evaluate(expression.rhs),
          ),
        );
      default: {
        expression satisfies never;
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
      const constant = EvaluationContext.vConstants.get(varExpr.name);
      if (constant !== undefined) {
        return constant;
      }

      if (varExpr.name === 'hlsearch') {
        return bool(globalState.hl);
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
        const idx = resolveIndex(toInt(index), sequence.items.length);
        if (idx < 0 || idx >= sequence.items.length) {
          throw VimError.ListIndexOutOfRange(toInt(index));
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
        const idx = resolveIndex(toInt(index), bytes.length);
        if (idx < 0 || idx >= bytes.length) {
          throw VimError.BlobIndexOutOfRange(idx);
        }
        return int(bytes[idx]);
      }
    }
  }

  private evaluateSlice(sequence: Value, start: Value, end: Value): Value {
    const _start = toInt(start);
    const _end = toInt(end);
    /** The arguments to `slice()` for a sequence of the given length, clamped to its bounds */
    const sliceArgs = (length: number): [number, number] => [
      Math.max(resolveIndex(_start, length), 0),
      Math.max(resolveIndex(_end, length) + 1, 0), // `end` is inclusive
    ];
    switch (sequence.type) {
      case 'string':
      case 'number':
      case 'float': {
        const _sequence = toString(sequence);
        return str(_sequence.slice(...sliceArgs(_sequence.length)));
      }
      case 'list': {
        // Unlike a String or Blob, a List is empty when the start is before the first item
        if (resolveIndex(_start, sequence.items.length) < 0) {
          return list([]);
        }
        return list(sequence.items.slice(...sliceArgs(sequence.items.length)));
      }
      case 'dictionary': {
        throw VimError.CannotUseSliceWithADictionary();
      }
      case 'funcref': {
        throw VimError.CannotIndexAFuncref();
      }
      case 'blob': {
        const bytes = new Uint8Array(sequence.data);
        return blob(bytes.slice(...sliceArgs(bytes.length)));
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
        return basicComparison('==', matchCase, lhs, rhs);
      case '!=':
        return !basicComparison('==', matchCase, lhs, rhs);
      case '>':
        return basicComparison('>', matchCase, lhs, rhs);
      case '>=':
        return (
          basicComparison('>', matchCase, lhs, rhs) || basicComparison('==', matchCase, lhs, rhs)
        );
      case '<':
        return basicComparison('>', matchCase, rhs, lhs);
      case '<=':
        return !basicComparison('>', matchCase, lhs, rhs);
      case '=~':
        return basicComparison('=~', matchCase, lhs, rhs);
      case '!~':
        return !basicComparison('=~', matchCase, lhs, rhs);
      case 'is':
        return basicComparison('is', matchCase, lhs, rhs);
      case 'isnot':
        return !basicComparison('is', matchCase, lhs, rhs);
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
    const assertThat = (condition: boolean, msg: Value | undefined, defaultMsg: () => string) =>
      condition ? assertPassed() : assertFailed(msg ? toString(msg) : defaultMsg());

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
    const nonZeroArg = (arg: Value | undefined): boolean => {
      if (arg?.type === 'number' && arg.value !== 0) {
        return true;
      } else if (arg?.type === 'string' && arg.value.length !== 0) {
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

    /**
     * Checks the number of arguments and evaluates them. Arguments past those given are
     * `undefined`. Each given argument with a converter in `convert` is passed through it.
     */
    const getArgs = <
      Min extends number,
      Max extends number = Min,
      const C extends readonly ArgConverter[] = [],
    >(
      min: Min,
      max?: Max,
      convert?: C,
    ): ConvertedArgs<FunctionArgs<Min, Max>, C> => {
      const _max = max ?? min;
      if (call.args.length < min) {
        throw VimError.NotEnoughArgs(call.func);
      }
      if (call.args.length > _max) {
        throw VimError.TooManyArgs(call.func);
      }
      const args: unknown[] = call.args.map((arg, i) => {
        const value = this.evaluate(arg);
        return convert?.[i] ? convert[i](value) : value;
      });
      while (args.length < _max) {
        args.push(undefined);
      }
      return args as ConvertedArgs<FunctionArgs<Min, Max>, C>;
    };

    /** Like `toList`, but with an error that names the function */
    const toListArg = expectType('list', () => VimError.ArgumentMustBeAList(call.func));

    type NumericBuiltinOptions<T extends Value> = {
      convert: (value: Value) => number;
      wrap: (value: number) => T;
    };
    const numericUnary = <T extends Value>(
      func: (x: number) => number,
      options: NumericBuiltinOptions<T>,
    ): T => {
      const [x] = getArgs(1, 1, [options.convert]);
      return options.wrap(func(x));
    };
    const numericBinary = <T extends Value>(
      func: (x: number, y: number) => number,
      options: NumericBuiltinOptions<T>,
    ): T => {
      const [x, y] = getArgs(2, 2, [options.convert, options.convert]);
      return options.wrap(func(x, y));
    };
    const int1 = (func: (x: number) => number): NumberValue =>
      numericUnary(func, { convert: toInt, wrap: int });
    const floatToInt1 = (func: (x: number) => number): NumberValue =>
      numericUnary(func, { convert: toFloat, wrap: int });
    const int2 = (func: (x: number, y: number) => number): NumberValue =>
      numericBinary(func, { convert: toInt, wrap: int });
    const float1 = (func: (x: number) => number): FloatValue =>
      numericUnary(func, { convert: toFloat, wrap: float });
    const float2 = (func: (x: number, y: number) => number): FloatValue =>
      numericBinary(func, { convert: toFloat, wrap: float });
    const floatToBool1 = (predicate: (x: number) => boolean): NumberValue =>
      numericUnary((x) => (predicate(x) ? 1 : 0), {
        convert: toFloat,
        wrap: (value) => bool(value !== 0),
      });

    switch (call.func) {
      case 'abs': {
        return float1(Math.abs);
      }
      case 'acos': {
        return float1(Math.acos);
      }
      case 'add': {
        const [l, item] = getArgs(2);
        if (l.type === 'blob') {
          const newBytes = new Uint8Array(l.data.byteLength + 1);
          newBytes.set(new Uint8Array(l.data));
          newBytes[newBytes.length - 1] = toInt(item);
          l.data = newBytes;
          return l;
        }
        const lst = toList(l);
        lst.items.push(item);
        return lst;
      }
      case 'asin': {
        return float1(Math.asin);
      }
      case 'atan2': {
        return float2(Math.atan2);
      }
      case 'and': {
        // eslint-disable-next-line no-bitwise
        return int2((x, y) => x & y);
      }
      case 'assert_beeps': {
        return assertFailed('VSCodeVim does not support beeps');
      }
      case 'assert_equal': {
        const [expected, actual, msg] = getArgs(2, 3);
        return assertThat(
          expected.type === actual.type && this.evaluateComparison('==', true, expected, actual),
          msg,
          () => `Expected ${displayValue(expected)} but got ${displayValue(actual)}`,
        );
      }
      // TODO: assert_equalfile()
      // TODO: assert_exception()
      // TODO: assert_fails()
      case 'assert_false': {
        const [actual, msg] = getArgs(1, 2);
        return assertThat(
          this.evaluateComparison('==', true, bool(false), actual),
          msg,
          () => `Expected False but got ${displayValue(actual)}`,
        );
      }
      case 'assert_inrange': {
        const [lower, upper, actual, msg] = getArgs(3, 4);
        return assertThat(
          this.evaluateComparison('>=', true, actual, lower) &&
            this.evaluateComparison('<=', true, actual, upper),
          msg,
          () =>
            `Expected range ${displayValue(lower)} - ${displayValue(upper)} but got ${displayValue(actual)}`,
        );
      }
      case 'assert_match': {
        const [pattern, actual, msg] = getArgs(2, 3);
        return assertThat(
          this.evaluateComparison('=~', true, actual, pattern),
          msg,
          () => `Pattern '${toString(pattern)}' does not match '${toString(actual)}'`,
        );
      }
      case 'assert_nobeep': {
        return assertPassed();
      }
      case 'assert_notequal': {
        const [expected, actual, msg] = getArgs(2, 3);
        return assertThat(
          this.evaluateComparison('!=', true, expected, actual),
          msg,
          () => `Expected not equal to ${displayValue(expected)}`,
        );
      }
      case 'assert_notmatch': {
        const [pattern, actual, msg] = getArgs(2, 3);
        return assertThat(
          !this.evaluateComparison('=~', true, actual, pattern),
          msg,
          () => `Pattern '${toString(pattern)}' does match '${toString(actual)}'`,
        );
      }
      case 'assert_report': {
        const [msg] = getArgs(1, 1, [toString]);
        return assertFailed(msg);
      }
      case 'assert_true': {
        const [actual, msg] = getArgs(1, 2);
        return assertThat(
          this.evaluateComparison('!=', true, bool(false), actual),
          msg,
          () => `Expected True but got ${displayValue(actual)}`,
        );
      }
      case 'byte2line': {
        const [byte] = getArgs(1, 1, [toInt]);
        if (byte <= 0) {
          return int(-1);
        }
        return int(this.vimState!.document.positionAt(byte - 1).line + 1);
      }
      // TODO: byteidx[comp]
      case 'call': {
        const toArglist = expectType('list', () => VimError.ListRequiredForArgument(2));
        const [_func, arglist, dict] = getArgs(2, 3, [undefined, toArglist]);
        const func: FuncRefValue = (() => {
          if (_func.type === 'funcref') {
            return _func;
          }
          return funcref({
            name: toString(_func),
            arglist: list([]),
            dict: dict ? toDict(dict) : undefined,
          });
        })();
        return this.evaluate(funcrefCall(toExpr(func), arglist.items.map(toExpr)));
      }
      case 'ceil': {
        return float1(Math.ceil);
      }
      case 'col': {
        const [s] = getArgs(1, 1, [toString]);
        return int(getpos(s).col);
      }
      case 'copy': {
        const [x] = getArgs(1);
        return copy(x, false);
      }
      case 'cos': {
        return float1(Math.cos);
      }
      case 'cosh': {
        return float1(Math.cosh);
      }
      case 'count': {
        const [comp, expr, ic, start] = getArgs(2, 4, [undefined, undefined, toInt]);
        const matchCase = (ic ?? 0) === 0;
        let startIdx = 0;
        if (start !== undefined) {
          if (comp.type !== 'list') {
            throw VimError.InvalidArgument474();
          }
          startIdx = resolveIndex(toInt(start), comp.items.length);
          // Like Vim, ignore the start of an empty List
          if (comp.items.length > 0 && (startIdx < 0 || startIdx >= comp.items.length)) {
            throw VimError.ListIndexOutOfRange(toInt(start));
          }
        }
        let count = 0;
        switch (comp.type) {
          case 'string':
            const s = toString(expr);
            if (s) {
              const regex = new RegExp(escapeRegExp(s), matchCase ? 'g' : 'ig');
              count = [...comp.value.matchAll(regex)].length;
            }
            break;
          case 'list':
            for (let i = startIdx; i < comp.items.length; i++) {
              if (this.evaluateComparison('==', matchCase, comp.items[i], expr)) {
                count++;
              }
            }
            break;
          case 'dictionary':
            for (const val of comp.items.values()) {
              if (this.evaluateComparison('==', matchCase, val, expr)) {
                count++;
              }
            }
            break;
          default:
            throw VimError.ArgumentOfFuncMustBeAListStringOrDictionary(call.func);
        }
        return int(count);
      }
      // TODO: cursor()
      case 'deepcopy': {
        const [x] = getArgs(1);
        return copy(x, true);
      }
      case 'empty': {
        const [x] = getArgs(1);
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
        const [s, chars] = getArgs(2, 2, [toString, toString]);
        return str(s.replace(new RegExp(`[${escapeRegExp(chars)}]`, 'g'), '\\$&'));
      }
      case 'eval': {
        const [expr] = getArgs(1, 1, [toString]);
        return this.evaluate(expressionParser.tryParse(expr));
      }
      // TODO: exists()
      case 'exp': {
        return float1(Math.exp);
      }
      // TODO: extend/extendnew()
      // TODO: filecopy()
      // TODO: filereadable()/filewritable()
      // TODO: filter()
      case 'flatten':
      case 'flattennew': {
        // Like Vim, name flatten() in the error even for flattennew()
        const toFlattenArg = expectType('list', () => VimError.ArgumentMustBeAList('flatten'));
        const [l, depth = 99999999] = getArgs(1, 2, [toFlattenArg, toInt]);
        if (depth < 0) {
          throw VimError.MaxDepthMustBeANonNegativeNumber();
        }
        let newItems: Value[] = [...l.items];
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
          l.items = newItems;
        }
        return list(newItems);
      }
      case 'float2nr': {
        return floatToInt1((x) => x);
      }
      case 'floor': {
        return float1(Math.floor);
      }
      case 'fmod': {
        return float2((x, y) => x % y);
      }
      case 'fullcommand': {
        const [name] = getArgs(1, 1, [toString]);
        // Like Vim, skip any colons and range, and ignore the arguments
        const result = optWhitespace
          .then(string(':').skip(optWhitespace).many())
          .then(LineRange.parser.fallback(undefined))
          .then(optWhitespace)
          .then(exCommandNameParser)
          .skip(all)
          .parse(name);
        return str(result.status ? fullCommandName(result.value) : '');
      }
      case 'function': {
        const [name, arglist, dict] = getArgs(1, 3);
        if (arglist) {
          if (arglist.type === 'list') {
            if (dict && dict.type !== 'dictionary') {
              throw VimError.ExpectedADict();
            }
            return funcref({ name: toString(name), arglist, dict });
          } else if (arglist.type === 'dictionary') {
            if (dict) {
              // function('abs', {}, {})
              throw VimError.SecondArgumentOfFunction();
            }
            return funcref({ name: toString(name), dict: arglist });
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
        return funcref({ name: toString(name), arglist, dict });
      }
      // TODO: funcref()
      case 'garbagecollect': {
        const [atexit] = getArgs(0, 1);
        return int(0); // No-op
      }
      case 'get': {
        const [haystack, _idx, _default] = getArgs(2, 3);
        if (haystack.type === 'list') {
          const idx = resolveIndex(toInt(_idx), haystack.items.length);
          return idx >= 0 && idx < haystack.items.length
            ? haystack.items[idx]
            : (_default ?? int(0));
        } else if (haystack.type === 'blob') {
          const bytes = new Uint8Array(haystack.data);
          const idx = resolveIndex(toInt(_idx), bytes.length);
          return idx >= 0 && idx < bytes.length ? int(bytes[idx]) : (_default ?? int(-1));
        } else if (haystack.type === 'dictionary') {
          const val = haystack.items.get(toString(_idx));
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
        // TODO: When {lnum} is a String that doesn't start with a digit, line() is called
        const [lnum, end] = getArgs(1, 2, [toInt, toInt]);
        if (end === undefined) {
          return str(this.vimState!.document.lineAt(lnum).text);
        }
        const lines: string[] = [];
        for (let i = lnum; i <= end; i++) {
          lines.push(this.vimState!.document.lineAt(i).text);
        }
        return list(lines.map(str));
      }
      case 'getpid': {
        return int(process.pid);
      }
      case 'getpos': {
        const [s] = getArgs(1, 1, [toString]);
        const { bufnum, lnum, col, off } = getpos(s);
        return list([int(bufnum), int(lnum), int(col), int(off)]);
      }
      // TODO: getreg()
      // TODO: getreginfo()
      case 'getregtype': {
        const [regname] = getArgs(1, 1, [toString]);
        const reg = Register.getSync(regname);
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
        reg.registerMode satisfies never;
        return str('');
      }
      case 'gettext': {
        const [s] = getArgs(1, 1, [toString]);
        return str(s);
      }
      // TODO: glob2regpat()
      case 'has': {
        const [feature] = getArgs(1, 1, [toString]);
        return bool(feature === 'vscode');
      }
      case 'has_key': {
        const [d, k] = getArgs(2, 2, [toDict, toString]);
        return bool(d.items.has(k));
      }
      // TODO: hasmapto()
      // TODO: histadd()/histdel()/histget()/histnr()
      case 'id': {
        // NOTE: Vim behaves differently (generally returning pointer addresses), but this serves the purpose
        const [x] = getArgs(1);
        if (x.type === 'number' || x.type === 'float' || x.type === 'string') {
          return str(x.value.toString());
        }
        return str(x.id);
      }
      case 'index': {
        const [haystack, _needle, _start, ic] = getArgs(2, 4);

        if (haystack.type === 'list') {
          const start = _start ? resolveIndex(toInt(_start), haystack.items.length) : 0;
          if (start >= 0) {
            for (let idx = start; idx < haystack.items.length; idx++) {
              if (this.evaluateComparison('==', true, haystack.items[idx], _needle)) {
                return int(idx);
              }
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
        const [l, item, idx = 0] = getArgs(2, 3, [undefined, undefined, toInt]);
        if (l.type === 'blob') {
          if (idx < 0 || idx > l.data.byteLength) {
            throw VimError.InvalidArgument475(idx.toString());
          }
          const bytes = new Uint8Array(l.data);
          const newBytes = new Uint8Array(bytes.length + 1);
          newBytes.set(bytes.subarray(0, idx), 0);
          newBytes[idx] = toInt(item);
          newBytes.set(bytes.subarray(idx), idx + 1);
          l.data = newBytes;
          return l;
        }
        const lst = toList(l);
        const listIdx = resolveIndex(idx, lst.items.length);
        if (listIdx < 0 || listIdx > lst.items.length) {
          throw VimError.ListIndexOutOfRange(idx);
        }
        lst.items.splice(listIdx, 0, item);
        return lst;
      }
      case 'invert': {
        // eslint-disable-next-line no-bitwise
        return int1((x) => ~x);
      }
      // TODO: isabsolutepath()
      // TODO: isdirectory()
      case 'isinf': {
        return floatToInt1((x) => (x === Infinity ? 1 : x === -Infinity ? -1 : 0));
      }
      // TODO: islocked()
      case 'isnan': {
        return floatToBool1((x) => isNaN(x));
      }
      case 'items': {
        const [d] = getArgs(1, 1, [toDict]);
        return list([...d.items.entries()].map(([k, v]) => list([str(k), v])));
      }
      case 'join': {
        const [l, sep] = getArgs(1, 2, [toList, toString]);
        return str(l.items.map(toString).join(sep ?? ''));
      }
      case 'json_decode': {
        const fromJSObj = (x: any): Value => {
          if (Array.isArray(x)) {
            return list(x.map(fromJSObj));
          } else if (typeof x === 'number') {
            return isInteger(x) ? int(x) : float(x);
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
        return fromJSObj(JSON.parse(toString(expr)));
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
        return str(JSON.stringify(toJSObj(expr), null, 0)); // TODO: Fix whitespace
      }
      case 'keys': {
        const [d] = getArgs(1, 1, [toDict]);
        return list([...d.items.keys()].map(str));
      }
      case 'len': {
        const [x] = getArgs(1);
        switch (x.type) {
          case 'number':
            return int(x.value.toString().length);
          case 'string':
            return int(x.value.length);
          case 'list':
            return int(x.items.length);
          case 'dictionary':
            return int(x.items.size);
          case 'blob':
            return int(x.data.byteLength);
          default:
            throw VimError.InvalidTypeForLen();
        }
      }
      case 'line': {
        const [s, winid] = getArgs(1, 2, [toString]);
        return int(getpos(s).lnum);
      }
      case 'line2byte': {
        const [line] = getArgs(1, 1, [toInt]);
        if (line <= 0) {
          return int(-1);
        }
        return int(this.vimState!.document.offsetAt(new Position(line - 1, 0)) + 1);
      }
      case 'localtime': {
        return int(Date.now() / 1000);
      }
      case 'log': {
        return float1(Math.log);
      }
      case 'log10': {
        return float1(Math.log10);
      }
      case 'map':
      case 'mapnew': {
        const [seq, fn] = getArgs(2);
        switch (seq.type) {
          case 'list':
            const newItems = seq.items.map((val, idx) => {
              switch (fn.type) {
                case 'funcref':
                  return this.evaluate(funcrefCall(toExpr(fn), [int(idx), toExpr(val)]));
                default:
                  this.localScopes.push(
                    new Map([
                      ['v:key', new Variable(int(idx))],
                      ['v:val', new Variable(val)],
                    ]),
                  );
                  const retval = this.evaluate(expressionParser.tryParse(toString(fn)));
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
      case 'max':
      case 'min': {
        const [l] = getArgs(1);
        let values: Value[];
        if (l.type === 'list') {
          values = l.items;
        } else if (l.type === 'dictionary') {
          values = [...l.items.values()];
        } else {
          throw VimError.ArgumentOfFuncMustBeAListOrDictionary(call.func);
        }
        const fn = call.func === 'max' ? Math.max : Math.min;
        return int(values.length === 0 ? 0 : fn(...values.map(toInt)));
      }
      case 'mode': {
        const [arg] = getArgs(0, 1);
        switch (this.vimState!.currentModeIncludingPseudoModes) {
          case Mode.Normal:
            return str('n');
          case Mode.OperatorPendingMode:
            return nonZeroArg(arg) ? str('n') : str('no');
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
      case 'nextnonblank':
      case 'prevnonblank': {
        const [line] = getArgs(1, 1, [toInt]);
        const forward = call.func === 'nextnonblank';
        if (forward ? line <= 0 : line > this.vimState!.document.lineCount) {
          return int(0);
        }
        const step = forward ? 1 : -1;
        const limit = forward ? this.vimState!.document.lineCount : -1;
        for (let i = line - 1; forward ? i < limit : i >= 0; i += step) {
          if (this.vimState!.document.lineAt(i).text.length > 0) {
            return int(i + 1);
          }
        }
        return int(0);
      }
      case 'or': {
        // eslint-disable-next-line no-bitwise
        return int2((x, y) => x | y);
      }
      case 'pow': {
        return float2(Math.pow);
      }
      // TODO: printf()
      // TODO: rand()
      case 'range': {
        const [val, max, step = 1] = getArgs(1, 3, [toInt, toInt, toInt]);
        const start = max !== undefined ? val : 0;
        const end = max ?? val - 1;
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
        const [val, count] = getArgs(2, 2, [undefined, toInt]);
        if (val.type === 'list') {
          const items: Value[] = new Array<Value[]>(count).fill(val.items).flat();
          return list(items);
        } else {
          return str(toString(val).repeat(count));
        }
      }
      case 'remove': {
        const [haystack, _idx, _end] = getArgs(2, 3);
        if (haystack.type === 'list') {
          const idx = resolveIndex(toInt(_idx), haystack.items.length);
          if (idx < 0 || idx >= haystack.items.length) {
            throw VimError.ListIndexOutOfRange(toInt(_idx));
          }
          if (_end === undefined) {
            return haystack.items.splice(idx, 1)[0]; // TODO: This doesn't remove the item?
          } else {
            // TODO: remove({list}, {idx}, {end})
          }
        }
        // TODO: remove({blob}, {idx}, [{end}])
        else if (haystack.type === 'dictionary') {
          const key = toString(_idx);
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
        if (l.type === 'list') {
          l.items.reverse();
          return l;
        } else if (l.type === 'blob') {
          l.data = new Uint8Array(l.data).reverse();
          return l;
        }
        return int(0);
      }
      case 'round': {
        // Halfway between integers, Math.round() rounds toward infinity while Vim's round() rounds away from 0.
        return float1((x) => (x < 0 ? -Math.round(-x) : Math.round(x)));
      }
      // TODO: setpos()
      // TODO: setreg()
      case 'sin': {
        return float1(Math.sin);
      }
      case 'sinh': {
        return float1(Math.sinh);
      }
      case 'sort': {
        // TODO: use dict
        const [l, func, dict] = getArgs(1, 3, [toListArg]);
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
        const [s, pattern, keepempty] = getArgs(1, 3, [toString, toString, toInt]);
        // TODO: Actually parse pattern
        const result = s.split(pattern ? pattern : /\s+/);
        if (!keepempty) {
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
        return float1(Math.sqrt);
      }
      case 'str2float': {
        // TODO: Support 1e40 (rather than 1.0e40)
        const [s, quoted] = getArgs(1, 2, [toString]);
        if (/^inf/i.test(s)) return float(Infinity);
        if (/^-inf/i.test(s)) return float(-Infinity);
        if (/^nan/i.test(s)) return float(NaN);
        const result = alt<FloatValue | NumberValue>(floatParser, numberParser).skip(all).parse(s);
        return float(result.status ? result.value.value : 0);
      }
      case 'str2list': {
        const [s, _ignored] = getArgs(1, 2, [toString]);
        const result: number[] = [];
        for (const char of s) {
          result.push(char.charCodeAt(0));
        }
        return list(result.map(int));
      }
      case 'str2nr': {
        const [_s, base = 10] = getArgs(1, 2, [toString, toInt]);
        let s = _s;

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
        const [haystack, needle, start] = getArgs(2, 3, [toString, toString, toInt]);
        return int(haystack.indexOf(needle, start));
      }
      case 'string': {
        const [x] = getArgs(1);
        return str(displayValue(x));
      }
      case 'strlen': {
        const [s] = getArgs(1, 1, [toString]);
        return int(s.length);
      }
      case 'strpart': {
        const [src, start, _len, chars] = getArgs(2, 4, [toString, toInt, toInt]);
        const len = _len ?? src.length - start;
        return str(src.substring(start, start + len));
      }
      // TODO: submatch()
      // TODO: substitute()
      case 'tan': {
        return float1(Math.tan);
      }
      case 'tanh': {
        return float1(Math.tanh);
      }
      // TODO: timer*()
      case 'tolower': {
        const [s] = getArgs(1, 1, [toString]);
        return str(s.toLowerCase());
      }
      case 'toupper': {
        const [s] = getArgs(1, 1, [toString]);
        return str(s.toUpperCase());
      }
      case 'tr': {
        const [src, from, to] = getArgs(3, 3, [toString, toString, toString]);
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
        // TODO: use mask
        const [_s, mask, dir = 0] = getArgs(1, 3, [toString, undefined, toInt]);
        let s = _s;
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
        return float1(Math.trunc);
      }
      case 'type': {
        const [x] = getArgs(1);
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
            x satisfies never;
            throw new Error('type() got unexpected type');
        }
      }
      case 'uniq': {
        const [l, func, dict] = getArgs(1, 3, [toListArg]);
        // TODO: Use func (see sort() and try to re-use implementation)
        // TODO: Use dict
        if (l.items.length > 1) {
          let prev: Value = l.items[0];
          for (let i = 1; i < l.items.length;) {
            const val = l.items[i];
            if (prev.type === val.type && this.evaluateComparison('==', true, prev, val)) {
              l.items.splice(i, 1);
            } else {
              prev = val;
              i++;
            }
          }
        }
        return l;
      }
      case 'values': {
        const [d] = getArgs(1, 1, [toDict]);
        return list([...d.items.values()]);
      }
      case 'visualmode': {
        const [arg] = getArgs(0, 1); // TODO: Use arg
        const mode = this.vimState?.lastVisualSelection?.mode;
        if (mode === undefined) {
          return str('');
        }
        return mode === Mode.Visual ? str('v') : mode === Mode.VisualLine ? str('V') : str('\x16');
      }
      // TODO: wordcount()
      case 'xor': {
        // eslint-disable-next-line no-bitwise
        return int2((x, y) => x ^ y);
      }
      default: {
        throw VimError.UnknownFunction_call(call.func);
      }
    }
  }
}
