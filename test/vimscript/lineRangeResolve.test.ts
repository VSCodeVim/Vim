import { strict as assert } from 'assert';
import { LineRange } from '../../src/vimscript/lineRange';
import { ITestObject, testIt } from '../testSimplifier';
import { setupWorkspace } from '../testUtils';

function resolveTest(input: ITestObject & { lineRanges: Record<string, [number, number]> }) {
  suite(input.title, () => {
    for (const lineRange in input.lineRanges) {
      if (lineRange in input.lineRanges) {
        test(lineRange, async () => {
          const modeHandler = await testIt(input);
          assert.deepStrictEqual(
            LineRange.parser.tryParse(lineRange).resolve(modeHandler.vimState),
            {
              start: input.lineRanges[lineRange][0],
              end: input.lineRanges[lineRange][1],
            },
          );
        });
      }
    }
  });
}

suite('LineRange resolving', () => {
  setup(async () => {
    await setupWorkspace();
  });

  resolveTest({
    title: 'Basic',
    start: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    keysPressed: '',
    end: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    lineRanges: {
      '0': [0, 0],
      '1': [0, 0],
      '2': [1, 1],
      '.': [2, 2],
      $: [5, 5],
      '%': [0, 5],
    },
  });

  resolveTest({
    title: 'Marks',
    start: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    keysPressed: 'ma' + 'j' + 'mB' + 'j',
    end: ['one', 'two', 'three', 'four', 'fi|ve', 'six'],
    lineRanges: {
      "'a": [2, 2],
      "'B": [3, 3],
    },
  });

  resolveTest({
    title: 'Last visual selection',
    start: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    keysPressed: 'v' + 'j' + 'j' + '<Esc>',
    end: ['one', 'two', 'three', 'four', 'fi|ve', 'six'],
    lineRanges: {
      // TODO: *,4 is not a valid range
      '*': [2, 4],
      "'<,'>": [2, 4],
      '1,*': [2, 4],
      '1;*': [2, 4],
    },
  });

  resolveTest({
    title: 'Offsets',
    start: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    keysPressed: '',
    end: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    lineRanges: {
      '+': [3, 3],
      '-': [1, 1],
      '5+': [5, 5],
      '5++': [6, 6],
      '5+2': [6, 6],
      '5-': [3, 3],
      '5--': [2, 2],
      '5-2': [2, 2],
      '5+-': [4, 4],
      '5+-2': [3, 3],
      '5+2-': [5, 5],
      '5+2-2': [4, 4],
    },
  });

  resolveTest({
    title: 'Comma vs. Semicolon',
    start: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    keysPressed: '',
    end: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    lineRanges: {
      '2,.': [1, 2],
      '2;.': [1, 1],
      '.+1,.+2': [3, 4],
      '.+1;.+2': [3, 5],
    },
  });

  resolveTest({
    title: '% used as start or end',
    start: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    keysPressed: '',
    end: ['one', 'two', 'th|ree', 'four', 'five', 'six'],
    lineRanges: {
      '%,%': [0, 5],
      '4,%': [0, 5],
      '%,4': [3, 5],
    },
  });

  resolveTest({
    title: 'Explicit pattern (forward)',
    start: ['ap|ple', 'banana', 'carrot', 'dragonfruit', 'eggplant'],
    keysPressed: '',
    end: ['ap|ple', 'banana', 'carrot', 'dragonfruit', 'eggplant'],
    lineRanges: {
      '/carrot': [2, 2],
      '/carrot/': [2, 2],
      '/carrot/,/dragonfruit': [2, 3],
      '/carrot/,/dragonfruit/': [2, 3],
      '/(an){2}/,/[^a]g/': [1, 4],
    },
  });

  resolveTest({
    title: 'Last searched pattern',
    start: ['apple', 'banana', '|carrot', 'dragonfruit', 'eggplant'],
    keysPressed: '/n\n',
    end: ['apple', 'banana', 'carrot', 'drago|nfruit', 'eggplant'],
    lineRanges: {
      '\\?,\\/': [1, 4],
    },
  });

  resolveTest({
    title: 'Last substitute pattern',
    start: ['apple', 'ba|nana', 'carrot', 'dragonfruit', 'eggplant'],
    keysPressed: ':s/gonf/x\n',
    end: ['apple', 'ba|nana', 'carrot', 'dragonfruit', 'eggplant'],
    lineRanges: {
      '\\&': [3, 3],
    },
  });
});
