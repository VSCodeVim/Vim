import { newTest } from '../testSimplifier';
import { setupWorkspace } from '../testUtils';

suite('smartQuotes plugin', () => {
  suite('smartQuotes.breakThroughLines = false', () => {
    suiteSetup(async () => {
      await setupWorkspace({
        config: {
          targets: {
            enable: true,
            bracketObjects: { enable: true },
            smartQuotes: {
              enable: true,
              breakThroughLines: false,
              aIncludesSurroundingSpaces: true,
            },
          },
        },
        fileExtension: '.js',
      });
    });

    // test quotes types
    newTest({
      title: 'single quote - 1',
      start: ['|aaa "bbb" c \'d\' '],
      keysPressed: "di'",
      end: ['aaa "bbb" c \'|\' '],
    });
    newTest({
      title: 'single quote - 2',
      start: ['aaa "bbb" |c \'d\' '],
      keysPressed: "di'",
      end: ['aaa "bbb" c \'|\' '],
    });
    newTest({
      title: 'backtick - 1',
      start: ['|aaa "bbb" c `d` '],
      keysPressed: 'di`',
      end: ['aaa "bbb" c `|` '],
    });
    newTest({
      title: 'backtick - 2',
      start: ['aaa "bbb" |c `d` '],
      keysPressed: 'di`',
      end: ['aaa "bbb" c `|` '],
    });
    newTest({
      title: 'any-quote - 1',
      start: ['|  \'aaa\' "bbb" c `d` '],
      keysPressed: 'diq',
      end: ['  \'|\' "bbb" c `d` '],
    });
    newTest({
      title: 'any-quote - 2',
      start: ['  \'aaa\'| "bbb" c `d` '],
      keysPressed: 'diq',
      end: ['  \'aaa\' "|" c `d` '],
    });
    newTest({
      title: 'any-quote - 3',
      start: ['  \'aaa\' "bbb" |c `d` '],
      keysPressed: 'diq',
      end: ['  \'aaa\' "bbb" c `|` '],
    });
    // test basic usage
    newTest({
      title: 'no quotes at all',
      start: ['|aaabcd'],
      keysPressed: 'di"',
      end: ['|aaabcd'],
    });
    newTest({
      title: 'single quote - 1',
      start: ['|aaa"b'],
      keysPressed: 'di"',
      end: ['|aaa"b'],
    });
    newTest({
      title: 'single quote - 2',
      start: ['aaa|"b'],
      keysPressed: 'di"',
      end: ['aaa|"b'],
    });
    newTest({
      title: 'single quote - 3',
      start: ['aaa"|b'],
      keysPressed: 'di"',
      end: ['aaa"|b'],
    });
    newTest({
      title: 'one quotes object - 1',
      start: ['|aaa "bbb" c'],
      keysPressed: 'di"',
      end: ['aaa "|" c'],
    });
    newTest({
      title: 'one quotes object - 2',
      start: ['aaa |"bbb" c'],
      keysPressed: 'di"',
      end: ['aaa "|" c'],
    });
    newTest({
      title: 'one quotes object - 3',
      start: ['aaa "|bbb" c'],
      keysPressed: 'di"',
      end: ['aaa "|" c'],
    });
    newTest({
      title: 'one quotes object - 4',
      start: ['aaa "bbb|" c'],
      keysPressed: 'di"',
      end: ['aaa "|" c'],
    });
    newTest({
      title: 'one quotes object - 5',
      start: ['aaa "bbb"| c'],
      keysPressed: 'di"',
      end: ['aaa "|" c'],
    });
    newTest({
      title: 'even quotes - 1',
      start: ['|aaa "bbb" c "d" e '],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'even quotes - 2',
      start: ['aaa |"bbb" c "d" e '],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'even quotes - 3',
      start: ['aaa "|bbb" c "d" e '],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'even quotes - 4',
      start: ['aaa "bbb|" c "d" e '],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'even quotes - 5',
      start: ['aaa "bbb"| c "d" e '],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'even quotes - 6',
      start: ['aaa "bbb" c |"d" e '],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'even quotes - 7',
      start: ['aaa "bbb" c "|d" e '],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'even quotes - 8',
      start: ['aaa "bbb" c "d|" e '],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'even quotes - 9',
      start: ['aaa "bbb" c "d"| e '],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'odd quotes - 1',
      start: ['|aaa "bbb" c "d" e " f'],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'odd quotes - 2',
      start: ['aaa |"bbb" c "d" e " f'],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'odd quotes - 3',
      start: ['aaa "|bbb" c "d" e " f'],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'odd quotes - 4',
      start: ['aaa "bbb|" c "d" e " f'],
      keysPressed: 'di"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'odd quotes - 5',
      start: ['aaa "bbb"| c "d" e " f'],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'odd quotes - 6',
      start: ['aaa "bbb" c |"d" e " f'],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'odd quotes - 7',
      start: ['aaa "bbb" c "|d" e " f'],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'odd quotes - 8',
      start: ['aaa "bbb" c "d|" e " f'],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'odd quotes - 9',
      start: ['aaa "bbb" c "d"| e " f'],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "d"| e " f'],
    });
    newTest({
      title: 'odd quotes - 10',
      start: ['aaa "bbb" c "d" e |" f'],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "d" e |" f'],
    });
    newTest({
      title: 'odd quotes - 11',
      start: ['aaa "bbb" c "d" e "| f'],
      keysPressed: 'di"',
      end: ['aaa "bbb" c "d" e "| f'],
    });
    newTest({
      title: 'no space between - 1',
      start: ['|"a""bbb"'],
      keysPressed: 'di"',
      end: ['"|""bbb"'],
    });
    newTest({
      title: 'no space between - 2',
      start: ['"|a""bbb"'],
      keysPressed: 'di"',
      end: ['"|""bbb"'],
    });
    newTest({
      title: 'no space between - 3',
      start: ['"a|""bbb"'],
      keysPressed: 'di"',
      end: ['"|""bbb"'],
    });
    newTest({
      title: 'no space between - 4',
      start: ['"a"|"bbb"'],
      keysPressed: 'di"',
      end: ['"a""|"'],
    });
    newTest({
      title: 'no space between - 5',
      start: ['"a""|bbb"'],
      keysPressed: 'di"',
      end: ['"a""|"'],
    });
    newTest({
      title: 'no space between - 6',
      start: ['"a""bbb|"'],
      keysPressed: 'di"',
      end: ['"a""|"'],
    });
    newTest({
      title: 'no space between - 7',
      start: ['"a""bbb"| '],
      keysPressed: 'di"',
      end: ['"a""|" '],
    });
    // test next usage
    newTest({
      title: 'next: no quotes at all',
      start: ['|aaabcd'],
      keysPressed: 'din"',
      end: ['|aaabcd'],
    });
    newTest({
      title: 'next: single quote - 1',
      start: ['|aaa"b'],
      keysPressed: 'din"',
      end: ['|aaa"b'],
    });
    newTest({
      title: 'next: single quote - 2',
      start: ['aaa|"b'],
      keysPressed: 'din"',
      end: ['aaa|"b'],
    });
    newTest({
      title: 'next: single quote - 3',
      start: ['aaa"|b'],
      keysPressed: 'din"',
      end: ['aaa"|b'],
    });
    newTest({
      title: 'next: one quotes object - 1',
      start: ['|aaa "bbb" c'],
      keysPressed: 'din"',
      end: ['aaa "|" c'],
    });
    newTest({
      title: 'next: one quotes object - 2',
      start: ['aaa |"bbb" c'],
      keysPressed: 'din"',
      end: ['aaa |"bbb" c'],
    });
    newTest({
      title: 'next: one quotes object - 3',
      start: ['aaa "|bbb" c'],
      keysPressed: 'din"',
      end: ['aaa "|bbb" c'],
    });
    newTest({
      title: 'next: one quotes object - 4',
      start: ['aaa "bbb|" c'],
      keysPressed: 'din"',
      end: ['aaa "bbb|" c'],
    });
    newTest({
      title: 'next: one quotes object - 5',
      start: ['aaa "bbb"| c'],
      keysPressed: 'din"',
      end: ['aaa "bbb"| c'],
    });
    newTest({
      title: 'next: even quotes - 1',
      start: ['|aaa "bbb" c "d" e '],
      keysPressed: 'din"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'next: even quotes - 2',
      start: ['aaa |"bbb" c "d" e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'next: even quotes - 3',
      start: ['aaa "|bbb" c "d" e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'next: even quotes - 4',
      start: ['aaa "bbb|" c "d" e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'next: even quotes - 5',
      start: ['aaa "bbb"| c "d" e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'next: even quotes - 6',
      start: ['aaa "bbb" c |"d" e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c |"d" e '],
    });
    newTest({
      title: 'next: even quotes - 7',
      start: ['aaa "bbb" c "|d" e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|d" e '],
    });
    newTest({
      title: 'next: even quotes - 8',
      start: ['aaa "bbb" c "d|" e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "d|" e '],
    });
    newTest({
      title: 'next: even quotes - 9',
      start: ['aaa "bbb" c "d"| e '],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "d"| e '],
    });
    newTest({
      title: 'next: odd quotes - 1',
      start: ['|aaa "bbb" c "d" e " f'],
      keysPressed: 'din"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 2',
      start: ['aaa |"bbb" c "d" e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 3',
      start: ['aaa "|bbb" c "d" e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 4',
      start: ['aaa "bbb|" c "d" e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 5',
      start: ['aaa "bbb"| c "d" e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 6',
      start: ['aaa "bbb" c |"d" e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c |"d" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 7',
      start: ['aaa "bbb" c "|d" e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "|d" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 8',
      start: ['aaa "bbb" c "d|" e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "d|" e " f'],
    });
    newTest({
      title: 'next: odd quotes - 9',
      start: ['aaa "bbb" c "d"| e " f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "d"| e " f'],
    });
    newTest({
      title: 'next: odd quotes - 10',
      start: ['aaa "bbb" c "d" e |" f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "d" e |" f'],
    });
    newTest({
      title: 'next: odd quotes - 11',
      start: ['aaa "bbb" c "d" e "| f'],
      keysPressed: 'din"',
      end: ['aaa "bbb" c "d" e "| f'],
    });
    newTest({
      title: 'next: no space between - 1',
      start: ['|"a""bbb"'],
      keysPressed: 'din"',
      end: ['"a""|"'],
    });
    newTest({
      title: 'next: no space between - 2',
      start: ['"|a""bbb"'],
      keysPressed: 'din"',
      end: ['"a""|"'],
    });
    newTest({
      title: 'next: no space between - 3',
      start: ['"a|""bbb"'],
      keysPressed: 'din"',
      end: ['"a""|"'],
    });
    newTest({
      title: 'next: no space between - 4',
      start: ['"a"|"bbb"'],
      keysPressed: 'din"',
      end: ['"a"|"bbb"'],
    });
    newTest({
      title: 'next: no space between - 5',
      start: ['"a""|bbb"'],
      keysPressed: 'din"',
      end: ['"a""|bbb"'],
    });
    newTest({
      title: 'next: no space between - 6',
      start: ['"a""bbb|"'],
      keysPressed: 'din"',
      end: ['"a""bbb|"'],
    });
    newTest({
      title: 'next: no space between - 7',
      start: ['"a""bbb"| '],
      keysPressed: 'din"',
      end: ['"a""bbb"| '],
    });
    // test last usage
    newTest({
      title: 'last: no quotes at all',
      start: ['|aaabcd'],
      keysPressed: 'dil"',
      end: ['|aaabcd'],
    });
    newTest({
      title: 'last: single quote - 1',
      start: ['|aaa"b'],
      keysPressed: 'dil"',
      end: ['|aaa"b'],
    });
    newTest({
      title: 'last: single quote - 2',
      start: ['aaa|"b'],
      keysPressed: 'dil"',
      end: ['aaa|"b'],
    });
    newTest({
      title: 'last: single quote - 3',
      start: ['aaa"|b'],
      keysPressed: 'dil"',
      end: ['aaa"|b'],
    });
    newTest({
      title: 'last: one quotes object - 1',
      start: ['|aaa "bbb" c'],
      keysPressed: 'dil"',
      end: ['|aaa "bbb" c'],
    });
    newTest({
      title: 'last: one quotes object - 2',
      start: ['aaa |"bbb" c'],
      keysPressed: 'dil"',
      end: ['aaa |"bbb" c'],
    });
    newTest({
      title: 'last: one quotes object - 3',
      start: ['aaa "|bbb" c'],
      keysPressed: 'dil"',
      end: ['aaa "|bbb" c'],
    });
    newTest({
      title: 'last: one quotes object - 4',
      start: ['aaa "bbb|" c'],
      keysPressed: 'dil"',
      end: ['aaa "bbb|" c'],
    });
    newTest({
      title: 'last: one quotes object - 5',
      start: ['aaa "bbb"| c'],
      keysPressed: 'dil"',
      end: ['aaa "|" c'],
    });
    newTest({
      title: 'last: even quotes - 1',
      start: ['|aaa "bbb" c "d" e '],
      keysPressed: 'dil"',
      end: ['|aaa "bbb" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 2',
      start: ['aaa |"bbb" c "d" e '],
      keysPressed: 'dil"',
      end: ['aaa |"bbb" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 3',
      start: ['aaa "|bbb" c "d" e '],
      keysPressed: 'dil"',
      end: ['aaa "|bbb" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 4',
      start: ['aaa "bbb|" c "d" e '],
      keysPressed: 'dil"',
      end: ['aaa "bbb|" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 5',
      start: ['aaa "bbb"| c "d" e '],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 6',
      start: ['aaa "bbb" c |"d" e '],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 7',
      start: ['aaa "bbb" c "|d" e '],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 8',
      start: ['aaa "bbb" c "d|" e '],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e '],
    });
    newTest({
      title: 'last: even quotes - 9',
      start: ['aaa "bbb" c "d"| e '],
      keysPressed: 'dil"',
      end: ['aaa "bbb" c "|" e '],
    });
    newTest({
      title: 'last: odd quotes - 1',
      start: ['|aaa "bbb" c "d" e " f'],
      keysPressed: 'dil"',
      end: ['|aaa "bbb" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 2',
      start: ['aaa |"bbb" c "d" e " f'],
      keysPressed: 'dil"',
      end: ['aaa |"bbb" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 3',
      start: ['aaa "|bbb" c "d" e " f'],
      keysPressed: 'dil"',
      end: ['aaa "|bbb" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 4',
      start: ['aaa "bbb|" c "d" e " f'],
      keysPressed: 'dil"',
      end: ['aaa "bbb|" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 5',
      start: ['aaa "bbb"| c "d" e " f'],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 6',
      start: ['aaa "bbb" c |"d" e " f'],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 7',
      start: ['aaa "bbb" c "|d" e " f'],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 8',
      start: ['aaa "bbb" c "d|" e " f'],
      keysPressed: 'dil"',
      end: ['aaa "|" c "d" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 9',
      start: ['aaa "bbb" c "d"| e " f'],
      keysPressed: 'dil"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 10',
      start: ['aaa "bbb" c "d" e |" f'],
      keysPressed: 'dil"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'last: odd quotes - 11',
      start: ['aaa "bbb" c "d" e "| f'],
      keysPressed: 'dil"',
      end: ['aaa "bbb" c "|" e " f'],
    });
    newTest({
      title: 'last: no space between - 1',
      start: ['|"a""bbb"'],
      keysPressed: 'dil"',
      end: ['|"a""bbb"'],
    });
    newTest({
      title: 'last: no space between - 2',
      start: ['"|a""bbb"'],
      keysPressed: 'dil"',
      end: ['"|a""bbb"'],
    });
    newTest({
      title: 'last: no space between - 3',
      start: ['"a|""bbb"'],
      keysPressed: 'dil"',
      end: ['"a|""bbb"'],
    });
    newTest({
      title: 'last: no space between - 4',
      start: ['"a"|"bbb"'],
      keysPressed: 'dil"',
      end: ['"|""bbb"'],
    });
    newTest({
      title: 'last: no space between - 5',
      start: ['"a""|bbb"'],
      keysPressed: 'dil"',
      end: ['"|""bbb"'],
    });
    newTest({
      title: 'last: no space between - 6',
      start: ['"a""bbb|"'],
      keysPressed: 'dil"',
      end: ['"|""bbb"'],
    });
    newTest({
      title: 'last: no space between - 7',
      start: ['"a""bbb"| '],
      keysPressed: 'dil"',
      end: ['"a""|" '],
    });
  });

  suite('smartQuotes.breakThroughLines = true', () => {
    suiteSetup(async () => {
      await setupWorkspace({
        config: {
          targets: {
            enable: true,
            bracketObjects: { enable: true },
            smartQuotes: {
              enable: true,
              breakThroughLines: true,
              aIncludesSurroundingSpaces: true,
            },
          },
        },
        fileExtension: '.js',
      });
    });

    // test next
    newTest({
      title: 'next: should go next line - 1',
      start: [
        'aaa "bbb" c', //
        'd |"e" f', //
        'g "h" k',
      ],
      keysPressed: 'din"',
      end: [
        'aaa "bbb" c', //
        'd "e" f', //
        'g "|" k',
      ],
    });
    newTest({
      title: 'next: should go next line - 2',
      start: [
        'aaa "bbb" c', //
        'd "|e" f', //
        'g "h" k',
      ],
      keysPressed: 'din"',
      end: [
        'aaa "bbb" c', //
        'd "e" f', //
        'g "|" k',
      ],
    });
    newTest({
      title: 'next: should go next line - 3',
      start: [
        'aaa "bbb" c', //
        'd "e|" f', //
        'g "h" k',
      ],
      keysPressed: 'din"',
      end: [
        'aaa "bbb" c', //
        'd "e" f', //
        'g "|" k',
      ],
    });
    newTest({
      title: 'next: should go next line - 4',
      start: [
        'aaa "bbb" c', //
        'd "e"| f', //
        'g "h" k',
      ],
      keysPressed: 'din"',
      end: [
        'aaa "bbb" c', //
        'd "e" f', //
        'g "|" k',
      ],
    });
    newTest({
      title: 'next: should not go next line - 1',
      start: [
        'aaa "bbb" c', //
        'd| "e" f', //
        'g "h" k',
      ],
      keysPressed: 'din"',
      end: [
        'aaa "bbb" c', //
        'd "|" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'next: should not go next line - 2',
      start: [
        'aaa "bbb" c', //
        'd "e" f', //
        'g |"h" k',
      ],
      keysPressed: 'din"',
      end: [
        'aaa "bbb" c', //
        'd "e" f', //
        'g |"h" k',
      ],
    });
    newTest({
      title: 'next: should do nothing - 1',
      start: [
        'aaa "bbb" c', //
        'd "e|" f', //
        'g `h` k',
      ],
      keysPressed: 'din"',
      end: [
        'aaa "bbb" c', //
        'd "e|" f', //
        'g `h` k',
      ],
    });
    // test last
    newTest({
      title: 'last: should go previous line - 1',
      start: [
        'aaa "bbb" c', //
        'd |"e" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        'd "e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should go previous line - 2',
      start: [
        'aaa "bbb" c', //
        'd| "e" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        'd "e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should go previous line - 3',
      start: [
        'aaa "bbb" c', //
        'd "|e" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        'd "e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should go previous line - 4',
      start: [
        'aaa "bbb" c', //
        'd "e|" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        'd "e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should go previous line - 5',
      start: [
        'aaa "bbb" c', //
        '|"e" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        '"e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should go previous line - 6',
      start: [
        'aaa "bbb" c', //
        '"|e" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        '"e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should go previous line - 7',
      start: [
        'aaa "bbb" c', //
        '"e|" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        '"e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should not go previous line - 1',
      start: [
        'aaa "bbb" c', //
        'd "e"| f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "bbb" c', //
        'd "|" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should not go previous line - 2',
      start: [
        'aaa "bbb" |c', //
        'd "e" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa "|" c', //
        'd "e" f', //
        'g "h" k',
      ],
    });
    newTest({
      title: 'last: should do nothing - 1',
      start: [
        'aaa `b` c', //
        'd "e|" f', //
        'g "h" k',
      ],
      keysPressed: 'dil"',
      end: [
        'aaa `b` c', //
        'd "e|" f', //
        'g "h" k',
      ],
    });

    // test case after - bug fix
    newTest({
      title: 'last: long string cursor after',
      start: [
        ' function MissingProperty(properyName) { ',
        ' this.name = "property ${properyName} is not defined";          |   ',
        ' this.message = message `property ${properyName} is not defined`; ',
        ' } ',
      ],
      keysPressed: 'dil"',
      end: [
        ' function MissingProperty(properyName) { ',
        ' this.name = "|";             ',
        ' this.message = message `property ${properyName} is not defined`; ',
        ' } ',
      ],
    });
    newTest({
      title: 'last: long string cursor after, next line - 1',
      start: [
        ' function MissingProperty(properyName) { ',
        ' this.name = "property ${properyName} is not defined";             ',
        '| this.message = message `property ${properyName} is not defined`; ',
        ' } ',
      ],
      keysPressed: 'dil"',
      end: [
        ' function MissingProperty(properyName) { ',
        ' this.name = "|";             ',
        ' this.message = message `property ${properyName} is not defined`; ',
        ' } ',
      ],
    });
    newTest({
      title: 'last: long string cursor after, next line - 2',
      start: [
        ' function MissingProperty(properyName) { ',
        ' this.name = "property ${properyName} is not defined";             ',
        ' this.message = message `property ${properyName} is not defined|`; ',
        ' } ',
      ],
      keysPressed: 'dil"',
      end: [
        ' function MissingProperty(properyName) { ',
        ' this.name = "|";             ',
        ' this.message = message `property ${properyName} is not defined`; ',
        ' } ',
      ],
    });
  });
});
