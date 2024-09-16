import { Mode } from '../src/mode/mode';
import { newTest, newTestWithRemaps } from './testSimplifier';
import { setupWorkspace } from './testUtils';

suite('Record and execute a macro', () => {
  setup(async () => {
    await setupWorkspace({
      config: {
        // for testing with <leader>
        camelCaseMotion: { enable: true },
      },
    });
  });

  newTest({
    title: 'Can record and execute',
    start: ['|foo = 1', "bar = 'a'", 'foobar = foo + bar'],
    keysPressed: 'qaA;<Esc>Ivar <Esc>qj@a',
    end: ['var foo = 1;', "var| bar = 'a';", 'foobar = foo + bar'],
  });

  newTest({
    title: 'Can repeat last invoked macro',
    start: ['|foo = 1', "bar = 'a'", 'foobar = foo + bar'],
    keysPressed: 'qaA;<Esc>Ivar <Esc>qj@aj@@',
    end: ['var foo = 1;', "var bar = 'a';", 'var| foobar = foo + bar;'],
  });

  newTest({
    title: 'Can play back with count',
    start: ['|"("+a+","+b+","+c+","+d+","+e+")"'],
    keysPressed: 'f+s + <Esc>qq;.q8@q',
    end: ['"(" + a + "," + b + "," + c + "," + d + "," + e +| ")"'],
  });

  newTest({
    title: 'Can play back with count, abort when a motion fails',
    start: ['|"("+a+","+b+","+c+","+d+","+e+")"'],
    keysPressed: 'f+s + <Esc>qq;.q22@q',
    end: ['"(" + a + "," + b + "," + c + "," + d + "," + e +| ")"'],
  });

  newTest({
    title: 'Repeat change on contiguous lines',
    start: ['1. |one', '2. two', '3. three', '4. four'],
    keysPressed: 'qa0f.r)w~jq3@a',
    end: ['1) One', '2) Two', '3) Three', '4) F|our'],
  });

  newTest({
    title: 'Repeat insertion with arrow keys and <BS>',
    start: ['o|ne two three', 'four five six'],
    keysPressed: 'qk' + 'A' + ' tpyo' + '<left><BS><left>y' + '<Esc>' + 'q' + 'j0' + '@k',
    end: ['one two three typo', 'four five six t|ypo'],
  });

  newTest({
    title: 'Append command to a macro',
    start: ['1. |one', '2. two', '3. three', '4. four'],
    keysPressed: 'qa0f.r)qqAw~jq3@a',
    end: ['1) One', '2) Two', '3) Three', '4) F|our'],
  });

  newTest({
    title: 'Append command to a not yet created register creates a new register',
    start: ['1. |one', '2. two', '3. three', '4. four'],
    keysPressed: 'qB0f.r)w~jq3@b',
    end: ['1) One', '2) Two', '3) Three', '4) F|our'],
  });

  newTest({
    title: 'Can handle calling an uppercase register',
    start: ['1. |one', '2. two', '3. three', '4. four'],
    keysPressed: 'qa0f.r)w~jq3@A',
    end: ['1) One', '2) Two', '3) Three', '4) F|our'],
  });

  newTest({
    title: 'Can handle calling a non existing macro',
    start: ['1. |one', '2. two', '3. three', '4. four'],
    keysPressed: '@x',
    end: ['1. |one', '2. two', '3. three', '4. four'],
  });

  newTest({
    title: 'Can handle calling a non existing macro with uppercase letter',
    start: ['1. |one', '2. two', '3. three', '4. four'],
    keysPressed: '@Z',
    end: ['1. |one', '2. two', '3. three', '4. four'],
  });

  newTest({
    title: 'Can record Ctrl Keys and repeat',
    start: ['1|.'],
    keysPressed: 'qayyp<C-a>q4@a',
    end: ['1.', '2.', '3.', '4.', '5.', '|6.'],
  });

  newTest({
    title: 'Can execute macros with dot commands properly',
    start: ['|test', 'test', 'test', 'test', 'test', 'test', 'test'],
    keysPressed: 'qadd.q@a@a',
    end: ['|test'],
  });

  suite('`:` (command) register used as macro', () => {
    newTest({
      title: 'Repeat :s',
      start: ['|old', 'old', 'old'],
      keysPressed: ':s/old/new\nj@:j@@',
      end: ['new', 'new', '|new'],
    });

    newTest({
      title: 'Repeat :d',
      start: ['one', 't|wo', 'three', 'four', 'five'],
      keysPressed: ':d/\n' + '@:' + '@@',
      end: ['one', '|five'],
    });

    newTest({
      title: 'Repeat :co',
      start: ['|one', 'two'],
      keysPressed: ':.co$\n' + '@:',
      end: ['one', 'two', '|one', 'one'], // TODO: Cursor should be on line 3, not 4
    });
  });

  suite('`:` (command) register used as macro and command with leader key', () => {
    newTest({
      title: 'Repeat :s and command with leader key',
      config: { leader: 'o' },
      start: ['|old', 'old', 'old'],
      keysPressed: ':s/old/new\nj@:j@@',
      end: ['new', 'new', '|new'],
    });
  });

  newTest({
    title: 'Can record and execute macro that handles multiple lines',
    start: ['|Countdown:', '1', 'LAUNCH!!!'],
    keysPressed: 'qajyyP<C-a>kq8@a',
    end: ['C|ountdown:', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'LAUNCH!!!'],
  });

  newTest({
    title: 'Failed `n` stops macro from repeating',
    config: { wrapscan: false },
    start: ['|one two three', 'one two three', 'one two three'],
    keysPressed: '/two\n0' + 'qq' + 'nea XXX<Esc>q' + '5@q',
    end: ['one two XXX three', 'one two XXX three', 'one two XX|X three'],
  });

  newTest({
    title: 'q[A-Z] (action) Can record and append to a macro',
    start: ['|'],
    keysPressed:
      'qb' +
      'i' +
      'one two ' +
      '<Esc>q' +
      'o<Esc>@b' +
      'o<Esc>' +
      'qB' +
      'i' +
      'three four' +
      '<Esc>q' +
      'o<Esc>@b',
    end: ['one two ', 'one two ', 'three four', 'one twothree fou|r '],
  });

  newTest({
    title: 'q[A-Z] (action) Creates new register, accessible by [a-z]',
    start: ['|'],
    keysPressed: 'qB' + 'i' + 'one two' + '<Esc>q' + 'o<Esc>@b',
    end: ['one two', 'one tw|o'],
  });

  newTest({
    title: 'Invalid register throws E354',
    start: ['one t|wo three'],
    keysPressed: '@~',
    end: ['one t|wo three'],
    statusBar: "E354: Invalid register name: '~'",
  });

  for (const register of ['%', '#']) {
    newTest({
      title: `Filename register '${register}' throw E354`,
      start: ['one t|wo three'],
      keysPressed: `@${register}`,
      end: ['one t|wo three'],
      statusBar: `E354: Invalid register name: '${register}'`,
    });
  }

  newTest({
    title: '`@@` before a macro has been run throws E748',
    start: ['one t|wo three'],
    keysPressed: '@@',
    end: ['one t|wo three'],
    statusBar: 'E748: No previously used register',
  });

  suite('Text copied into register can be run as a macro', () => {
    const start = ['one', 'two', 'three'];
    const register = 'x';
    const testCases: Array<[string, string[]]> = [
      ['', ['|one', 'two', 'three']],
      ['j', ['one', '|two', 'three']],
      ['2j', ['one', 'two', '|three']],

      ['A' + ', uno<Esc>', ['one, un|o', 'two', 'three']],

      ['dd', ['|two', 'three']],

      ['yyp', ['one', '|one', 'two', 'three']],

      ['VGJ', ['one two| three']],

      ['gUU' + 'j.' + 'j.', ['ONE', 'TWO', '|THREE']],

      [':2d\\n', ['one', '|three']],

      ['jjl~l~0' + '<leader>w' + '<leader>w', ['one', 'two', 'tHr|Ee']],

      // TODO: control characters...
    ];
    for (const [macro, end] of testCases) {
      newTest({
        title: `macro='${macro}'`,
        start: [`|${macro}`, ...start],
        keysPressed: `"${register}dd` + `@${register}`,
        end,
        endMode: Mode.Normal,
      });
    }

    newTest({
      title: `test @@ - 1`,
      start: [`|j`, ...start],
      keysPressed: `"${register}dd` + `@${register}` + `@@`,
      end: ['one', 'two', '|three'],
      endMode: Mode.Normal,
    });

    newTest({
      title: `test @@ - 2`,
      start: [`|dd`, ...start],
      keysPressed: `"${register}dd` + `@${register}` + `@@`,
      end: ['|three'],
      endMode: Mode.Normal,
    });

    newTestWithRemaps({
      title: 'test with remaps: simple',
      start: [`|J`, ...start],
      remaps: ['nmap J jj'],
      steps: [
        {
          // Step 0:
          keysPressed: `"${register}dd` + `@${register}`,
          stepResult: {
            end: ['one', 'two', '|three'],
          },
        },
      ],
    });

    newTestWithRemaps({
      title: 'test with remaps: repeat',
      start: [`|Pm`, ...start],
      remaps: ['nmap Pm Cabc<Esc>'],
      steps: [
        {
          // Step 0:
          keysPressed: `"${register}dd` + `@${register}`,
          stepResult: {
            end: ['ab|c', 'two', 'three'],
          },
        },
        {
          // Step 1:
          keysPressed: 'j0' + `@@`,
          stepResult: {
            end: ['abc', 'ab|c', 'three'],
          },
        },
      ],
    });

    newTestWithRemaps({
      title: 'test with remaps: leader',
      start: [`|<leader>J`, ...start],
      remaps: ['nmap <leader>J jj'],
      steps: [
        {
          // Step 0:
          keysPressed: `"${register}dd` + `@${register}`,
          stepResult: {
            end: ['one', 'two', '|three'],
          },
        },
      ],
    });
  });
});
