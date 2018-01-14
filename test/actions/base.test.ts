import * as assert from 'assert';

import * as base from '../../src/actions/base';

suite('base actions', () => {
  test('compare key presses', () => {
    let testCases: Array<[string[] | string[][], string[], boolean]> = [
      [['a'], ['a'], true],
      [[['a']], ['a'], true],
      [[['a'], ['b']], ['b'], true],
      [[['a'], ['b']], ['c'], false],
      [['a', 'b'], ['a', 'b'], true],
      [['a', 'b'], ['a', 'c'], false],
      [[['a', 'b'], ['c', 'd']], ['c', 'd'], true],
      [[''], ['a'], false],
      [['<Esc>'], ['<Esc>'], true],
    ];

    for (const test in testCases) {
      if (testCases.hasOwnProperty(test)) {
        let left = testCases[test][0];
        let right = testCases[test][1];
        let expected = testCases[test][2];

        let actual = base.compareKeypressSequence(left, right);
        assert.equal(actual, expected, `${left}. ${right}.`);
      }
    }
  });
});
