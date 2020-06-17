import * as assert from 'assert';

import { NumericString } from '../../src/common/number/numericString';

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
});
