import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Regression-guards for the bundled bug fixes that PR #5842 shipped alongside
// the keymodel work, plus the structural change to
// `recordedState.count` clearing during the merge resolution.

suite('bug-fix regressions from #5842 / merge', () => {
  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: 'I1: count clears between actions — `2dw` then `dw` deletes 1 word, not 2',
    start: ['|aaa bbb ccc ddd'],
    keysPressed: '2dwdw',
    // 2dw deletes 'aaa bbb '; dw deletes 'ccc '; leaves 'ddd'
    end: ['|ddd'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'I2: gv re-enters Visual at last range',
    start: ['ab|cdef'],
    keysPressed: 'vlld<Esc>gv',
    // v at col 2; ll moves cursor to col 4; selection covers cols 2-4 = 'cde';
    // d deletes; back to Normal at col 2 (where 'f' now is). gv reselects last
    // visual range (anchor=2, stop=4). With the deletion, only 'abf' remains
    // (3 chars, cols 0-2); the saved stop is clamped to eol → cursor reported
    // at col 3 after Visual fwd shift.
    end: ['abf|'],
    endMode: Mode.Visual,
  });
});
