import { Configuration } from '../testConfiguration';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('smartQuotes plugin', () => {
  setup(async () => {
    const configuration = new Configuration();
    configuration.smartQuotes = true;
    await setupWorkspace(configuration, '.js');
  });

  teardown(cleanUpWorkspace);

  // test quotes types
  newTest({
    title: 'single quote - 1',
    start: ['|a "b" c \'d\' '],
    keysPressed: "di'",
    end: ['a "b" c \'|\' '],
  });
  newTest({
    title: 'single quote - 2',
    start: ['a "b" |c \'d\' '],
    keysPressed: "di'",
    end: ['a "b" c \'|\' '],
  });
  newTest({
    title: 'backtick - 1',
    start: ['|a "b" c `d` '],
    keysPressed: 'di`',
    end: ['a "b" c `|` '],
  });
  newTest({
    title: 'backtick - 2',
    start: ['a "b" |c `d` '],
    keysPressed: 'di`',
    end: ['a "b" c `|` '],
  });

  // test basic usage
  newTest({
    title: 'no quotes at all',
    start: ['|abcd'],
    keysPressed: 'di"',
    end: ['|abcd'],
  });
  newTest({
    title: 'single quote - 1',
    start: ['|a"b'],
    keysPressed: 'di"',
    end: ['|a"b'],
  });
  newTest({
    title: 'single quote - 2',
    start: ['a|"b'],
    keysPressed: 'di"',
    end: ['a|"b'],
  });
  newTest({
    title: 'single quote - 3',
    start: ['a"|b'],
    keysPressed: 'di"',
    end: ['a"|b'],
  });
  newTest({
    title: 'one quotes object - 1',
    start: ['|a "b" c'],
    keysPressed: 'di"',
    end: ['a "|" c'],
  });
  newTest({
    title: 'one quotes object - 2',
    start: ['a |"b" c'],
    keysPressed: 'di"',
    end: ['a "|" c'],
  });
  newTest({
    title: 'one quotes object - 3',
    start: ['a "|b" c'],
    keysPressed: 'di"',
    end: ['a "|" c'],
  });
  newTest({
    title: 'one quotes object - 4',
    start: ['a "b|" c'],
    keysPressed: 'di"',
    end: ['a "|" c'],
  });
  newTest({
    title: 'one quotes object - 5',
    start: ['a "b"| c'],
    keysPressed: 'di"',
    end: ['a "|" c'],
  });
  newTest({
    title: 'even quotes - 1',
    start: ['|a "b" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 2',
    start: ['a |"b" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 3',
    start: ['a "|b" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 4',
    start: ['a "b|" c "d" e '],
    keysPressed: 'di"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'even quotes - 5',
    start: ['a "b"| c "d" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 6',
    start: ['a "b" c |"d" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 7',
    start: ['a "b" c "|d" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 8',
    start: ['a "b" c "d|" e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'even quotes - 9',
    start: ['a "b" c "d"| e '],
    keysPressed: 'di"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'odd quotes - 1',
    start: ['|a "b" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 2',
    start: ['a |"b" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 3',
    start: ['a "|b" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 4',
    start: ['a "b|" c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'odd quotes - 5',
    start: ['a "b"| c "d" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 6',
    start: ['a "b" c |"d" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 7',
    start: ['a "b" c "|d" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 8',
    start: ['a "b" c "d|" e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'odd quotes - 9',
    start: ['a "b" c "d"| e " f'],
    keysPressed: 'di"',
    end: ['a "b" c "d"| e " f'],
  });
  newTest({
    title: 'odd quotes - 10',
    start: ['a "b" c "d" e |" f'],
    keysPressed: 'di"',
    end: ['a "b" c "d" e |" f'],
  });
  newTest({
    title: 'odd quotes - 11',
    start: ['a "b" c "d" e "| f'],
    keysPressed: 'di"',
    end: ['a "b" c "d" e "| f'],
  });
  newTest({
    title: 'no space between - 1',
    start: ['|"a""b"'],
    keysPressed: 'di"',
    end: ['"|""b"'],
  });
  newTest({
    title: 'no space between - 2',
    start: ['"|a""b"'],
    keysPressed: 'di"',
    end: ['"|""b"'],
  });
  newTest({
    title: 'no space between - 3',
    start: ['"a|""b"'],
    keysPressed: 'di"',
    end: ['"|""b"'],
  });
  newTest({
    title: 'no space between - 4',
    start: ['"a"|"b"'],
    keysPressed: 'di"',
    end: ['"a""|"'],
  });
  newTest({
    title: 'no space between - 5',
    start: ['"a""|b"'],
    keysPressed: 'di"',
    end: ['"a""|"'],
  });
  newTest({
    title: 'no space between - 6',
    start: ['"a""b|"'],
    keysPressed: 'di"',
    end: ['"a""|"'],
  });
  newTest({
    title: 'no space between - 7',
    start: ['"a""b"|'],
    keysPressed: 'di"',
    end: ['"a""|"'],
  });

  // test next usage
  newTest({
    title: 'next: no quotes at all',
    start: ['|abcd'],
    keysPressed: 'din"',
    end: ['|abcd'],
  });
  newTest({
    title: 'next: single quote - 1',
    start: ['|a"b'],
    keysPressed: 'din"',
    end: ['|a"b'],
  });
  newTest({
    title: 'next: single quote - 2',
    start: ['a|"b'],
    keysPressed: 'din"',
    end: ['a|"b'],
  });
  newTest({
    title: 'next: single quote - 3',
    start: ['a"|b'],
    keysPressed: 'din"',
    end: ['a"|b'],
  });
  newTest({
    title: 'next: one quotes object - 1',
    start: ['|a "b" c'],
    keysPressed: 'din"',
    end: ['a "|" c'],
  });
  newTest({
    title: 'next: one quotes object - 2',
    start: ['a |"b" c'],
    keysPressed: 'din"',
    end: ['a |"b" c'],
  });
  newTest({
    title: 'next: one quotes object - 3',
    start: ['a "|b" c'],
    keysPressed: 'din"',
    end: ['a "|b" c'],
  });
  newTest({
    title: 'next: one quotes object - 4',
    start: ['a "b|" c'],
    keysPressed: 'din"',
    end: ['a "b|" c'],
  });
  newTest({
    title: 'next: one quotes object - 5',
    start: ['a "b"| c'],
    keysPressed: 'din"',
    end: ['a "b"| c'],
  });
  newTest({
    title: 'next: even quotes - 1',
    start: ['|a "b" c "d" e '],
    keysPressed: 'din"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'next: even quotes - 2',
    start: ['a |"b" c "d" e '],
    keysPressed: 'din"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'next: even quotes - 3',
    start: ['a "|b" c "d" e '],
    keysPressed: 'din"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'next: even quotes - 4',
    start: ['a "b|" c "d" e '],
    keysPressed: 'din"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'next: even quotes - 5',
    start: ['a "b"| c "d" e '],
    keysPressed: 'din"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'next: even quotes - 6',
    start: ['a "b" c |"d" e '],
    keysPressed: 'din"',
    end: ['a "b" c |"d" e '],
  });
  newTest({
    title: 'next: even quotes - 7',
    start: ['a "b" c "|d" e '],
    keysPressed: 'din"',
    end: ['a "b" c "|d" e '],
  });
  newTest({
    title: 'next: even quotes - 8',
    start: ['a "b" c "d|" e '],
    keysPressed: 'din"',
    end: ['a "b" c "d|" e '],
  });
  newTest({
    title: 'next: even quotes - 9',
    start: ['a "b" c "d"| e '],
    keysPressed: 'din"',
    end: ['a "b" c "d"| e '],
  });
  newTest({
    title: 'next: odd quotes - 1',
    start: ['|a "b" c "d" e " f'],
    keysPressed: 'din"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 2',
    start: ['a |"b" c "d" e " f'],
    keysPressed: 'din"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 3',
    start: ['a "|b" c "d" e " f'],
    keysPressed: 'din"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 4',
    start: ['a "b|" c "d" e " f'],
    keysPressed: 'din"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 5',
    start: ['a "b"| c "d" e " f'],
    keysPressed: 'din"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 6',
    start: ['a "b" c |"d" e " f'],
    keysPressed: 'din"',
    end: ['a "b" c |"d" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 7',
    start: ['a "b" c "|d" e " f'],
    keysPressed: 'din"',
    end: ['a "b" c "|d" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 8',
    start: ['a "b" c "d|" e " f'],
    keysPressed: 'din"',
    end: ['a "b" c "d|" e " f'],
  });
  newTest({
    title: 'next: odd quotes - 9',
    start: ['a "b" c "d"| e " f'],
    keysPressed: 'din"',
    end: ['a "b" c "d"| e " f'],
  });
  newTest({
    title: 'next: odd quotes - 10',
    start: ['a "b" c "d" e |" f'],
    keysPressed: 'din"',
    end: ['a "b" c "d" e |" f'],
  });
  newTest({
    title: 'next: odd quotes - 11',
    start: ['a "b" c "d" e "| f'],
    keysPressed: 'din"',
    end: ['a "b" c "d" e "| f'],
  });
  newTest({
    title: 'next: no space between - 1',
    start: ['|"a""b"'],
    keysPressed: 'din"',
    end: ['"a""|"'],
  });
  newTest({
    title: 'next: no space between - 2',
    start: ['"|a""b"'],
    keysPressed: 'din"',
    end: ['"a""|"'],
  });
  newTest({
    title: 'next: no space between - 3',
    start: ['"a|""b"'],
    keysPressed: 'din"',
    end: ['"a""|"'],
  });
  newTest({
    title: 'next: no space between - 4',
    start: ['"a"|"b"'],
    keysPressed: 'din"',
    end: ['"a"|"b"'],
  });
  newTest({
    title: 'next: no space between - 5',
    start: ['"a""|b"'],
    keysPressed: 'din"',
    end: ['"a""|b"'],
  });
  newTest({
    title: 'next: no space between - 6',
    start: ['"a""b|"'],
    keysPressed: 'din"',
    end: ['"a""b|"'],
  });
  newTest({
    title: 'next: no space between - 7',
    start: ['"a""b"| '],
    keysPressed: 'din"',
    end: ['"a""b"| '],
  });

  // test last usage
  newTest({
    title: 'last: no quotes at all',
    start: ['|abcd'],
    keysPressed: 'dil"',
    end: ['|abcd'],
  });
  newTest({
    title: 'last: single quote - 1',
    start: ['|a"b'],
    keysPressed: 'dil"',
    end: ['|a"b'],
  });
  newTest({
    title: 'last: single quote - 2',
    start: ['a|"b'],
    keysPressed: 'dil"',
    end: ['a|"b'],
  });
  newTest({
    title: 'last: single quote - 3',
    start: ['a"|b'],
    keysPressed: 'dil"',
    end: ['a"|b'],
  });
  newTest({
    title: 'last: one quotes object - 1',
    start: ['|a "b" c'],
    keysPressed: 'dil"',
    end: ['|a "b" c'],
  });
  newTest({
    title: 'last: one quotes object - 2',
    start: ['a |"b" c'],
    keysPressed: 'dil"',
    end: ['a |"b" c'],
  });
  newTest({
    title: 'last: one quotes object - 3',
    start: ['a "|b" c'],
    keysPressed: 'dil"',
    end: ['a "|b" c'],
  });
  newTest({
    title: 'last: one quotes object - 4',
    start: ['a "b|" c'],
    keysPressed: 'dil"',
    end: ['a "b|" c'],
  });
  newTest({
    title: 'last: one quotes object - 5',
    start: ['a "b"| c'],
    keysPressed: 'dil"',
    end: ['a "|" c'],
  });
  newTest({
    title: 'last: even quotes - 1',
    start: ['|a "b" c "d" e '],
    keysPressed: 'dil"',
    end: ['|a "b" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 2',
    start: ['a |"b" c "d" e '],
    keysPressed: 'dil"',
    end: ['a |"b" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 3',
    start: ['a "|b" c "d" e '],
    keysPressed: 'dil"',
    end: ['a "|b" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 4',
    start: ['a "b|" c "d" e '],
    keysPressed: 'dil"',
    end: ['a "b|" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 5',
    start: ['a "b"| c "d" e '],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 6',
    start: ['a "b" c |"d" e '],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 7',
    start: ['a "b" c "|d" e '],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 8',
    start: ['a "b" c "d|" e '],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e '],
  });
  newTest({
    title: 'last: even quotes - 9',
    start: ['a "b" c "d"| e '],
    keysPressed: 'dil"',
    end: ['a "b" c "|" e '],
  });
  newTest({
    title: 'last: odd quotes - 1',
    start: ['|a "b" c "d" e " f'],
    keysPressed: 'dil"',
    end: ['|a "b" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 2',
    start: ['a |"b" c "d" e " f'],
    keysPressed: 'dil"',
    end: ['a |"b" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 3',
    start: ['a "|b" c "d" e " f'],
    keysPressed: 'dil"',
    end: ['a "|b" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 4',
    start: ['a "b|" c "d" e " f'],
    keysPressed: 'dil"',
    end: ['a "b|" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 5',
    start: ['a "b"| c "d" e " f'],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 6',
    start: ['a "b" c |"d" e " f'],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 7',
    start: ['a "b" c "|d" e " f'],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 8',
    start: ['a "b" c "d|" e " f'],
    keysPressed: 'dil"',
    end: ['a "|" c "d" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 9',
    start: ['a "b" c "d"| e " f'],
    keysPressed: 'dil"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 10',
    start: ['a "b" c "d" e |" f'],
    keysPressed: 'dil"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'last: odd quotes - 11',
    start: ['a "b" c "d" e "| f'],
    keysPressed: 'dil"',
    end: ['a "b" c "|" e " f'],
  });
  newTest({
    title: 'last: no space between - 1',
    start: ['|"a""b"'],
    keysPressed: 'dil"',
    end: ['|"a""b"'],
  });
  newTest({
    title: 'last: no space between - 2',
    start: ['"|a""b"'],
    keysPressed: 'dil"',
    end: ['"|a""b"'],
  });
  newTest({
    title: 'last: no space between - 3',
    start: ['"a|""b"'],
    keysPressed: 'dil"',
    end: ['"a|""b"'],
  });
  newTest({
    title: 'last: no space between - 4',
    start: ['"a"|"b"'],
    keysPressed: 'dil"',
    end: ['"|""b"'],
  });
  newTest({
    title: 'last: no space between - 5',
    start: ['"a""|b"'],
    keysPressed: 'dil"',
    end: ['"|""b"'],
  });
  newTest({
    title: 'last: no space between - 6',
    start: ['"a""b|"'],
    keysPressed: 'dil"',
    end: ['"|""b"'],
  });
  newTest({
    title: 'last: no space between - 7',
    start: ['"a""b"| '],
    keysPressed: 'dil"',
    end: ['"a""|" '],
  });
});
