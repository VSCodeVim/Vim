import * as assert from 'assert';
import {
  int,
  negative,
  positive,
  listExpr,
  funcCall,
  multiply,
  add,
  str,
  lambda,
  variable,
  float,
  bool,
  list,
} from '../../src/vimscript/expression/build';
import { EvaluationContext } from '../../src/vimscript/expression/evaluate';
import { expressionParser } from '../../src/vimscript/expression/parser';
import { Expression, Value } from '../../src/vimscript/expression/types';
import { displayValue } from '../../src/vimscript/expression/displayValue';
import { ErrorCode, VimError } from '../../src/error';

function exprTest(
  input: string,
  asserts: { expr?: Expression } & ({ value?: Value; display?: string } | { error: ErrorCode })
) {
  test(input, () => {
    try {
      const expression = expressionParser.tryParse(input);
      if (asserts.expr) {
        assert.deepStrictEqual(expression, asserts.expr);
      }
      if ('error' in asserts) {
        const ctx = new EvaluationContext();
        ctx.evaluate(expression);
      } else {
        if (asserts.value !== undefined) {
          const ctx = new EvaluationContext();
          assert.deepStrictEqual(ctx.evaluate(expression), asserts.value);
        }
        if (asserts.display !== undefined) {
          const ctx = new EvaluationContext();
          assert.deepStrictEqual(displayValue(ctx.evaluate(expression)), asserts.display);
        }
      }
    } catch (e: unknown) {
      if (e instanceof VimError) {
        if ('error' in asserts) {
          assert.deepStrictEqual(e.code, asserts.error);
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  });
}

suite.only('Parse & evaluate expression', () => {
  suite('Numbers', () => {
    exprTest('0', { expr: int(0) });
    exprTest('123', { expr: int(123) });

    // Hexadecimal
    exprTest('0xff', { expr: int(255) });
    exprTest('0Xff', { expr: int(255) });

    // Binary
    exprTest('0b01111', { expr: int(15) });
    exprTest('0B01111', { expr: int(15) });

    // Octal
    exprTest('012345', { expr: int(5349) });

    // Looks like octal, but is not (has 8 or 9 as digit)
    exprTest('012345678', { expr: int(12345678) });

    exprTest('-47', { expr: negative(int(47)), value: int(-47) });
    exprTest('--47', { expr: negative(negative(int(47))), value: int(47) });
    exprTest('+47', { expr: positive(int(47)), value: int(47) });
  });

  suite('Floats', () => {
    exprTest('1.2', { expr: float(1.2) });
    exprTest('0.583', { expr: float(0.583) });
    exprTest('-5.3', { expr: negative(float(5.3)), value: float(-5.3) });
  });

  suite('Strings', () => {
    exprTest('""', { expr: str('') });
    exprTest('"\\""', { expr: str('"') });
    exprTest('"one\\ntwo\\tthree"', { expr: str('one\ntwo\tthree') });
  });

  suite('Literal strings', () => {
    exprTest("''", { expr: str('') });
    exprTest("''''", { expr: str("'") });
    exprTest("'one two three'", { expr: str('one two three') });
    exprTest("'one ''two'' three'", { expr: str("one 'two' three") });
    exprTest("'one\\ntwo\\tthree'", { expr: str('one\\ntwo\\tthree') });
  });

  suite('Option', () => {
    exprTest('&wrapscan', {
      expr: {
        type: 'option',
        scope: undefined,
        name: 'wrapscan',
      },
    });
    exprTest('&g:wrapscan', {
      expr: {
        type: 'option',
        scope: 'g',
        name: 'wrapscan',
      },
    });
    exprTest('&l:wrapscan', {
      expr: {
        type: 'option',
        scope: 'l',
        name: 'wrapscan',
      },
    });
  });

  suite('List', () => {
    exprTest('[1,2,3]', { expr: listExpr([int(1), int(2), int(3)]) });
    exprTest('[1,2,3,]', { expr: listExpr([int(1), int(2), int(3)]) });
    exprTest('[   1   ,   2   ,   3   ]', { expr: listExpr([int(1), int(2), int(3)]) });
    exprTest('[-1,7*8,3]', {
      expr: listExpr([negative(int(1)), multiply(int(7), int(8)), int(3)]),
    });
    exprTest('[[1,2],[3,4]]', {
      expr: listExpr([listExpr([int(1), int(2)]), listExpr([int(3), int(4)])]),
    });
  });

  suite('Index', () => {
    exprTest("'xyz'[0]", {
      expr: {
        type: 'index',
        expression: str('xyz'),
        index: int(0),
      },
      value: str('x'),
    });

    exprTest("'xyz'[0][1]", {
      expr: {
        type: 'index',
        expression: {
          type: 'index',
          expression: str('xyz'),
          index: int(0),
        },
        index: int(1),
      },
    });

    exprTest("#{one: 1, two: 2, three: 3}['one']", { value: int(1) });
    exprTest("#{one: 1, two: 2, three: 3}['two']", { value: int(2) });
    exprTest("#{one: 1, two: 2, three: 3}['three']", { value: int(3) });
    exprTest("#{one: 1, two: 2, three: 3}['four']", { error: ErrorCode.KeyNotPresentInDictionary });
  });

  suite('Entry', () => {
    exprTest('#{one: 1, two: 2, three: 3}.one', { value: int(1) });
    exprTest('#{one: 1, two: 2, three: 3}.two', { value: int(2) });
    exprTest('#{one: 1, two: 2, three: 3}.three', { value: int(3) });
    exprTest('#{one: 1, two: 2, three: 3}.four', { error: ErrorCode.KeyNotPresentInDictionary });
  });

  suite('Slice', () => {
    suite('String', () => {
      exprTest("'abcde'[2:3]", {
        expr: {
          type: 'slice',
          expression: str('abcde'),
          start: int(2),
          end: int(3),
        },
        value: str('cd'),
      });

      exprTest("'abcde'[2:]", {
        expr: {
          type: 'slice',
          expression: str('abcde'),
          start: int(2),
          end: undefined,
        },
        value: str('cde'),
      });

      exprTest("'abcde'[:3]", {
        expr: {
          type: 'slice',
          expression: str('abcde'),
          start: undefined,
          end: int(3),
        },
        value: str('abcd'),
      });

      exprTest("'abcde'[-4:-2]", {
        expr: {
          type: 'slice',
          expression: str('abcde'),
          start: negative(int(4)),
          end: negative(int(2)),
        },
        value: str('bcd'),
      });

      exprTest("'abcde'[-2:-4]", {
        expr: {
          type: 'slice',
          expression: str('abcde'),
          start: negative(int(2)),
          end: negative(int(4)),
        },
        value: str(''),
      });

      exprTest("'abcde'[:]", {
        expr: {
          type: 'slice',
          expression: str('abcde'),
          start: undefined,
          end: undefined,
        },
        value: str('abcde'),
      });
    });

    suite('List', () => {
      exprTest('[1,2,3,4,5][2:3]', {
        expr: {
          type: 'slice',
          expression: listExpr([int(1), int(2), int(3), int(4), int(5)]),
          start: int(2),
          end: int(3),
        },
        value: list([int(3), int(4)]),
      });

      exprTest('[1,2,3,4,5][2:]', {
        expr: {
          type: 'slice',
          expression: listExpr([int(1), int(2), int(3), int(4), int(5)]),
          start: int(2),
          end: undefined,
        },
        value: list([int(3), int(4), int(5)]),
      });

      exprTest('[1,2,3,4,5][:3]', {
        expr: {
          type: 'slice',
          expression: listExpr([int(1), int(2), int(3), int(4), int(5)]),
          start: undefined,
          end: int(3),
        },
        value: list([int(1), int(2), int(3), int(4)]),
      });

      exprTest('[1,2,3,4,5][-4:-2]', {
        expr: {
          type: 'slice',
          expression: listExpr([int(1), int(2), int(3), int(4), int(5)]),
          start: negative(int(4)),
          end: negative(int(2)),
        },
        value: list([int(2), int(3), int(4)]),
      });

      exprTest('[1,2,3,4,5][-2:-4]', {
        expr: {
          type: 'slice',
          expression: listExpr([int(1), int(2), int(3), int(4), int(5)]),
          start: negative(int(2)),
          end: negative(int(4)),
        },
        value: list([]),
      });

      exprTest('[1,2,3,4,5][:]', {
        expr: {
          type: 'slice',
          expression: listExpr([int(1), int(2), int(3), int(4), int(5)]),
          start: undefined,
          end: undefined,
        },
        value: list([int(1), int(2), int(3), int(4), int(5)]),
      });
    });
  });

  suite('Entry', () => {
    exprTest('dict.one', {
      expr: {
        type: 'entry',
        expression: variable('dict'),
        entryName: 'one',
      },
    });

    exprTest('dict.1', {
      expr: {
        type: 'entry',
        expression: variable('dict'),
        entryName: '1',
      },
    });

    exprTest('dict.1two', {
      expr: {
        type: 'entry',
        expression: variable('dict'),
        entryName: '1two',
      },
    });
  });

  suite('Arithmetic', () => {
    exprTest('5*6', { expr: multiply(int(5), int(6)), value: int(30) });
    exprTest('5*-6', { expr: multiply(int(5), negative(int(6))), value: int(-30) });
    exprTest('12*34*56', {
      expr: multiply(multiply(int(12), int(34)), int(56)),
      value: int(22848),
    });

    exprTest('4/5', { value: int(0) });
    exprTest('4/5.0', { display: '0.8' });
    exprTest('4.0/5', { display: '0.8' });
  });

  suite('Precedence', () => {
    exprTest('23+3*9', { expr: add(int(23), multiply(int(3), int(9))), value: int(50) });
    exprTest('(23+3)*9', { expr: multiply(add(int(23), int(3)), int(9)), value: int(234) });
  });

  suite('Function calls', () => {
    exprTest('getcmdpos()', { expr: funcCall('getcmdpos', []) });
    exprTest('sqrt(9)', { expr: funcCall('sqrt', [int(9)]), value: float(3.0) });
    exprTest('fmod(21,2)', { expr: funcCall('fmod', [int(21), int(2)]) });
    exprTest('fmod(2*10,2)', { expr: funcCall('fmod', [multiply(int(2), int(10)), int(2)]) });
    exprTest('add([1,2,3],4)', {
      expr: funcCall('add', [listExpr([int(1), int(2), int(3)]), int(4)]),
    });
    exprTest('reverse([1,2,3])', {
      expr: funcCall('reverse', [listExpr([int(1), int(2), int(3)])]),
      value: list([int(3), int(2), int(1)]),
    });
  });

  suite('Lambda', () => {
    exprTest('{x->x}', { expr: lambda(['x'], variable('x')) });
    exprTest('{x,y->x+y}', { expr: lambda(['x', 'y'], add(variable('x'), variable('y'))) });
  });
});

suite.only('Comparisons', () => {
  suite('String equality', () => {
    exprTest("'abc' == 'Abc'", { value: bool(false) }); // TODO: this should depend on 'ignorecase'
    exprTest("'abc' ==# 'Abc'", { value: bool(false) });
    exprTest("'abc' ==? 'Abc'", { value: bool(true) });
  });

  suite('Misc', () => {
    exprTest("4 == '4'", { value: bool(true) });
    exprTest("4 is '4'", { value: bool(false) });
    exprTest('0 is []', { value: bool(false) });
    exprTest('0 is {}', { value: bool(false) });
    exprTest('[4] == ["4"]', { value: bool(false) });
  });
});

suite.only('Conversions', () => {
  suite.only('A stringified number can have only 1 sign in front of it', () => {
    exprTest("+'123'", { value: int(123) });

    exprTest("+'-123'", { value: int(-123) });
    exprTest("+'+123'", { value: int(123) });

    exprTest("+'--123'", { value: int(0) });
    exprTest("+'++123'", { value: int(0) });
    exprTest("+'-+123'", { value: int(0) });
    exprTest("+'+-123'", { value: int(0) });
  });
});

suite.only('Operators', () => {
  suite('Unary', () => {
    suite('!', () => {
      exprTest('!0', { value: int(1) });
      exprTest('!1', { value: int(0) });
      exprTest('!123', { value: int(0) });

      exprTest('!0.0', { value: float(1.0) });
      exprTest('!1.0', { value: float(0.0) });
      exprTest('!123.0', { value: float(0.0) });

      exprTest("!'0'", { value: int(1) });
      exprTest("!'1'", { value: int(0) });
      exprTest("!'xyz'", { value: int(1) });
      exprTest('![]', { error: ErrorCode.UsingAListAsANumber });
      exprTest('!{}', { error: ErrorCode.UsingADictionaryAsANumber });
    });

    suite('+', () => {
      exprTest('+5', { value: int(5) });
      exprTest('+-5', { value: int(-5) });

      exprTest('+5.0', { value: float(5) });
      exprTest('+-5.0', { value: float(-5) });

      exprTest("+'5'", { value: int(5) });
      exprTest("+'-5'", { value: int(-5) });
      exprTest("+'xyz'", { value: int(0) });
      exprTest('+[]', { error: ErrorCode.UsingAListAsANumber });
      exprTest('+{}', { error: ErrorCode.UsingADictionaryAsANumber });
    });

    suite('-', () => {
      exprTest('-5', { value: int(-5) });
      exprTest('--5', { value: int(5) });

      exprTest('-5.0', { value: float(-5) });
      exprTest('--5.0', { value: float(5) });

      exprTest("-'5'", { value: int(-5) });
      exprTest("-'-5'", { value: int(5) });
      exprTest("-'xyz'", { value: int(-0) });
      exprTest('-[]', { error: ErrorCode.UsingAListAsANumber });
      exprTest('-{}', { error: ErrorCode.UsingADictionaryAsANumber });
    });
  });

  suite('Binary', () => {
    exprTest("'123' + '456'", { value: int(579) });
    exprTest("'123' . '456'", { value: str('123456') });
    exprTest("'123' .. '456'", { value: str('123456') });
    exprTest('123 . 456', { value: str('123456') });
    exprTest('123 .. 456', { value: str('123456') });

    suite('%', () => {
      exprTest('75 % 22', { value: int(9) });
      exprTest('75 % -22', { value: int(9) });
      exprTest('-75 % 22', { value: int(-9) });
      exprTest('-75 % -22', { value: int(-9) });

      exprTest('5 % 0', { value: int(0) });
      exprTest('-5 % 0', { value: int(0) });

      exprTest('5.2 % 2.1', { error: ErrorCode.CannotUseModuloWithFloat });
      exprTest('5.2 % 2', { error: ErrorCode.CannotUseModuloWithFloat });
      exprTest('5 % 2.1', { error: ErrorCode.CannotUseModuloWithFloat });
    });
  });
});

suite.only('Builtin functions', () => {
  suite('empty', () => {
    exprTest('empty(0)', { value: bool(true) });
    exprTest('empty(0.0)', { value: bool(true) });
    exprTest("empty('')", { value: bool(true) });
    exprTest('empty([])', { value: bool(true) });
    exprTest('empty({})', { value: bool(true) });

    exprTest('empty(1)', { value: bool(false) });
    exprTest('empty(1.0)', { value: bool(false) });
    exprTest("empty('xyz')", { value: bool(false) });
    exprTest('empty([0])', { value: bool(false) });
    exprTest("empty({'k': 'v'})", { value: bool(false) });
  });

  suite('function', () => {
    exprTest("function('abs')", { display: 'abs' });
    exprTest("function('abs', [])", { display: 'abs' });
    exprTest("function('abs', [-5])", { display: "function('abs', [-5])" });
    exprTest("function('abs', -5)", { error: ErrorCode.SecondArgumentOfFunction });
    exprTest("function('abs', '-5')", { error: ErrorCode.SecondArgumentOfFunction });
    exprTest("function('abs', [], [])", { error: ErrorCode.ExpectedADict });
    exprTest("function('abs', {}, {})", { error: ErrorCode.SecondArgumentOfFunction });
    exprTest("function('abs', [], {})", { display: "function('abs', {})" });
    exprTest("function('abs', [], #{x:5})", { display: "function('abs', {'x': 5})" });

    // Immediately invoke the funcref
    exprTest("function('abs')(-5)", { value: float(5) });
    exprTest("function('abs', [-5])()", { value: float(5) });
    exprTest("function('or', [1])(64)", { value: int(65) });
  });

  suite('float2nr', () => {
    exprTest('float2nr(123)', { value: int(123) });
    exprTest('float2nr(40.0)', { value: int(40) });
    exprTest('float2nr(65.7)', { value: int(65) });
    exprTest('float2nr(-20.7)', { value: int(-20) });
  });

  suite('fmod', () => {
    exprTest('fmod(11, 3)', { value: float(2.0) });
    exprTest('fmod(4.2, 1.0)', { display: '0.2' });
    exprTest('fmod(4.2, -1.0)', { display: '0.2' });
    exprTest('fmod(-4.2, 1.0)', { display: '-0.2' });
    exprTest('fmod(-4.2, -1.0)', { display: '-0.2' });
  });

  suite('isnan/isinf', () => {
    exprTest('isnan(0.0 / 0.0)', { value: bool(true) });

    exprTest('isinf(1.0 / 0.0)', { value: int(1) });
    exprTest('isinf(-1.0 / 0.0)', { value: int(-1) });
  });

  suite('map', () => {
    exprTest("map([10, 20, 30], 'v:key')", {
      value: list([int(0), int(1), int(2)]),
    });
    exprTest("map([10, 20, 30], 'v:val')", {
      value: list([int(10), int(20), int(30)]),
    });
    exprTest("map([10, 20, 30], 'v:key + v:val')", {
      value: list([int(10), int(21), int(32)]),
    });

    exprTest('map([10, 20, 30], {k -> 2 * k})', {
      value: list([int(0), int(2), int(4)]),
    });
    exprTest('map([10, 20, 30], {k, v -> k + v})', {
      value: list([int(10), int(21), int(32)]),
    });

    // TODO: map() with builtin Funcref
  });

  suite('max', () => {
    exprTest('max([])', { value: int(0) });
    exprTest('max({})', { value: int(0) });
    exprTest('max([4, 3, 1, 5, 2])', { value: int(5) });
    exprTest('max(#{ten:10,twenty:20,thirty:30})', { value: int(30) });
    exprTest('max([1.2, 1.5])', { error: ErrorCode.UsingAFloatAsANumber });
    exprTest("max('1,2,3')", { error: ErrorCode.ArgumentOfMaxMustBeAListOrDictionary });
  });
  suite('min', () => {
    exprTest('min([])', { value: int(0) });
    exprTest('min({})', { value: int(0) });
    exprTest('min([4, 3, 1, 5, 2])', { value: int(1) });
    exprTest('min(#{ten:10,twenty:20,thirty:30})', { value: int(10) });
    exprTest('min([1.2, 1.5])', { error: ErrorCode.UsingAFloatAsANumber });
    exprTest("min('1,2,3')", { error: ErrorCode.ArgumentOfMaxMustBeAListOrDictionary });
  });

  suite('tolower', () => {
    exprTest("tolower('Hello, World!')", { display: 'hello, world!' });
    exprTest('tolower(123)', { display: '123' });
    exprTest('tolower(1.23)', { error: ErrorCode.UsingFloatAsAString });
  });
  suite('toupper', () => {
    exprTest("toupper('Hello, World!')", { display: 'HELLO, WORLD!' });
    exprTest('toupper(123)', { display: '123' });
    exprTest('toupper(1.23)', { error: ErrorCode.UsingFloatAsAString });
  });

  suite('range', () => {
    exprTest('range(4)', { display: '[0, 1, 2, 3]' });
    exprTest('range(2, 4)', { display: '[2, 3, 4]' });
    exprTest('range(2, 9, 3)', { display: '[2, 5, 8]' });
    exprTest('range(2, -2, -1)', { display: '[2, 1, 0, -1, -2]' });
    exprTest('range(0)', { display: '[]' });
    exprTest('range(1, 10, 0)', { error: ErrorCode.StrideIsZero });
    exprTest('range(2, 0)', { error: ErrorCode.StartPastEnd });
  });

  suite('repeat', () => {
    exprTest('repeat(3, 5)', { display: '33333' });
    exprTest('repeat("abc", 3)', { display: 'abcabcabc' });
    exprTest('repeat("", 8)', { display: '' });
    exprTest('repeat([], 3)', { display: '[]' });
    exprTest('repeat([1,2], 3)', { display: '[1, 2, 1, 2, 1, 2]' });
    exprTest('repeat(range(2,6,2), 3)', { display: '[2, 4, 6, 2, 4, 6, 2, 4, 6]' });
    exprTest('repeat(1.0, 3)', { error: ErrorCode.UsingFloatAsAString });
  });

  suite('string', () => {
    exprTest('string("")', { value: str('') });
    exprTest('string(123)', { value: str('123') });
    exprTest('string(123.0)', { value: str('123.0') });
    exprTest('string([1,2,3])', { value: str('[1, 2, 3]') });
    exprTest('string(#{a:1,b:2})', { value: str("{'a': 1, 'b': 2}") });
  });

  suite('floor/ceil/round/trunc', () => {
    exprTest('floor(3.5)', { value: float(3) });
    exprTest('floor(-3.5)', { value: float(-4) });

    exprTest('ceil(3.5)', { value: float(4) });
    exprTest('ceil(-3.5)', { value: float(-3) });

    exprTest('round(3.5)', { value: float(4) });
    exprTest('round(-3.5)', { value: float(-4) });

    exprTest('trunc(3.5)', { value: float(3) });
    exprTest('trunc(-3.5)', { value: float(-3) });
  });

  suite('keys/values/items', () => {
    exprTest('keys({})', { value: list([]) });
    exprTest('sort(keys({"a": 1, "b": 2}))', {
      value: list([str('a'), str('b')]),
    });

    exprTest('values({})', { value: list([]) });
    exprTest('sort(values({"a": 1, "b": 2}))', {
      value: list([int(1), int(2)]),
    });

    exprTest('items({})', { value: list([]) });
    exprTest('sort(items({"a": 1, "b": 2}))', {
      value: list([list([str('a'), int(1)]), list([str('b'), int(2)])]),
    });
  });

  suite('sort', () => {
    exprTest('sort([])', { value: list([]) });

    exprTest("sort(['A', 'c', 'B', 'a', 'C', 'b'])", { display: "['A', 'B', 'C', 'a', 'b', 'c']" });

    exprTest("sort(['A', 'c', 'B', 'a', 'C', 'b'], 'i')", {
      display: "['A', 'a', 'B', 'b', 'C', 'c']",
    });
    exprTest("sort(['A', 'c', 'B', 'a', 'C', 'b'], 1)", {
      display: "['A', 'a', 'B', 'b', 'C', 'c']",
    });

    exprTest('sort([4,2,1,3,5])', { display: '[1, 2, 3, 4, 5]' });
    exprTest('sort([4,2,1,3,5], {x,y->x-y})', { display: '[1, 2, 3, 4, 5]' });
    exprTest('sort([4,2,1,3,5], {x,y->y-x})', { display: '[5, 4, 3, 2, 1]' });
    // TODO
  });
});
