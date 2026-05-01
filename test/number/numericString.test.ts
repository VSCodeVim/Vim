import * as assert from 'assert';

import { NumericString, NumericStringRadix } from '../../src/common/number/numericString';

suite('numeric string', () => {
  test('fails on non-string', () => {
    assert.strictEqual(undefined, NumericString.parse('hi'));
  });

  test('handles hex round trip', () => {
    const input = '0xa1';
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
    // run each assertion twice to make sure that regex state doesn't cause failures
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
  });

  test('handles hex with capitals round trip', () => {
    const input = '0xAb1';
    assert.strictEqual('0xab1', NumericString.parse(input)?.num.toString());
  });

  test('handles decimal round trip', () => {
    const input = '9';
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
  });

  test('handles octal trip', () => {
    const input = '07';
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
  });

  test('handles octal trip', () => {
    const input = '07';
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
    assert.strictEqual(input, NumericString.parse(input)?.num.toString());
  });

  test('handles decimal radix', () => {
    assert.strictEqual(NumericString.parse('07', NumericStringRadix.Dec)?.num.value, 7);
    assert.strictEqual(NumericString.parse('hi-07hello', NumericStringRadix.Dec)?.num.value, -7);
  });
});
