import { newTest } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('Record and execute a macro', () => {
  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

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

  newTest({
    title: ': (command) register can be used as a macro',
    start: ['|old', 'old', 'old'],
    keysPressed: ':s/old/new\nj@:j@@',
    end: ['new', 'new', '|new'],
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
});
