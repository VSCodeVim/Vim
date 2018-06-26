import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('surround plugin', () => {
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace(undefined, '.js');
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: "'ysiw)' surrounds word without space",
    start: ['first li|ne test'],
    keysPressed: 'ysiw)',
    end: ['first (|line) test'],
  });

  newTest({
    title: "'ysiw(' surrounds word with space",
    start: ['first li|ne test'],
    keysPressed: 'ysiw(',
    end: ['first ( |line ) test'],
  });

  newTest({
    title: "'ysw)' surrounds word without space",
    start: ['first |line test'],
    keysPressed: 'ysw)',
    end: ['first (|line) test'],
  });

  newTest({
    title: "'ysw(' surrounds word with space",
    start: ['first |line test'],
    keysPressed: 'ysw(',
    end: ['first ( |line ) test'],
  });
  newTest({
    title: "'ysaw)' surrounds word without space",
    start: ['first li|ne test'],
    keysPressed: 'ysaw)',
    end: ['first (|line) test'],
  });

  newTest({
    title: "'ysaw(' surrounds word with space",
    start: ['first li|ne test'],
    keysPressed: 'ysaw(',
    end: ['first ( |line ) test'],
  });

  newTest({
    title: "'ysiw(' surrounds word with space and ignores punctuation",
    start: ['first li|ne.test'],
    keysPressed: 'ysiw(',
    end: ['first ( |line ).test'],
  });

  newTest({
    title: "'ysiw<' surrounds word with tags",
    start: ['first li|ne test'],
    keysPressed: 'ysiw<123>',
    end: ['first <123>|line</123> test'],
  });

  newTest({
    title: "'ysiw<' surrounds word with tags and attributes",
    start: ['first li|ne test'],
    keysPressed: 'ysiw<abc attr1 attr2="test">',
    end: ['first <abc attr1 attr2="test">|line</abc> test'],
  });

  newTest({
    title: "'yss)' surrounds entire line respecting whitespace",
    start: ['foo', '    foob|ar  '],
    keysPressed: 'yss)',
    end: ['foo', '    (|foobar)  '],
  });

  newTest({
    title: 'change surround',
    start: ["first 'li|ne' test"],
    keysPressed: "cs')",
    end: ['first (li|ne) test'],
  });

  newTest({
    title: 'change surround with alias',
    start: ["first (li|ne) test"],
    keysPressed: "csb]",
    end: ['first [li|ne] test'],
  });

  newTest({
    title: 'change surround to tags',
    start: ['first [li|ne] test'],
    keysPressed: 'cs]tabc>',
    end: ['first <abc>li|ne</abc> test'],
  });

  newTest({
    title: 'delete surround',
    start: ["first 'li|ne' test"],
    keysPressed: "ds'",
    end: ['first li|ne test'],
  });

  newTest({
    title: 'delete surround with alias',
    start: ["first {li|ne} test"],
    keysPressed: "dsB",
    end: ['first li|ne test'],
  });

  newTest({
    title: 'delete surround with tags',
    start: ['first <test>li|ne</test> test'],
    keysPressed: 'dst',
    end: ['first li|ne test'],
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
});
