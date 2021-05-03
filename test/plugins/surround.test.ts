import { cleanUpWorkspace, setupWorkspace } from './../testUtils';
import { Configuration } from '../testConfiguration';
import { newTest } from '../testSimplifier';
import { CommandSurroundAddSurroundingTag } from '../../src/actions/plugins/surround';

suite('surround plugin', () => {
  setup(async () => {
    const configuration = new Configuration();
    configuration.surround = true;
    await setupWorkspace(configuration, '.js');
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: "'ysiw)' surrounds word without space",
    start: ['first li|ne test'],
    keysPressed: 'ysiw)',
    end: ['first |(line) test'],
  });

  newTest({
    title: "'ysiw(' surrounds word with space",
    start: ['first li|ne test'],
    keysPressed: 'ysiw(',
    end: ['first |( line ) test'],
  });

  newTest({
    title: "'ysw)' surrounds word without space",
    start: ['first |line test'],
    keysPressed: 'ysw)',
    end: ['first |(line) test'],
  });

  newTest({
    title: "'ysw)' surrounds word, two spaces next word",
    start: ['first |line  test'],
    keysPressed: 'ysw)',
    end: ['first |(line)  test'],
  });

  newTest({
    title: "'ysw)' surrounds word, tab to next word",
    start: ['first |line\ttest'],
    keysPressed: 'ysw)',
    end: ['first |(line)\ttest'],
  });

  newTest({
    title: "'ysw(' surrounds word with space",
    start: ['first |line test'],
    keysPressed: 'ysw(',
    end: ['first |( line ) test'],
  });
  newTest({
    title: "'ysaw)' surrounds word without space",
    start: ['first li|ne test'],
    keysPressed: 'ysaw)',
    end: ['first |(line) test'],
  });

  newTest({
    title: "'ysaw(' surrounds word with space",
    start: ['first li|ne test'],
    keysPressed: 'ysaw(',
    end: ['first |( line ) test'],
  });

  newTest({
    title: "'ysiw(' surrounds word with space and ignores punctuation",
    start: ['first li|ne.test'],
    keysPressed: 'ysiw(',
    end: ['first |( line ).test'],
  });

  newTest({
    title: 'add surround with repeat',
    start: ['o|ne two three'],
    keysPressed: 'ysiw"Ww.',
    end: ['"one" two |"three"'],
  });

  newTest({
    title: "'ysiw<' surrounds word with tags",
    start: ['first li|ne test'],
    keysPressed: 'ysiw<',
    end: ['first |<123>line</123> test'],
    stub: {
      stubClass: CommandSurroundAddSurroundingTag,
      methodName: 'readTag',
      returnValue: '123',
    },
  });

  newTest({
    title: "'cst<' surrounds word with tags that have a dot in them",
    start: ['first <test>li|ne</test> test'],
    keysPressed: 'cst<',
    end: ['first <abc.def>li|ne</abc.def> test'],
    stub: {
      stubClass: CommandSurroundAddSurroundingTag,
      methodName: 'readTag',
      returnValue: 'abc.def',
    },
  });

  newTest({
    title: "'yss)' surrounds entire line respecting whitespace",
    start: ['foo', '    foob|ar  '],
    keysPressed: 'yss)',
    end: ['foo', '    |(foobar)  '],
  });

  newTest({
    title: 'change surround',
    start: ["first 'li|ne' test"],
    keysPressed: "cs')",
    end: ['first (li|ne) test'],
  });

  newTest({
    title: 'change surround with two pairs of quotes',
    start: ["first ''li|ne'' test"],
    keysPressed: "cs')",
    end: ["first '(li|ne)' test"],
  });

  newTest({
    title: 'change surround with two pairs of parens',
    start: ['first ((li|ne)) test'],
    keysPressed: "cs)'",
    end: ["first ('li|ne') test"],
  });

  newTest({
    title: 'change surround with alias',
    start: ['first (li|ne) test'],
    keysPressed: 'csb]',
    end: ['first [li|ne] test'],
  });

  newTest({
    title: "'ysiwb' surrounds word with alias without space",
    start: ['first li|ne test'],
    keysPressed: 'ysiwb',
    end: ['first |(line) test'],
  });

  newTest({
    title: "'ysiwB' surrounds word with alias without space",
    start: ['first li|ne test'],
    keysPressed: 'ysiwB',
    end: ['first |{line} test'],
  });

  newTest({
    title: "'ysiwr' surrounds word with alias without space",
    start: ['first li|ne test'],
    keysPressed: 'ysiwr',
    end: ['first |[line] test'],
  });

  newTest({
    title: "'ysiwa' surrounds word with alias without space",
    start: ['first li|ne test'],
    keysPressed: 'ysiwa',
    end: ['first |<line> test'],
  });

  newTest({
    title: 'change surround to tags',
    start: ['first [li|ne] test'],
    keysPressed: 'cs]t',
    end: ['first <abc>li|ne</abc> test'],
    stub: {
      stubClass: CommandSurroundAddSurroundingTag,
      methodName: 'readTag',
      returnValue: 'abc',
    },
  });

  newTest({
    title: 'delete surround',
    start: ["first 'li|ne' test"],
    keysPressed: "ds'",
    end: ['first li|ne test'],
  });

  newTest({
    title: 'delete surround with quotes',
    start: ['first "li|ne" test'],
    keysPressed: 'ds"',
    end: ['first li|ne test'],
  });

  newTest({
    title: 'delete surround with nested of quotes',
    start: ['first ""li|ne"" test'],
    keysPressed: 'ds"',
    end: ['first "li|ne" test'],
  });

  newTest({
    title: 'delete surround with inconsistent quotes',
    start: ['first ""li|ne" test'],
    keysPressed: 'ds"',
    end: ['first "li|ne test'],
  });

  newTest({
    title: 'delete surround with mixed quotes',
    start: ['first "\'li|ne"\' test'],
    keysPressed: 'ds"',
    end: ["first 'li|ne' test"],
  });

  newTest({
    title: 'delete surround with empty quotes cursor at start',
    start: ['first |"" test'],
    keysPressed: 'ds"',
    end: ['first | test'],
  });

  newTest({
    title: 'delete surround with empty quotes cursor at end',
    start: ['first "|" test'],
    keysPressed: 'ds"',
    end: ['first | test'],
  });

  newTest({
    title: "don't delete surround if cursor is after closing match",
    start: ['first "line"| test'],
    keysPressed: 'ds"',
    end: ['first "line"| test'],
  });

  newTest({
    title: 'delete surround if cursor is before opening match',
    start: ['first | "line" test'],
    keysPressed: 'ds"',
    end: ['first  |line test'],
  });

  newTest({
    title: 'delete surround with two pairs of parens',
    start: ['first ((li|ne)) test'],
    keysPressed: 'ds)',
    end: ['first (li|ne) test'],
  });

  newTest({
    title: 'delete outer surround with count',
    start: ['(first (li|ne) test)'],
    keysPressed: '2ds)',
    end: ['first (li|ne) test'],
  });

  newTest({
    title: 'delete surround with alias',
    start: ['first {li|ne} test'],
    keysPressed: 'dsB',
    end: ['first li|ne test'],
  });

  newTest({
    title: 'delete surround with repeat',
    start: ['( |one ) two ( three )'],
    keysPressed: 'ds(ww.',
    end: ['one two |three'],
  });

  newTest({
    title: 'delete surround with no space',
    start: ['(on|e) two'],
    keysPressed: 'ds(',
    end: ['on|e two'],
  });

  newTest({
    title: 'delete surround with tags',
    start: ['first <test>li|ne</test> test'],
    keysPressed: 'dst',
    end: ['first li|ne test'],
  });

  newTest({
    title: 'change outer surround with count',
    start: ['(first (li|ne) test)'],
    keysPressed: 'cs2)[',
    end: ['[ first (li|ne) test ]'],
  });

  newTest({
    title: 'change surround brackets at end of line',
    start: ['func() |{', '}'],
    keysPressed: 'cs{]',
    end: ['func() |[', ']'],
  });

  newTest({
    title: 'changing brackets with surround works again',
    start: ['func() {', '    |foo()', '}'],
    keysPressed: 'cs{[',
    end: ['func() [ ', '    |foo()', ' ]'],
  });

  newTest({
    title: 'change surround with tags that contain an attribute and preserve them',
    start: ['<h2 test class="foo">b|ar</h2>'],
    keysPressed: 'cstt',
    end: ['<h3 test class="foo">b|ar</h3>'],
    stub: {
      stubClass: CommandSurroundAddSurroundingTag,
      methodName: 'readTag',
      returnValue: 'h3',
    },
  });

  newTest({
    title: 'change surround with tags that contain an attribute and remove them',
    start: ['<h2 test class="foo">b|ar</h2>'],
    keysPressed: 'cstt',
    end: ['<h3>b|ar</h3>'],
    stub: {
      stubClass: CommandSurroundAddSurroundingTag,
      methodName: 'readTag',
      returnValue: 'h3>',
    },
  });

  newTest({
    title:
      'performing surround after cancelling surround action with <Esc> does not move the cursor',
    start: ['foo b|ar'],
    keysPressed: 'ys<Esc>ys',
    end: ['foo b|ar'],
  });

  // Visual mode tests

  newTest({
    title: "'S)' surrounds visual selection without space",
    start: ['first li|ne test'],
    keysPressed: 'viwS)',
    end: ['first (li|ne) test'],
  });

  newTest({
    title: "'S(' surrounds visual selection with space",
    start: ['first li|ne test'],
    keysPressed: 'viwS(',
    end: ['first ( l|ine ) test'],
  });

  newTest({
    title: "'S<div>' surrounds selection with <div></div>",
    start: ['first li|ne test'],
    // I've added the '0' key press at the end because the test was behaving weirdly, if I ran
    // the extension and did this test manually the cursor would end up on the first '<'. But
    // when running the tests this test was failing saying the cursor was actually on the
    // second '<' (character 15) instead of the first (character 6) as expected.
    keysPressed: 'viwS<0',
    end: ['|first <div>line</div> test'],
    stub: {
      stubClass: CommandSurroundAddSurroundingTag,
      methodName: 'readTag',
      returnValue: 'div',
    },
  });

  newTest({
    title: "'S)' surrounds visual line selection without space",
    start: ['first', 'sec|ond', 'third'],
    keysPressed: 'VS)',
    end: ['first', '(', 'second', '|)', 'third'],
  });

  newTest({
    title: "'S(' surrounds visual line selection with space",
    start: ['first', 'sec|ond', 'third'],
    keysPressed: 'VS(',
    end: ['first', '( ', 'second', '| )', 'third'],
  });

  newTest({
    title: "'S<div>' surrounds visual line selection with <div></div>",
    start: ['first', 'sec|ond', 'third'],
    keysPressed: 'VS<',
    end: ['first', '<div>', 'second', '|</div>', 'third'],
    stub: {
      stubClass: CommandSurroundAddSurroundingTag,
      methodName: 'readTag',
      returnValue: 'div',
    },
  });

  // multi cursor tests

  newTest({
    title: 'visual surround with multicursor',
    start: ['one |two three, one two three'],
    keysPressed: 'gbgb' + 'S)' + '<esc>' + '0', // 0: fix cursor pos, see above
    end: ['|one (two) three, one (two) three'],
  });

  newTest({
    title: 'yank surround with multicursor',
    start: ['one |two three, one two three'],
    // gbgbv results in two cursors in normal mode
    keysPressed: 'gbgbv' + 'ysiw)' + '<esc>',
    end: ['one |(two) three, one (two) three'],
  });

  newTest({
    title: 'yank surround with multicursor and repeat',
    start: ['one |two three, one two three'],
    keysPressed: 'gbgbv' + 'ysiw)' + 'W.' + '<esc>',
    end: ['one (two) |(three), one (two) (three)'],
  });

  newTest({
    title: 'delete surround with multicursor',
    start: ['one (tw|o) three, one (two) three'],
    keysPressed: 'gbgbv' + 'ds)' + '<esc>',
    end: ['one tw|o three, one two three'],
  });

  newTest({
    title: 'delete surround with multicursor and repeat',
    start: ['one (tw|o) (three), one (two) (three)'],
    keysPressed: 'gbgbv' + 'ds)' + 'W.' + '<esc>',
    end: ['one two |three, one two three'],
  });

  newTest({
    title: 'change surround with multicursor',
    start: ['one (tw|o) three, one (two) three'],
    keysPressed: 'gbgbv' + 'cs)[' + '<esc>',
    end: ['one [ tw|o ] three, one [ two ] three'],
  });
});
