import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Negative regression suite for `handleSelectionChange`'s Visual-promotion
// logic. The promotion path needs to fire on external selection events
// (covered by `issue2224.test.ts`) WITHOUT pulling routine Vim navigation
// or cursor-only VSCode commands into Visual. These tests pin the latter:
// every motion below produces an empty selection (anchor === active) and
// must therefore NOT trigger Visual promotion.

suite('selection promotion: navigation must not enter Visual', () => {
  setup(async () => {
    await setupWorkspace();
  });

  suite('Normal-mode motions stay in Normal', () => {
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

  suite('Insert-mode arrows stay in Insert', () => {
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

  suite('cursor-only VSCode commands stay in Normal', () => {
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

  suite('Visual-mode motions stay in Visual', () => {
    newTest({
      title: 'v then l stays in Visual',
      start: ['a|bcd'],
      keysPressed: 'vl',
      end: ['abc|d'],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'v then j stays in Visual',
      start: ['ab|cd', 'efgh'],
      keysPressed: 'vj',
      end: ['abcd', 'efg|h'],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'v then w stays in Visual',
      start: ['hel|lo world'],
      keysPressed: 'vw',
      end: ['hello w|orld'],
      endMode: Mode.Visual,
    });
  });
});
