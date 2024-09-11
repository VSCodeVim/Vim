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
  asserts: { expr?: Expression } & ({ value?: Value; display?: string } | { error: ErrorCode }),
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

suite('Vimscript expressions', () => {
  suite('Parse & evaluate expression', () => {
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
      exprTest('-5.3', { expr: negative(float(5.3)), value: float(-5.3) });

      exprTest('1.23e5', { expr: float(123000) });
      exprTest('-4.56E-3', { expr: negative(float(0.00456)) });
      exprTest('0.424e0', { expr: float(0.424) });

      // By default, 6 decimal places when displayed (:help floating-point-precision)
      exprTest('0.123456789', { expr: float(0.123456789), display: '0.123457' });
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

    suite('Blobs', () => {
      exprTest('0zabcd', {
        expr: {
          type: 'blob',
          data: new Uint8Array([171, 205]),
        },
      });
      exprTest('0ZABCD', {
        expr: {
          type: 'blob',
          data: new Uint8Array([171, 205]),
        },
      });
      exprTest('0zabc', {
        error: ErrorCode.BlobLiteralShouldHaveAnEvenNumberOfHexCharacters,
      });
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

      exprTest("'xyz'[1]", {
        value: str('y'),
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

      exprTest("['a','b','c'][1]", { value: str('b') });

      exprTest("#{one: 1, two: 2, three: 3}['one']", { value: int(1) });
      exprTest("#{one: 1, two: 2, three: 3}['two']", { value: int(2) });
      exprTest("#{one: 1, two: 2, three: 3}['three']", { value: int(3) });
      exprTest("#{one: 1, two: 2, three: 3}['four']", {
        error: ErrorCode.KeyNotPresentInDictionary,
      });

      exprTest('0zABCD[0]', { value: int(171) });
      exprTest('0zABCD[1]', { value: int(205) });
      // TODO: Blob, negative index
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

      suite('Blob', () => {
        exprTest('0zDEADBEEF[1:2]', {
          display: '0zADBE',
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

    suite('Method calls', () => {
      exprTest('[1,2,3]->reverse()', {
        value: list([int(3), int(2), int(1)]),
      });
      // exprTest('[1,2,3,4,5,6]->filter({x->x%2==0})->map({x->x*10})', {
      //   value: list([int(20), int(40), int(60)]),
      // });
      exprTest('[1,2,3]->map({k,v->v*10})->join("|")', {
        value: str('10|20|30'),
      });
    });

    suite('Lambda', () => {
      exprTest('{x->x}', { expr: lambda(['x'], variable('x')) });
      exprTest('{x,y->x+y}', { expr: lambda(['x', 'y'], add(variable('x'), variable('y'))) });
    });
  });

  suite('Comparisons', () => {
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

  suite('Conversions', () => {
    suite('A stringified number can have only 1 sign in front of it', () => {
      exprTest("+'123'", { value: int(123) });

      exprTest("+'-123'", { value: int(-123) });
      exprTest("+'+123'", { value: int(123) });

      exprTest("+'--123'", { value: int(0) });
      exprTest("+'++123'", { value: int(0) });
      exprTest("+'-+123'", { value: int(0) });
      exprTest("+'+-123'", { value: int(0) });
    });
  });

  suite('Operators', () => {
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

  suite('Builtin functions', () => {
    suite('assert_*', () => {
      exprTest('assert_equal(1, 1)', { value: int(0) });
      exprTest('assert_equal(1, 2)', { value: int(1) });
    });

    suite('count', () => {
      exprTest('add([1,2,3], 4)', { display: '[1, 2, 3, 4]' });
      exprTest('add(add(add([], 1), 2), 3)', { display: '[1, 2, 3]' });
    });

    suite('count', () => {
      exprTest('count([1,2,3,2,3,2,1], 2)', { value: int(3) });
      exprTest('count(["apple", "banana", "Apple", "carrot", "APPLE"], "Apple")', {
        value: int(1),
      });
      exprTest('count(["apple", "banana", "Apple", "carrot", "APPLE"], "Apple", v:true)', {
        value: int(3),
      });
      exprTest('count(["apple", "banana", "Apple", "carrot", "APPLE"], "Apple", v:true, 2)', {
        value: int(2),
      });
      exprTest('count(["apple", "banana", "Apple", "carrot", "APPLE"], "Apple", v:true, -1)', {
        value: int(1),
      });

      exprTest('count(#{a:3,b:2,c:3}, 3)', { value: int(2) });
      exprTest('count(#{apple:"apple",b:"banana",c:"APPLE"}, "apple")', { value: int(1) });
      exprTest('count(#{apple:"apple",b:"banana",c:"APPLE"}, "apple", v:true)', { value: int(2) });
    });

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

    suite('get', () => {
      exprTest('get([2,4,6], 1)', { value: int(4) });
      exprTest('get([2,4,6], -1)', { value: int(6) });
      exprTest('get([2,4,6], 3)', { value: int(0) });
      exprTest('get([2,4,6], 3, 999)', { value: int(999) });

      exprTest('get(0zABCDEF, 1)', { value: int(205) });
      exprTest('get(0zABCDEF, -1)', { value: int(239) });
      exprTest('get(0zABCDEF, 3)', { value: int(-1) });
      exprTest('get(0zABCDEF, 3, 999)', { value: int(999) });

      exprTest('get(#{a: 1, b: 2, c: 3}, "b")', { value: int(2) });
      exprTest('get(#{a: 1, b: 2, c: 3}, "x")', { value: int(0) });
      exprTest('get(#{a: 1, b: 2, c: 3}, "x", 999)', { value: int(999) });
    });

    suite('has_key', () => {
      exprTest('has_key(#{a:1, b:2, c:3}, "b")', { value: bool(true) });
      exprTest('has_key(#{a:1, b:2, c:3}, "d")', { value: bool(false) });
    });

    suite('index', () => {
      exprTest('index(["a","b","c"], "c")', { value: int(2) });
      exprTest('index(["a","b","c"], "k")', { value: int(-1) });
      exprTest('index(["A","C","D","C"], "C", 1)', { value: int(1) });
      exprTest('index(["A","C","D","C"], "C", 2)', { value: int(3) });
      exprTest('index(["A","C","D","C"], "C", -2)', { value: int(3) });
      exprTest('index(["A","C","D","C"], "C", 5)', { value: int(-1) });
    });

    suite('isnan/isinf', () => {
      exprTest('isnan(2.0 / 3.0)', { value: bool(false) });
      exprTest('isnan(0.0 / 0.0)', { value: bool(true) });

      exprTest('isinf(2.0 / 3.0)', { value: int(0) });
      exprTest('isinf(1.0 / 0.0)', { value: int(1) });
      exprTest('isinf(-1.0 / 0.0)', { value: int(-1) });
    });

    suite('join', () => {
      exprTest('join([1,2,3])', { value: str('123') });
      exprTest('join([1,2,3], ",")', { value: str('1,2,3') });
    });

    suite('len', () => {
      exprTest('len(12345)', { value: int(5) });
      exprTest('len(012345)', { value: int(4) });
      exprTest('len(-8)', { value: int(2) });
      exprTest('len("hello world!")', { value: int(12) });
      exprTest('len([5, 2, 3, 7])', { value: int(4) });
      exprTest('len(#{a:1, b:2, c:3})', { value: int(3) });
      exprTest('len(function("abs"))', { error: ErrorCode.InvalidTypeForLen });
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
      exprTest('range(2, -2, -2)', { display: '[2, 0, -2]' });
      exprTest('range(0)', { display: '[]' });
      exprTest('range(1, 10, 0)', { error: ErrorCode.StrideIsZero });
      exprTest('range(2, 0)', { error: ErrorCode.StartPastEnd });
      exprTest('range(0, 2, -1)', { error: ErrorCode.StartPastEnd });
    });

    // TODO: remove()

    suite('repeat', () => {
      exprTest('repeat(3, 5)', { display: '33333' });
      exprTest('repeat("abc", 3)', { display: 'abcabcabc' });
      exprTest('repeat("", 8)', { display: '' });
      exprTest('repeat([], 3)', { display: '[]' });
      exprTest('repeat([1,2], 3)', { display: '[1, 2, 1, 2, 1, 2]' });
      exprTest('repeat(range(2,6,2), 3)', { display: '[2, 4, 6, 2, 4, 6, 2, 4, 6]' });
      exprTest('repeat(1.0, 3)', { error: ErrorCode.UsingFloatAsAString });
    });

    suite('reverse', () => {
      exprTest('reverse([1, 2, 3])', { display: '[3, 2, 1]' });
      exprTest('reverse(0zABCDEF)', { display: '0zEFCDAB' });
    });

    suite('str2list', () => {
      exprTest('str2list("ABC")', { value: list([int(65), int(66), int(67)]) });
      exprTest('str2list("á")', { value: list([int(97), int(769)]) });
    });

    suite('string', () => {
      exprTest('string("")', { value: str('') });
      exprTest('string(123)', { value: str('123') });
      exprTest('string(123.0)', { value: str('123.0') });
      exprTest('string([1,2,3])', { value: str('[1, 2, 3]') });
      exprTest('string(#{a:1,b:2})', { value: str("{'a': 1, 'b': 2}") });
    });

    suite('strlen', () => {
      exprTest('strlen("")', { value: int(0) });
      exprTest('strlen("654321")', { value: int(6) });
      exprTest('strlen(654321)', { value: int(6) });
      exprTest('strlen([1,2,3])', { error: ErrorCode.UsingListAsAString });
    });

    suite('split', () => {
      exprTest('split("  a\t\tb    c  ")', { value: list([str('a'), str('b'), str('c')]) });
      exprTest('split("  a\t\tb    c  ", "", 1)', {
        value: list([str(''), str('a'), str('b'), str('c'), str('')]),
      });
      exprTest('split("a,b,c,", ",")', { value: list([str('a'), str('b'), str('c')]) });
      exprTest('split("a,b,c,", ",", v:true)', {
        value: list([str('a'), str('b'), str('c'), str('')]),
      });
    });

    suite('tr', () => {
      exprTest("tr('whatever', 'short', 'longer')", { error: ErrorCode.InvalidArgument475 });
      exprTest("tr('hello there', 'ht', 'HT')", { value: str('Hello THere') });
    });

    suite('trim', () => {
      exprTest("trim('  me  ')", { value: str('me') });
      exprTest("trim('  me  ', ' ', 0)", { value: str('me') });
      exprTest("trim('  me  ', ' ', 1)", { value: str('me  ') });
      exprTest("trim('  me  ', ' ', 2)", { value: str('  me') });
      // TODO: Test mask
    });

    suite('uniq', () => {
      // exprTest("uniq([1,2,1,1,1,'1',3,2,2,3])", { display: "[1, 2, 1, '1', 3, 2, 3]" });
      // TODO
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

      exprTest("sort(['A', 'c', 'B', 'a', 'C', 'b'])", {
        display: "['A', 'B', 'C', 'a', 'b', 'c']",
      });

      for (const func of ["'i'", "'1'", '1']) {
        exprTest(`sort(['A', 'c', 'B', 'a', 'C', 'b'], ${func})`, {
          display: "['A', 'a', 'B', 'b', 'c', 'C']",
        });
      }

      exprTest('sort([4,2,1,3,5])', { display: '[1, 2, 3, 4, 5]' });
      exprTest('sort([4,2,1,3,5], {x,y->x-y})', { display: '[1, 2, 3, 4, 5]' });
      exprTest('sort([4,2,1,3,5], {x,y->y-x})', { display: '[5, 4, 3, 2, 1]' });
      // TODO
    });
  });
});
