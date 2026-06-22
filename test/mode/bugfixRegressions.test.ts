import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Spot-check tests for two pieces of state-tracking that have historically
// been bug-prone:
//
//   - `recordedState.count` should clear after each completed action so that
//     the next operator doesn't inherit a count from the previous one.
//   - `gv` should reselect the last Visual range, even when the buffer has
//     been modified since the original selection.
//
// Both behaviours are easy to break by accident in the cursor-shift / mode-
// transition plumbing; these tests pin them.

suite('state-tracking regressions', () => {
  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: 'count clears between actions: `2dwdw` deletes 3 words, not 4',
    start: ['|aaa bbb ccc ddd'],
    keysPressed: '2dwdw',
    end: ['|ddd'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'gv re-enters Visual at the last range',
    start: ['ab|cdef'],
    keysPressed: 'vlld<Esc>gv',
    end: ['abf|'],
    endMode: Mode.Visual,
  });
});
