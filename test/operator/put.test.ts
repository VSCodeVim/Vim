import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('put operator', () => {
  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'basic put test',
    start: ['blah bla|h'],
    keysPressed: '^Dpp',
    end: ['blah blahblah bla|h'],
  });

  newTest({
    title: 'test yy end of line',
    start: ['blah blah', 'bla|h'],
    keysPressed: '^yyp',
    end: ['blah blah', 'blah', '|blah'],
  });

  newTest({
    title: 'test yy first line',
    start: ['blah blah', 'bla|h'],
    keysPressed: 'ggyyp',
    end: ['blah blah', '|blah blah', 'blah'],
  });

  newTest({
    title: 'test yy middle line',
    start: ['1', '2', '|3'],
    keysPressed: 'kyyp',
    end: ['1', '2', '|2', '3'],
  });

  newTest({
    title: 'test yy with correct position movement',
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: '2yyjjpk',
    end: ['one', 'two', '|three', 'one', 'two', 'four'],
  });

  newTest({
    title: 'test visual block single line yank p',
    start: ['12|345'],
    keysPressed: '<C-v>llyhp',
    end: ['12|345345'],
  });

  newTest({
    title: 'test visual block single line yank P',
    start: ['12|345'],
    keysPressed: '<C-v>llyhP',
    end: ['1|3452345'],
  });

  newTest({
    title: 'test visual block single line delete p',
    start: ['12|345'],
    keysPressed: '<C-v>lldhp',
    end: ['1|3452'],
  });

  newTest({
    title: 'test visual block single line delete P',
    start: ['12|345'],
    keysPressed: '<C-v>lldhP',
    end: ['|34512'],
  });

  newTest({
    title: 'test visual line paste without count',
    start: ['123', '456', '|789'],
    keysPressed: 'yykVp',
    end: ['123', '|789', '789'],
  });

  newTest({
    title: 'test visual line paste with count',
    start: ['123', '456', '|789'],
    keysPressed: 'yykV3p',
    end: ['123', '|789', '789', '789', '789'],
  });

  newTest({
    title: 'test visual line paste without count using gp',
    start: ['123', '456', '|789'],
    keysPressed: 'yykVgp',
    end: ['123', '789', '|789'],
  });

  newTest({
    title: 'test visual line paste with count using gp',
    start: ['123', '456', '|789'],
    keysPressed: 'yykV3gp',
    end: ['123', '789', '789', '789', '|789'],
  });

  newTest({
    title: "Can handle 'P' after 'yy'",
    start: ['one', 'tw|o'],
    keysPressed: 'yyP',
    end: ['one', '|two', 'two'],
  });

  newTest({
    title: "Can handle 'p' after 'yy'",
    start: ['one', 'tw|o'],
    keysPressed: 'yyp',
    end: ['one', 'two', '|two'],
  });

  newTest({
    title: "Can handle 'P' after 'Nyy'",
    start: ['on|e', 'two', 'three'],
    keysPressed: '3yyP',
    end: ['|one', 'two', 'three', 'one', 'two', 'three'],
  });

  newTest({
    title: "Can handle 'p' after 'Nyy'",
    start: ['on|e', 'two', 'three'],
    keysPressed: '3yyp',
    end: ['one', '|one', 'two', 'three', 'two', 'three'],
  });

  newTest({
    title: "Can handle 'p' after 'yy' with correct cursor position",
    start: ['|  one', 'two'],
    keysPressed: 'yyjp',
    end: ['  one', 'two', '  |one'],
  });

  newTest({
    title: "Can handle 'gp' after 'yy'",
    start: ['one', 'tw|o', 'three'],
    keysPressed: 'yygp',
    end: ['one', 'two', 'two', '|three'],
  });

  newTest({
    title: "Can handle 'gp' after 'Nyy'",
    start: ['on|e', 'two', 'three'],
    keysPressed: '2yyjgp',
    end: ['one', 'two', 'one', 'two', '|three'],
  });

  newTest({
    title: "Can handle 'gp' after 'Nyy' if pasting more than three lines",
    start: ['on|e', 'two', 'three', 'four'],
    keysPressed: '4yyGgp',
    end: ['one', 'two', 'three', 'four', 'one', 'two', 'three', '|four'],
  });

  newTest({
    title: "Can handle 'gp' after 'Nyy' if cursor is on the last line",
    start: ['on|e', 'two', 'three'],
    keysPressed: '2yyjjgp',
    end: ['one', 'two', 'three', 'one', '|two'],
  });

  newTest({
    title: "Can handle 'gP' after 'yy'",
    start: ['one', 'tw|o', 'three'],
    keysPressed: 'yygP',
    end: ['one', 'two', '|two', 'three'],
  });

  newTest({
    title: "Can handle 'gP' after 'Nyy'",
    start: ['on|e', 'two', 'three'],
    keysPressed: '2yygP',
    end: ['one', 'two', '|one', 'two', 'three'],
  });

  newTest({
    title: "Can handle 'gP' after 'Nyy' if pasting more than three lines",
    start: ['on|e', 'two', 'three', 'four'],
    keysPressed: '4yygP',
    end: ['one', 'two', 'three', 'four', '|one', 'two', 'three', 'four'],
  });

  newTest({
    title: "Can handle ']p' after yy",
    start: ['  |one', '   two'],
    keysPressed: 'yyj]p',
    end: ['  one', '   two', '   |one'],
  });

  newTest({
    title: "Can handle ']p' after 'Nyy'",
    start: [' |one', '  two', '  three'],
    keysPressed: '2yyjj]p',
    end: [' one', '  two', '  three', '  |one', '   two'],
  });

  newTest({
    title: "Can handle ']p' after 'Nyy' and indent with tabs first",
    config: {
      tabstop: 4,
      expandtab: false,
    },
    start: [' |one', '  two', '   three'],
    keysPressed: '2yyjj]p',
    end: [' one', '  two', '   three', '   |one', '\ttwo'],
  });

  newTest({
    title: "Can handle ']p' after 'Nyy' and decrease indents if possible",
    start: ['    |one', ' two', ' three'],
    keysPressed: '2yyjj]p',
    end: ['    one', ' two', ' three', ' |one', 'two'],
  });

  newTest({
    title: "Can handle '[p' after yy",
    start: ['   two', '  |one'],
    keysPressed: 'yyk[p',
    end: ['   |one', '   two', '  one'],
  });

  newTest({
    title: "Can handle '[p' after 'Nyy'",
    start: ['  three', '|one', ' two'],
    keysPressed: '2yyk[p',
    end: ['  |one', '   two', '  three', 'one', ' two'],
  });

  newTest({
    title: "Can handle '[p' after 'Nyy' and indent with tabs first",
    config: {
      tabstop: 4,
      expandtab: false,
    },
    start: ['   three', '| one', '  two'],
    keysPressed: '2yyk[p',
    end: ['   |one', '\ttwo', '   three', ' one', '  two'],
  });

  newTest({
    title: "Can handle '[p' after 'Nyy' and decrease indents if possible",
    start: [' three', '    |one', ' two'],
    keysPressed: '2yyk[p',
    end: [' |one', 'two', ' three', '    one', ' two'],
  });

  newTest({
    title: "Can handle 'p' after y'a",
    start: ['|one', 'two', 'three'],
    keysPressed: "majjy'ap",
    end: ['one', 'two', 'three', '|one', 'two', 'three'],
  });

  newTest({
    title: "Can handle 'p' after 'y])' without including closing parenthesis",
    start: ['(hello, |world)'],
    keysPressed: 'y])$p',
    end: ['(hello, world)worl|d'],
  });

  newTest({
    title: "Can handle 'p' after 'y]}' without including closing bracket",
    start: ['{hello, |world}'],
    keysPressed: 'y]}$p',
    end: ['{hello, world}worl|d'],
  });

  newTest({
    title: 'Can handle pasting in visual mode over selection',
    start: ['|foo', 'bar', 'fun'],
    keysPressed: 'Yjvll"ayjV"app',
    end: ['foo', 'bar', 'bar', '|fun'],
  });

  newTest({
    title: 'Can repeat p',
    start: ['|one'],
    keysPressed: 'yy2p',
    end: ['one', '|one', 'one'],
  });

  newTest({
    title: 'can handle p with selection',
    start: ['|abc def ghi'],
    keysPressed: 'vwywvwp',
    end: ['abc abc |dhi'],
  });

  // test works when run manually
  // newTest({
  //   title: "can handle p with selection",
  //   start: ["one", "two", "|three"],
  //   keysPressed: "yykVp",
  //   end: ["|three", "three"]
  // });

  newTest({
    title: 'can handle P with selection',
    start: ['|abc def ghi'],
    keysPressed: 'vwywvwP',
    end: ['abc abc |dhi'],
  });

  newTest({
    title: 'Yank character-wise, <count>p in Visual mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yeve3p',
    end: ['one', 'twotwotw|o', 'three'],
  });

  newTest({
    title: 'Yank character-wise, <count>p in VisualLine mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yeV3p',
    end: ['one', '|two', 'two', 'two', 'three'],
  });

  newTest({
    title: 'Yank line-wise, <count>p in Visual mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yyve3p',
    end: ['one', '', '|two', 'two', 'two', '', 'three'],
  });

  newTest({
    title: 'Yank line-wise, <count>p in VisualLine mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yyV3p',
    end: ['one', '|two', 'two', 'two', 'three'],
  });

  newTest({
    title: 'Yank character-wise, <count>gp in Visual mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yeve3gp',
    end: ['one', 'twotwotw|o', 'three'],
  });

  newTest({
    title: 'Yank character-wise, <count>gp in VisualLine mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yeV3gp',
    end: ['one', 'two', 'two', 'two', '|three'],
  });

  newTest({
    title: 'Yank line-wise, <count>gp in Visual mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yyve3gp',
    end: ['one', '', 'two', 'two', 'two', '|', 'three'],
  });

  newTest({
    title: 'Yank line-wise, <count>gp in VisualLine mode',
    start: ['one', '|two', 'three'],
    keysPressed: 'yyV3gp',
    end: ['one', 'two', 'two', 'two', '|three'],
  });

  newTest({
    title: 'can handle p in visual to end of line',
    start: ['1234 |5678', 'test test'],
    keysPressed: 'vllllyjvllllp',
    end: ['1234 5678', 'test |5678', ''],
  });
});
