import * as assert from 'assert';

import { Notation } from '../../src/configuration/notation';

suite('Notation', () => {
  test('Normalize', () => {
    let leaderKey = '//';
    let testCases = {
      '<cTrL+w>': '<C-w>',
      'cTrL+x': '<C-x>',
      'CtRl+y': '<C-y>',
      'c-z': '<C-z>',
      '<CmD+a>': '<D-a>',
      eScapE: '<Esc>',
      '<LeAder>': '//',
      LEaDer: '//',
      '<uP>': '<up>',
    };

    for (const test in testCases) {
      if (testCases.hasOwnProperty(test)) {
        let expected = testCases[test];

        let actual = Notation.NormalizeKey(test, leaderKey);
        assert.equal(actual, expected);
      }
    }
  });
});
