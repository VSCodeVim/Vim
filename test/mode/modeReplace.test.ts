import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Replace', () => {
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'Can handle R',
    start: ['123|456'],
    keysPressed: 'Rab',
    end: ['123ab|6'],
  });

  newTest({
    title: 'Can handle R',
    start: ['123|456'],
    keysPressed: 'Rabcd',
    end: ['123abcd|'],
  });

  newTest({
    title: 'Can handle R and quit Replace Mode',
    start: ['|123456'],
    keysPressed: 'Rabc<Esc>',
    end: ['ab|c456'],
  });

  newTest({
    title: 'Can handle R across lines',
    start: ['123|456', '789'],
    keysPressed: 'Rabcd\nefg',
    end: ['123abcd', 'efg|', '789'],
  });

  newTest({
    title: 'Can handle R across lines and quit Replace Mode',
    start: ['123|456', '789'],
    keysPressed: 'Rabcd\nefg<Esc>',
    end: ['123abcd', 'ef|g', '789'],
  });

  newTest({
    title: 'Can handle R with {count}',
    start: ['123|456', '789'],
    keysPressed: '3Rabc\ndef<Esc>',
    end: ['123abc', 'defabc', 'defabc', 'de|f', '789'],
  });

  newTest({
    title: 'Can handle backspace',
    start: ['123|456'],
    keysPressed: 'Rabc<BS><BS><BS>',
    end: ['123|456'],
  });

  newTest({
    title: 'Can handle backspace',
    start: ['123|456'],
    keysPressed: 'Rabcd<BS><BS><BS><BS><BS>',
    end: ['12|3456'],
  });

  newTest({
    title: 'Can handle backspace across lines',
    start: ['123|456'],
    keysPressed: 'Rabcd\nef<BS><BS><BS><BS><BS>',
    end: ['123ab|6'],
  });

  newTest({
    title: 'Can handle arrows',
    start: ['123|456'],
    keysPressed: 'Rabc<left><BS><BS>',
    end: ['123|abc'],
  });

  newTest({
    title: 'Can handle .',
    start: ['123|456', '123456'],
    keysPressed: 'Rabc<Esc>j0.',
    end: ['123abc', 'ab|c456'],
  });

  newTest({
    title: 'Can handle . across lines',
    start: ['123|456', '123456'],
    keysPressed: 'Rabc\ndef<Esc>j0.',
    end: ['123abc', 'def', 'abc', 'de|f'],
  });
});
