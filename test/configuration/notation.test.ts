import * as assert from 'assert';

import { Notation } from '../../src/configuration/notation';

suite('Notation', () => {
  test('Normalize', () => {
    const leaderKey = '//';
    const testCases = {
      '<cTrL+w>': '<C-w>',
      'cTrL+x': '<C-x>',
      'CtRl+y': '<C-y>',
      'c-z': '<C-z>',
      '<CmD+a>': '<D-a>',
      eScapE: '<Esc>',
      hOme: '<Home>',
      inSert: '<Insert>',
      eNd: '<End>',
      '<LeAder>': '//',
      LEaDer: '//',
      '<cR>': '\n',
      '<EnTeR>': '\n',
      '<space>': ' ',
      '<uP>': '<up>',
      '<Shift+Tab>': '<S-tab>',
    };

    for (const test in testCases) {
      if (testCases.hasOwnProperty(test)) {
        const expected = testCases[test];

        const actual = Notation.NormalizeKey(test, leaderKey);
        assert.strictEqual(actual, expected);
      }
    }
  });
});
