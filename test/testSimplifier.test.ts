import { Mode } from '../src/mode/mode';
import { newTest } from './testSimplifier';

/**
 * Tests of `newTest`'s Visual mode notation, where `[` and `]` surround the characters from the
 * anchor to the cursor and `|` goes just before the character the cursor is on.
 */
suite('newTest Visual mode notation', () => {
  suite('Visual', () => {
    newTest({
      title: 'One character',
      start: ['|abcd'],
      keysPressed: 'v',
      end: ['[|a]bcd'],
      endMode: Mode.Visual,
    });
    newTest({
      title: 'Forward',
      start: ['|abcd'],
      keysPressed: 'vl',
      end: ['[a|b]cd'],
      endMode: Mode.Visual,
    });
    newTest({
      title: 'Backward',
      start: ['a|bcd'],
      keysPressed: 'vh',
      end: ['[|ab]cd'],
      endMode: Mode.Visual,
    });
    newTest({
      // A one-character selection is always forward, even after moving back over the anchor
      title: 'One character, after moving back',
      start: ['ab|cd'],
      keysPressed: 'vhl',
      end: ['ab[|c]d'],
      endMode: Mode.Visual,
    });
    newTest({
      title: 'Forward across lines',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: 'vj',
      end: ['a[bcd', 'e|f]gh', 'ijkl'],
      endMode: Mode.Visual,
    });
    newTest({
      title: 'Backward across lines',
      start: ['abcd', 'e|fgh', 'ijkl'],
      keysPressed: 'vk',
      end: ['a[|bcd', 'ef]gh', 'ijkl'],
      endMode: Mode.Visual,
    });
    newTest({
      title: 'Empty line (selects the line break)',
      start: ['abc', '|', 'def'],
      keysPressed: 'v',
      end: ['abc', '[|', ']def'],
      endMode: Mode.Visual,
    });
    newTest({
      title: 'Empty document',
      start: ['|'],
      keysPressed: 'v',
      end: ['[|]'],
      endMode: Mode.Visual,
    });
  });

  suite('VisualLine', () => {
    newTest({
      title: 'One line',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: 'Vl',
      end: ['a[b|c]d', 'efgh', 'ijkl'],
      endMode: Mode.VisualLine,
    });
    newTest({
      title: 'Forward',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: 'Vj',
      end: ['a[bcd', 'e|f]gh', 'ijkl'],
      endMode: Mode.VisualLine,
    });
    newTest({
      title: 'Backward',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: 'Vjo',
      end: ['a[|bcd', 'ef]gh', 'ijkl'],
      endMode: Mode.VisualLine,
    });
    newTest({
      title: 'Empty line',
      start: ['abc', '|', 'def'],
      keysPressed: 'V',
      end: ['abc', '[|]', 'def'],
      endMode: Mode.VisualLine,
    });
  });

  suite('VisualBlock', () => {
    newTest({
      title: 'Forward',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: '<C-v>lj',
      end: ['a[bcd', 'ef|g]h', 'ijkl'],
      endMode: Mode.VisualBlock,
    });
    newTest({
      title: 'Cursor left of the anchor',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: '<C-v>hj',
      end: ['a[bcd', '|e]fgh', 'ijkl'],
      endMode: Mode.VisualBlock,
    });
    newTest({
      title: 'Backward',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: '<C-v>jo',
      end: ['a[|bcd', 'ef]gh', 'ijkl'],
      endMode: Mode.VisualBlock,
    });
    newTest({
      title: 'Cursor on a line break',
      start: ['a|bcd', 'efgh', 'ijkl'],
      keysPressed: '<C-v>j$',
      end: ['a[bcd', 'efgh|', ']ijkl'],
      endMode: Mode.VisualBlock,
    });
    newTest({
      title: 'Short line in the block',
      start: ['ab|cd', 'e', 'ijkl'],
      keysPressed: '<C-v>jj',
      end: ['ab[cd', 'e', 'ij|k]l'],
      endMode: Mode.VisualBlock,
    });
  });

  newTest({
    title: 'Steps can leave and enter Visual mode',
    start: ['|abcd', 'efgh', 'ijkl'],
    steps: [
      { keysPressed: 'vl', end: ['[a|b]cd', 'efgh', 'ijkl'], endMode: Mode.Visual },
      { keysPressed: '<Esc>', end: ['a|bcd', 'efgh', 'ijkl'] },
      { keysPressed: 'Vj', end: ['a[bcd', 'e|f]gh', 'ijkl'], endMode: Mode.VisualLine },
    ],
  });
});
