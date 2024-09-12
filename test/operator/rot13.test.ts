import * as assert from 'assert';

import { ROT13Operator } from '../../src/actions/operator';
import { newTest } from '../testSimplifier';

suite('rot13 operator', () => {
  test('rot13() unit test', () => {
    const testCases = [
      ['abcdefghijklmnopqrstuvwxyz', 'nopqrstuvwxyzabcdefghijklm'],
      ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'NOPQRSTUVWXYZABCDEFGHIJKLM'],
      ['!@#$%^&*()', '!@#$%^&*()'],
      ['âéü', 'âéü'],
    ];
    for (const [input, output] of testCases) {
      assert.strictEqual(ROT13Operator.rot13(input), output);
    }
  });

  newTest({
    title: 'g?j works',
    start: ['a|bc', 'def', 'ghi'],
    keysPressed: 'g?j',
    end: ['n|op', 'qrs', 'ghi'],
  });

  newTest({
    title: 'g? in visual mode works',
    start: ['a|bc', 'def', 'ghi'],
    keysPressed: 'vj$g?',
    end: ['a|op', 'qrs', 'ghi'],
  });

  newTest({
    title: 'g? in visual line mode works',
    start: ['a|bc', 'def', 'ghi'],
    keysPressed: 'Vj$g?',
    end: ['|nop', 'qrs', 'ghi'],
  });

  newTest({
    title: 'g? in visual block mode works',
    start: ['a|bc', 'def', 'ghi'],
    keysPressed: '<C-v>j$g?',
    end: ['a|op', 'drs', 'ghi'],
  });
});
