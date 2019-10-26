import * as assert from 'assert';

import { NumericString } from '../../src/common/number/numericString';

suite('numeric string', () => {
  test('fails on non-string', () => {
    assert.strictEqual(null, NumericString.parse('hi'));
  });

  test('handles hex round trip', () => {
    const input = '0xa1';
    assert.strictEqual(input, NumericString.parse(input)!.toString());
  });

  test('handles decimal round trip', () => {
    const input = '9';
    assert.strictEqual(input, NumericString.parse(input)!.toString());
  });

  test('handles octal trip', () => {
    const input = '07';
    assert.strictEqual(input, NumericString.parse(input)!.toString());
  });
});
