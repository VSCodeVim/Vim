import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';

suite('Increment/decrement (<C-a> and <C-x>)', () => {
  newTest({
    title: 'can ctrl-a correctly behind a word',
    start: ['|one 9'],
    keysPressed: '<C-a>',
    end: ['one 1|0'],
  });

  newTest({
    title: 'can ctrl-a the right word (always the one AFTER the cursor)',
    start: ['1 |one 2'],
    keysPressed: '<C-a>',
    end: ['1 one |3'],
  });

  newTest({
    title: 'can ctrl-a on word',
    start: ['one -|11'],
    keysPressed: '<C-a>',
    end: ['one -1|0'],
  });

  newTest({
    title: 'can ctrl-a on a hex number',
    start: ['|0xf'],
    keysPressed: '<C-a>',
    end: ['0x1|0'],
  });

  newTest({
    title: 'can ctrl-a on decimal',
    start: ['1|1.123'],
    keysPressed: '<C-a>',
    end: ['1|2.123'],
  });

  newTest({
    title: 'can ctrl-a with numeric prefix',
    start: ['|-10'],
    keysPressed: '15<C-a>',
    end: ['|5'],
  });

  newTest({
    title: 'can ctrl-a on a decimal',
    start: ['-10.|1'],
    keysPressed: '10<C-a>',
    end: ['-10.1|1'],
  });

  newTest({
    title: 'can ctrl-a on an octal ',
    start: ['0|7'],
    keysPressed: '<C-a>',
    end: ['01|0'],
  });

  newTest({
    title: 'Correctly increments in the middle of a number',
    start: ['10|1'],
    keysPressed: '<C-a>',
    end: ['10|2'],
  });

  newTest({
    title: 'can ctrl-a on a hex number behind a word',
    start: ['|test0xf'],
    keysPressed: '<C-a>',
    end: ['test0x1|0'],
  });

  newTest({
    title: 'can ctrl-a distinguish fake hex number',
    start: ['|00xf'],
    keysPressed: '<C-a>',
    end: ['0|1xf'],
  });

  newTest({
    title: 'can ctrl-a can preserve uppercase',
    start: ['|0xDEAD'],
    keysPressed: '<C-a>',
    end: ['0xDEA|E'],
  });

  newTest({
    title: 'can ctrl-a can transform to lowercase',
    start: ['|0xDEAd'],
    keysPressed: '<C-a>',
    end: ['0xdea|e'],
  });

  newTest({
    title: 'can ctrl-a can transform to uppercase 1',
    start: ['|0xdeaD'],
    keysPressed: '<C-a>',
    end: ['0xDEA|E'],
  });

  newTest({
    title: 'can ctrl-a can transform to uppercase 2',
    start: ['|0xDeaD1'],
    keysPressed: '<C-a>',
    end: ['0xDEAD|2'],
  });

  newTest({
    title: 'can ctrl-a preserve leading zeros of octal',
    start: ['|000007'],
    keysPressed: '<C-a>',
    end: ['00001|0'],
  });

  newTest({
    title: 'can ctrl-a trim leading zeros of decimal',
    start: ['|000009'],
    keysPressed: '<C-a>',
    end: ['1|0'],
  });

  newTest({
    title: 'can ctrl-a process `-0x0` correctly',
    start: ['|-0x0'],
    keysPressed: '<C-a>',
    end: ['-0x|1'],
  });

  newTest({
    title: 'can ctrl-a regard `0` as decimal',
    start: ['|0'],
    keysPressed: '10<C-a>',
    end: ['1|0'],
  });

  newTest({
    title: 'can ctrl-a on octal ignore negative sign',
    start: ['|test-0116'],
    keysPressed: '<C-a>',
    end: ['test-011|7'],
  });

  newTest({
    title: 'can ctrl-a on octal ignore positive sign',
    start: ['|test+0116'],
    keysPressed: '<C-a>',
    end: ['test+011|7'],
  });

  newTest({
    title: 'can ctrl-a on hex number ignore negative sign',
    start: ['|test-0xf'],
    keysPressed: '<C-a>',
    end: ['test-0x1|0'],
  });

  newTest({
    title: 'can ctrl-a on hex number ignore positive sign',
    start: ['|test+0xf'],
    keysPressed: '<C-a>',
    end: ['test+0x1|0'],
  });

  newTest({
    title: 'can ctrl-x correctly behind a word',
    start: ['|one 10'],
    keysPressed: '<C-x>',
    end: ['one |9'],
  });

  newTest({
    title: 'can ctrl-a on an number with word before ',
    start: ['|test3'],
    keysPressed: '<C-a>',
    end: ['test|4'],
  });

  newTest({
    title: 'can ctrl-a on an number with word before and after ',
    start: ['|test3abc'],
    keysPressed: '<C-a>',
    end: ['test|4abc'],
  });

  newTest({
    title: 'can ctrl-x on a negative number with word before and after ',
    start: ['|test-2abc'],
    keysPressed: '<C-x><C-x><C-x>',
    end: ['test-|5abc'],
  });

  newTest({
    title: 'can ctrl-a properly on multiple lines',
    start: ['id: 1|,', 'someOtherId: 1'],
    keysPressed: '<C-a>',
    end: ['id: 1|,', 'someOtherId: 1'],
  });

  newTest({
    title: 'can <C-a> on word with multiple numbers (incrementing first number)',
    start: ['f|oo1bar2'],
    keysPressed: '<C-a>',
    end: ['foo|2bar2'],
  });

  newTest({
    title: 'can <C-a> on word with multiple numbers (incrementing second number)',
    start: ['foo1|bar2'],
    keysPressed: '<C-a>',
    end: ['foo1bar|3'],
  });

  newTest({
    title: 'can <C-a> on word with - in front of it',
    start: ['-fo|o2'],
    keysPressed: '<C-a>',
    end: ['-foo|3'],
  });

  newTest({
    title: '<C-a> in visual mode',
    start: ['9 9 9', '9| 9 9', '9 9 9', '9 9 9', '9 9 9'],
    keysPressed: 'vjj3<C-a>',
    end: ['9 9 9', '9| 12 9', '12 9 9', '12 9 9', '9 9 9'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-a> in visual line mode',
    start: ['9 9 9', '9| 9 9', '9 9 9', '9 9 9', '9 9 9'],
    keysPressed: 'Vjj3<C-a>',
    end: ['9 9 9', '|12 9 9', '12 9 9', '12 9 9', '9 9 9'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-a> in visual block mode',
    start: ['9 9 9', '9 |9 9', '9 9 9', '9 9 9', '9 9 9'],
    keysPressed: '<C-v>jj3<C-a>',
    end: ['9 9 9', '9 |12 9', '9 12 9', '9 12 9', '9 9 9'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-a> in visual block mode does not go past selection',
    start: ['9 9 9', '9| 9 9', '9 9 9', '9 9 9', '9 9 9'],
    keysPressed: '<C-v>jj3<C-a>',
    end: ['9 9 9', '9| 9 9', '9 9 9', '9 9 9', '9 9 9'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'g<C-a> in visual mode',
    start: ['9 9 9', '9| 9 9', '9 9 9', '9 9 9', '9 9 9'],
    keysPressed: 'vjj3g<C-a>',
    end: ['9 9 9', '9| 12 9', '15 9 9', '18 9 9', '9 9 9'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'g<C-a> in visual line mode',
    start: ['9 9 9', '9| 9 9', '9 9 9', '9 9 9', '9 9 9'],
    keysPressed: 'Vjj3g<C-a>',
    end: ['9 9 9', '|12 9 9', '15 9 9', '18 9 9', '9 9 9'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'g<C-a> in visual block mode',
    start: ['9 9 9', '9 |9 9', '9 9 9', '9 9 9', '9 9 9'],
    keysPressed: '<C-v>jj3g<C-a>',
    end: ['9 9 9', '9 |12 9', '9 15 9', '9 18 9', '9 9 9'],
    endMode: Mode.Normal,
  });
});
