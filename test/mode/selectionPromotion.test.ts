import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Constraint regression suite for the handleSelectionChange Visual-promotion
// logic. The promotion path needs to fire on *external* selection-change
// events (e.g. expandLineSelection, smartSelect.grow, cursorRightSelect)
// while leaving routine Vim navigation untouched. The cases below exercise
// the navigation half — cursor motions and cursor-move VSCode commands that
// fire selection events but must NOT pull us into Visual mode.

suite('selection-promotion regression-guards', () => {
  setup(async () => {
    await setupWorkspace();
  });

  suite('Normal-mode motions stay in Normal (do not promote on Keyboard-kind events)', () => {
    newTest({
      title: 'j stays in Normal',
      start: ['ab|cd', 'efgh'],
      keysPressed: 'j',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'k stays in Normal',
      start: ['abcd', 'ef|gh'],
      keysPressed: 'k',
      end: ['ab|cd', 'efgh'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'l stays in Normal',
      start: ['a|bcd'],
      keysPressed: 'l',
      end: ['ab|cd'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'h stays in Normal',
      start: ['ab|cd'],
      keysPressed: 'h',
      end: ['a|bcd'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'w stays in Normal',
      start: ['hel|lo world'],
      keysPressed: 'w',
      end: ['hello |world'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'gg stays in Normal',
      start: ['line one', 'lin|e two'],
      keysPressed: 'gg',
      end: ['|line one', 'line two'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'G stays in Normal',
      start: ['lin|e one', 'line two'],
      keysPressed: 'G',
      end: ['line one', '|line two'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'unshifted <right> stays in Normal',
      start: ['a|bcd'],
      keysPressed: '<right>',
      end: ['ab|cd'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'unshifted <down> stays in Normal',
      start: ['ab|cd', 'efgh'],
      keysPressed: '<down>',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Normal,
    });
  });

  suite('Insert-mode arrows stay in Insert (no spurious Visual promotion)', () => {
    newTest({
      title: 'i + <right> stays in Insert',
      start: ['a|bcd'],
      keysPressed: 'i<right>',
      end: ['ab|cd'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'i + <down> stays in Insert',
      start: ['ab|cd', 'efgh'],
      keysPressed: 'i<down>',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Insert,
    });
  });

  suite('Cursor-only VSCode commands stay in Normal (cursorRight, cursorDown)', () => {
    newTest({
      title: 'cursorRight (non-select) stays in Normal',
      config: {
        normalModeKeyBindings: [{ before: ['<leader>', 'r'], commands: ['cursorRight'] }],
        leader: ' ',
      },
      start: ['a|bcd'],
      keysPressed: ' r',
      end: ['ab|cd'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'cursorDown (non-select) stays in Normal',
      config: {
        normalModeKeyBindings: [{ before: ['<leader>', 'd'], commands: ['cursorDown'] }],
        leader: ' ',
      },
      start: ['ab|cd', 'efgh'],
      keysPressed: ' d',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Normal,
    });
  });

  suite('Visual-mode motions stay in Visual (do not exit on internal Keyboard events)', () => {
    newTest({
      title: 'v then l stays in Visual',
      start: ['a|bcd'],
      keysPressed: 'vl',
      end: ['abc|d'], // logical col 2 + Visual fwd shift = col 3
      endMode: Mode.Visual,
    });

    newTest({
      title: 'v then j stays in Visual',
      start: ['ab|cd', 'efgh'],
      keysPressed: 'vj',
      end: ['abcd', 'efg|h'], // forward Visual fwd shift
      endMode: Mode.Visual,
    });

    newTest({
      title: 'v then w stays in Visual',
      start: ['hel|lo world'],
      keysPressed: 'vw',
      end: ['hello w|orld'], // word-begin at col 6, +1 shift
      endMode: Mode.Visual,
    });
  });
});
