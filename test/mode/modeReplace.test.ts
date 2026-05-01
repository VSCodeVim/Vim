import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';

suite('Mode Replace', () => {
  newTest({
    title: 'Can activate with <Insert> from Insert mode',
    start: ['|'],
    keysPressed: 'ia<Insert>',
    end: ['a|'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can activate with R from Normal mode',
    start: ['123|456'],
    keysPressed: 'R',
    end: ['123|456'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle R',
    start: ['123|456'],
    keysPressed: 'Rab',
    end: ['123ab|6'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle R past current line',
    start: ['123|456'],
    keysPressed: 'Rabcd',
    end: ['123abcd|'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle R and exit Replace Mode',
    start: ['|123456'],
    keysPressed: 'Rabc<Esc>',
    end: ['ab|c456'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle R across lines',
    start: ['123|456', '789'],
    keysPressed: 'Rabcd\nefg',
    end: ['123abcd', 'efg|', '789'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle R across lines and exit Replace Mode',
    start: ['123|456', '789'],
    keysPressed: 'Rabcd\nefg<Esc>',
    end: ['123abcd', 'ef|g', '789'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle R with {count}',
    start: ['123|456', '789'],
    keysPressed: '3Rabc<Esc>',
    end: ['123abcabcab|c', '789'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle R with {count}',
    start: ['123|456', '789'],
    keysPressed: '3Rabc\ndef<Esc>',
    end: ['123abc', 'defabc', 'defabc', 'de|f', '789'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle backspace',
    start: ['123|456'],
    keysPressed: 'Rabc<BS><BS><BS>',
    end: ['123|456'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle tab',
    start: ['123|456'],
    keysPressed: 'R<tab>',
    end: ['123 |56'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle backspace',
    start: ['123|456'],
    keysPressed: 'Rabcd<BS><BS><BS><BS><BS>',
    end: ['12|3456'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle backspace',
    start: ['123|456'],
    keysPressed: 'R<BS>abc<BS><BS><BS>',
    end: ['12|3456'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle backspace across lines',
    start: ['123|456'],
    keysPressed: 'Rabcd\nef<BS><BS><BS><BS><BS>',
    end: ['123ab|6'],
    endMode: Mode.Replace,
  });

  newTest({
    title: '`<BS>` goes across EOL',
    start: ['123', '|456'],
    keysPressed: 'R<BS><BS><BS>X',
    end: ['1X|3', '456'],
    endMode: Mode.Replace,
  });

  newTest({
    title: '`<BS>` goes across EOL',
    start: ['123', '|456'],
    keysPressed: 'R<BS><BS><BS>X<BS>',
    end: ['1|23', '456'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle arrows',
    start: ['123|456'],
    keysPressed: 'Rabc<left><BS><BS>',
    end: ['123|abc'],
    endMode: Mode.Replace,
  });

  newTest({
    title: 'Can handle .',
    start: ['123|456', '123456'],
    keysPressed: 'Rabc<Esc>j0.',
    end: ['123abc', 'ab|c456'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle . across lines',
    start: ['123|456', '123456'],
    keysPressed: 'Rabc\ndef<Esc>j0.',
    end: ['123abc', 'def', 'abc', 'de|f'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Delete in replace mode',
    start: ['|123456'],
    keysPressed: 'Rabc<Del><Esc>',
    end: ['ab|c56'],
    endMode: Mode.Normal,
  });
});
