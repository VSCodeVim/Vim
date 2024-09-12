import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTest, newTestSkip } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Normal', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace({
      config: {
        tabstop: 4,
        expandtab: false,
      },
    });
    modeHandler = (await getAndUpdateModeHandler())!;
  });
  suiteTeardown(cleanUpWorkspace);

  test('Can be activated', async () => {
    const activationKeys = ['<Esc>', '<C-[>'];

    for (const key of activationKeys) {
      await modeHandler.handleKeyEvent('i');
      await modeHandler.handleKeyEvent(key);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal, `${key} doesn't work.`);
    }

    await modeHandler.handleKeyEvent('v');
    await modeHandler.handleKeyEvent('v');

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  newTest({
    title: 'Can handle dw',
    start: ['one |two three'],
    keysPressed: 'dw',
    end: ['one |three'],
  });

  newTest({
    title: 'Can handle dw',
    start: ['one | '],
    keysPressed: 'dw',
    end: ['one| '],
  });

  newTest({
    title: 'Can handle dw',
    start: ['one |two'],
    keysPressed: 'dw',
    end: ['one| '],
  });

  newTest({
    title: 'Can handle dw across lines (1)',
    start: ['one |two', '  three'],
    keysPressed: 'dw',
    end: ['one| ', '  three'],
  });

  newTest({
    title: 'Can handle dw across lines (2)',
    start: ['one |two', '', 'three'],
    keysPressed: 'dw',
    end: ['one| ', '', 'three'],
  });

  newTest({
    title: 'Can handle dd last line',
    start: ['one', '|two'],
    keysPressed: 'dd',
    end: ['|one'],
  });

  newTest({
    title: 'Can handle dd single line',
    start: ['|one'],
    keysPressed: 'dd',
    end: ['|'],
  });

  newTest({
    title: 'Can handle dd',
    start: ['|one', 'two'],
    keysPressed: 'dd',
    end: ['|two'],
  });

  newTest({
    title: 'Can handle 3dd',
    start: ['|one', 'two', 'three', 'four', 'five'],
    keysPressed: '3dd',
    end: ['|four', 'five'],
    statusBar: '3 fewer lines',
  });

  newTest({
    title: 'Can handle 3dd off end of document',
    start: ['one', 'two', 'three', '|four', 'five'],
    keysPressed: '3dd',
    end: ['one', 'two', '|three'],
  });

  newTest({
    title: 'Can handle d2d',
    start: ['one', 'two', '|three', 'four', 'five'],
    keysPressed: 'd2d',
    end: ['one', 'two', '|five'],
  });

  newTest({
    title: 'Can handle dd empty line',
    start: ['one', '|', 'two'],
    keysPressed: 'dd',
    end: ['one', '|two'],
  });

  newTest({
    title: 'Can handle ddp',
    start: ['|one', 'two'],
    keysPressed: 'ddp',
    end: ['two', '|one'],
  });

  newTest({
    title: "Can handle 'de'",
    start: ['text tex|t'],
    keysPressed: '^de',
    end: ['| text'],
  });

  newTest({
    title: "Can handle 'de' then 'de' again",
    start: ['text tex|t'],
    keysPressed: '^dede',
    end: ['|'],
  });

  newTest({
    title: "Can handle 'db'",
    start: ['One tw|o'],
    keysPressed: '$db',
    end: ['One |o'],
  });

  newTest({
    title: "Can handle 'db then 'db' again",
    start: ['One tw|o'],
    keysPressed: '$dbdb',
    end: ['|o'],
  });

  newTest({
    title: "Can handle 'dl' at end of line",
    start: ['bla|h'],
    keysPressed: '$dldldl',
    end: ['|b'],
  });

  newTest({
    title: "Can handle 'dF'",
    start: ['abcdefg|h'],
    keysPressed: 'dFd',
    end: ['abc|h'],
  });

  newTest({
    title: "Can handle 'dT'",
    start: ['abcdefg|h'],
    keysPressed: 'dTd',
    end: ['abcd|h'],
  });

  newTest({
    title: "Can handle 'd3' then <enter>",
    start: ['|1', '2', '3', '4', '5', '6'],
    keysPressed: 'd3\n',
    end: ['|5', '6'],
  });

  newTest({
    title: "Can handle 'dj'",
    start: ['|11', '22', '\t33', '44', '55', '66'],
    keysPressed: 'dj',
    end: ['\t|33', '44', '55', '66'],
  });

  newTest({
    title: "Can handle 'dk'",
    start: ['11', '22', '33', '44', '55', '|66'],
    keysPressed: 'dk',
    end: ['11', '22', '33', '|44'],
  });

  newTest({
    title: "Can handle 'd])' without deleting closing parenthesis",
    start: ['(hello, |world)'],
    keysPressed: 'd])',
    end: ['(hello, |)'],
  });

  newTest({
    title: "Can handle 'd]}' without deleting closing bracket",
    start: ['{hello, |world}'],
    keysPressed: 'd]}',
    end: ['{hello, |}'],
  });

  newTest({
    title: "Can handle 'd/'",
    start: ['one |two three four'],
    keysPressed: 'd/four\n',
    end: ['one |four'],
  });

  newTest({
    title: "Can handle 'd/' with count ([count]d/[word])",
    start: ['one |two two two two'],
    keysPressed: '3d/two\n',
    end: ['one |two'],
  });

  newTest({
    title: "Can handle 'd/' with count (d[count]/[word])",
    start: ['one |two two two two'],
    keysPressed: 'd3/two\n',
    end: ['one |two'],
  });

  newTest({
    title: "Can handle 'cw'",
    start: ['text text tex|t'],
    keysPressed: '^lllllllcw',
    end: ['text te| text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cw' without deleting following white spaces",
    start: ['|const a = 1;'],
    keysPressed: 'cw',
    end: ['| a = 1;'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cw' on white space",
    start: ['|  const a = 1;'],
    keysPressed: '0cw',
    end: ['|const a = 1;'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cW' on last character of word",
    start: ['first secon|d third fourth'],
    keysPressed: 'cW',
    end: ['first secon| third fourth'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'c2w'",
    start: ['|const a = 1;'],
    keysPressed: 'c2w',
    end: ['| = 1;'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cw' without removing EOL",
    start: ['|text;', 'text'],
    keysPressed: 'llllcw',
    end: ['text|', 'text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'v$c deletes newline',
    start: ['one', 't|wo', 'three'],
    keysPressed: 'v$c',
    end: ['one', 't|three'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'c])' without deleting closing parenthesis",
    start: ['(hello, |world)'],
    keysPressed: 'c])',
    end: ['(hello, |)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'c]}' without deleting closing bracket",
    start: ['{hello, |world}'],
    keysPressed: 'c]}',
    end: ['{hello, |}'],
    endMode: Mode.Insert,
  });

  suite('`s` (synonym for `cl`)', () => {
    newTest({
      title: '`s` deletes a character and enters Insert mode',
      start: ['12|345'],
      keysPressed: 's',
      end: ['12|45'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`[count]s` deletes [count] characters',
      start: ['12|345678'],
      keysPressed: '5s',
      end: ['12|8'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`[count]s` does not go over EOL or delete characters before cursor',
      start: ['12345|678', 'nextline'],
      keysPressed: '5s',
      end: ['12345|', 'nextline'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`s` deletes nothing on an empty line',
      start: ['123', '|', '456'],
      keysPressed: 's',
      end: ['123', '|', '456'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`[count]s` deletes nothing on an empty line',
      start: ['123', '|', '456'],
      keysPressed: '8s',
      end: ['123', '|', '456'],
      endMode: Mode.Insert,
    });
  });

  newTest({
    title: "Can handle 'yiw' with correct cursor ending position",
    start: ['tes|t'],
    keysPressed: 'yiwp',
    end: ['ttes|test'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'ciw'",
    start: ['text text tex|t'],
    keysPressed: '^lllllllciw',
    end: ['text | text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ciw' on blanks",
    start: ['text   text tex|t'],
    keysPressed: '^lllllciw',
    end: ['text|text text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'caw'",
    start: ['text text tex|t'],
    keysPressed: '^llllllcaw',
    end: ['text |text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'caw' on first letter",
    start: ['text text tex|t'],
    keysPressed: '^lllllcaw',
    end: ['text |text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'caw' on blanks",
    start: ['text   tex|t'],
    keysPressed: '^lllllcaw',
    end: ['text|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'caw' on blanks",
    start: ['text |   text text'],
    keysPressed: 'caw',
    end: ['text| text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cae'",
    start: ['Two roads diverged in a |wood, and I', 'I took the one less traveled by'],
    keysPressed: 'cae',
    end: ['|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cae' with caret at document's top",
    start: ['|Two roads diverged in a wood, and I', 'I took the one less traveled by'],
    keysPressed: 'cae',
    end: ['|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cae' with caret at document's end",
    start: ['Two roads diverged in a wood, and I', 'I took the one less traveled by|'],
    keysPressed: 'cae',
    end: ['|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cie' on blank content",
    start: ['|'],
    keysPressed: 'cie',
    end: ['|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cie' with leading space",
    start: [
      '     ',
      '    ',
      '|Two roads diverged in a wood, and I',
      'I took the one less traveled by',
    ],
    keysPressed: 'cie',
    end: ['     ', '    ', '|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cie' with trailing space",
    start: [
      'Two roads |diverged in a wood, and I',
      'I took the one less traveled by',
      '    ',
      '   ',
    ],
    keysPressed: 'cie',
    end: ['|', '    ', '   '],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cie' with both leading and trailing space",
    start: [
      '  ',
      ' ',
      'Two roads diverged in a |wood, and I',
      'I took the one less traveled by',
      '    ',
      '   ',
    ],
    keysPressed: 'cie',
    end: ['  ', ' ', '|', '    ', '   '],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cie' on blank content",
    start: ['|'],
    keysPressed: 'cie',
    end: ['|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci(' on first parentheses",
    start: ['print(|"hello")'],
    keysPressed: 'ci(',
    end: ['print(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci(' with nested parentheses",
    start: ['call|(() => 5)'],
    keysPressed: 'ci(',
    end: ['call(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci(' on closing inner parenthesis",
    start: ['one ((|)) two'],
    keysPressed: 'ci(',
    end: ['one ((|)) two'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci(' backwards through nested parens",
    start: ['call(() => |5)'],
    keysPressed: 'ci(',
    end: ['call(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cib' on first parentheses",
    start: ['print(|"hello")'],
    keysPressed: 'cib',
    end: ['print(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci(' across multiple lines with last character at beginning",
    start: ['(|a', 'b)'],
    keysPressed: 'ci)',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle count prefixed 'ci)'",
    start: [' b(l(baz(f|oo)baz)a)h '],
    keysPressed: 'c3i)',
    end: [' b(|)h '],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle count prefixed 'ca)'",
    start: [' b(l(baz(f|oo)baz)a)h '],
    keysPressed: 'c3a)',
    end: [' b|h '],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ca(' spanning multiple lines",
    start: ['call(', '  |arg1)'],
    keysPressed: 'ca(',
    end: ['call|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'cab' spanning multiple lines",
    start: ['call(', '  |arg1)'],
    keysPressed: 'cab',
    end: ['call|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci{' spanning multiple lines",
    start: ['one {', '|', '}'],
    keysPressed: 'ci{',
    end: ['one {', '|', '}'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci{' spanning multiple lines and handle whitespaces correctly",
    start: ['one {  ', '|', '}'],
    keysPressed: 'ci{',
    end: ['one {|', '}'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci{' spanning multiple lines and handle whitespaces correctly",
    start: ['one {', '|', '  }'],
    keysPressed: 'ci{',
    end: ['one {', '|', '  }'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci(' on the closing bracket",
    start: ['(one|)'],
    keysPressed: 'ci(',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ciB' spanning multiple lines",
    start: ['one {', '|', '}'],
    keysPressed: 'ciB',
    end: ['one {', '|', '}'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'will fail when ca( with no ()',
    start: ['|blaaah'],
    keysPressed: 'ca(',
    end: ['|blaaah'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'will fail when ca{ with no {}',
    start: ['|blaaah'],
    keysPressed: 'ca{',
    end: ['|blaaah'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'will fail when caB with no {}',
    start: ['|blaaah'],
    keysPressed: 'caB',
    end: ['|blaaah'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'ci[' spanning multiple lines",
    start: ['one [', '|', ']'],
    keysPressed: 'ci[',
    end: ['one [', '|', ']'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci]' on first bracket",
    start: ['one[|"two"]'],
    keysPressed: 'ci]',
    end: ['one[|]'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ca[' on first bracket",
    start: ['one[|"two"]'],
    keysPressed: 'ca[',
    end: ['one|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ca]' on first bracket",
    start: ['one[|"two"]'],
    keysPressed: 'ca]',
    end: ['one|'],
    endMode: Mode.Insert,
  });

  // TODO: these tests should be organanized and combined with the ones below - vi'c should be the same as ci', for instance
  newTest({
    title: "Can handle 'vi'c' on first quote",
    start: ["one |'two' three"],
    keysPressed: "vi'c",
    end: ["one '|' three"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'vi'c' inside quoted string",
    start: ["one 't|wo' three"],
    keysPressed: "vi'c",
    end: ["one '|' three"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'vi'c' on closing quote",
    start: ["one 'two|' three"],
    keysPressed: "vi'c",
    end: ["one '|' three"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'vi'c' when string is ahead",
    start: ["on|e 'two' three"],
    keysPressed: "vi'c",
    end: ["one '|' three"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci'' on first quote",
    start: ["|'one'"],
    keysPressed: "ci'",
    end: ["'|'"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci'' inside quoted string",
    start: ["'o|ne'"],
    keysPressed: "ci'",
    end: ["'|'"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci'' on closing quote",
    start: ["'one|'"],
    keysPressed: "ci'",
    end: ["'|'"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci'' when string is ahead",
    start: ["on|e 'two'"],
    keysPressed: "ci'",
    end: ["one '|'"],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' on opening quote",
    start: ['|"one"'],
    keysPressed: 'ci"',
    end: ['"|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' starting behind the quoted word",
    start: ['|one "two"'],
    keysPressed: 'ci"',
    end: ['one "|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'ci\"' correctly matches quotes on line when starting on quote character",
    start: ['one "two|" three "four"'],
    keysPressed: 'ci"',
    end: ['one "|" three "four"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'ci\"' fails when starting on unmatched quote character",
    start: ['one "two" three "four" five|" six'],
    keysPressed: 'ci"',
    end: ['one "two" three "four" five|" six'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'ca\"' starting behind the quoted word",
    start: ['|one "two"'],
    keysPressed: 'ca"',
    end: ['one|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ca\"' starting on the opening quote",
    start: ['one |"two"'],
    keysPressed: 'ca"',
    end: ['one|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'ca\"' includes trailing whitespace",
    start: ['one "t|wo"            three'],
    keysPressed: 'ca"',
    end: ['one |three'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'ca\"' includes trailing whitespace 2",
    start: ['one "t|wo"   ', 'three'],
    keysPressed: 'ca"',
    end: ['one |', 'three'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'ca\"' includes leading whitespace if there is no trailing whitespace",
    start: ['one      "t|wo"three'],
    keysPressed: 'ca"',
    end: ['one|three'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'c2i\"' includes quotes, but not trailing whitespace",
    start: ['one "t|wo"   ', 'three'],
    keysPressed: 'c2i"',
    end: ['one |   ', 'three'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'c2i\"' includes quotes, but not trailing whitespace 2",
    start: ['one "t|wo"   ', 'three'],
    keysPressed: 'c2i"',
    end: ['one |   ', 'three'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'c2i\"' includes quotes, but not leading whitespace",
    start: ['one      "t|wo"three'],
    keysPressed: 'c2i"',
    end: ['one      |three'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' with escaped quotes",
    start: ['"one \\"tw|o\\""'],
    keysPressed: 'ci"',
    end: ['"|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' with a single escaped quote",
    start: ['|"one \\" two"'],
    keysPressed: 'ci"',
    end: ['"|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' with a single escaped quote behind",
    start: ['one "two \\" |three"'],
    keysPressed: 'ci"',
    end: ['one "|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' with an escaped backslash",
    start: ['one "tw|o \\\\three"'],
    keysPressed: 'ci"',
    end: ['one "|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' with an escaped backslash on closing quote",
    start: ['"\\\\|"'],
    keysPressed: 'ci"',
    end: ['"|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ca\"' starting on the closing quote",
    start: ['one "two|"'],
    keysPressed: 'ca"',
    end: ['one|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ci\"' with complex escape sequences",
    start: ['"two|\\\\\\""'],
    keysPressed: 'ci"',
    end: ['"|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can pick the correct open quote between two strings for 'ci\"'",
    start: ['"one" |"two"'],
    keysPressed: 'ci"',
    end: ['"one" "|"'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'will fail when ca" ahead of quoted string',
    start: ['"one" |two'],
    keysPressed: 'ca"',
    end: ['"one" |two'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'ca`' inside word",
    start: ['one `t|wo`'],
    keysPressed: 'ca`',
    end: ['one|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'can handle cj',
    start: ['|abc', 'def', 'ghi'],
    keysPressed: 'cjasdf<Esc>',
    end: ['asd|f', 'ghi'],
  });

  newTest({
    title: 'can handle ck',
    start: ['abc', '|def', 'ghi'],
    keysPressed: 'ckasdf<Esc>',
    end: ['asd|f', 'ghi'],
  });

  newTest({
    title: 'can handle c2j',
    start: ['|abc', 'foo', 'bar', 'ghi'],
    keysPressed: 'c2jasdf<Esc>',
    end: ['asd|f', 'ghi'],
  });

  newTest({
    title: 'can handle c2k',
    start: ['abc', 'foo', 'ba|r', 'ghi'],
    keysPressed: 'c2kasdf<Esc>',
    end: ['asd|f', 'ghi'],
  });

  newTest({
    title: 'can handle cj on last line',
    start: ['abc', 'foo', 'bar', 'gh|i'],
    keysPressed: 'cjasdf<Esc>',
    end: ['abc', 'foo', 'bar', 'asd|f'],
  });

  newTest({
    title: 'can handle ck on first line',
    start: ['|abc', 'foo', 'bar', 'ghi'],
    keysPressed: 'ckasdf<Esc>',
    end: ['asd|f', 'foo', 'bar', 'ghi'],
  });

  newTest({
    title: 'can handle c2j on last line',
    start: ['abc', 'foo', 'bar', 'gh|i'],
    keysPressed: 'c2jasdf<Esc>',
    end: ['abc', 'foo', 'bar', 'asd|f'],
  });

  newTest({
    title: 'can handle c2k on first line',
    start: ['a|bc', 'foo', 'bar', 'ghi'],
    keysPressed: 'c2kasdf<Esc>',
    end: ['asd|f', 'foo', 'bar', 'ghi'],
  });

  newTest({
    title: "Can handle 'daw' on word with cursor inside spaces",
    start: ['one   two |  three,   four  '],
    keysPressed: 'daw',
    end: ['one   two|,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on word with trailing spaces",
    start: ['one   tw|o   three,   four  '],
    keysPressed: 'daw',
    end: ['one   |three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on word with leading spaces",
    start: ['one   two   th|ree,   four  '],
    keysPressed: 'daw',
    end: ['one   two|,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on word with numeric prefix",
    start: ['on|e   two   three,   four  '],
    keysPressed: 'd3aw',
    end: ['|,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on word with numeric prefix and across lines",
    start: ['one   two   three,   fo|ur  ', 'five  six'],
    keysPressed: 'd2aw',
    end: ['one   two   three,   |six'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on word with numeric prefix and across lines",
    start: ['one two fo|ur', 'five  six'],
    keysPressed: 'd2aw',
    end: ['one two |six'],
    endMode: Mode.Normal,
  });

  newTest({
    title:
      "Can handle 'daw' on word with numeric prefix and across lines, containing words end with `.`",
    start: ['one   two   three,   fo|ur  ', 'five.  six'],
    keysPressed: 'd2aw',
    end: ['one   two   three,   |.  six'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on word with numeric prefix and across lines with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'd2aw',
    end: ['one   two   three', '|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on end of word",
    start: ['one   two   three   fou|r'],
    keysPressed: 'daw',
    end: ['one   two   thre|e'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daw' on words at beginning of line with leading whitespace",
    start: ['if (something){', '  |this.method();'],
    keysPressed: 'daw',
    end: ['if (something){', '  |.method();'],
  });

  newTest({
    title: "Can handle 'daw' on words at ends of lines in the middle of whitespace",
    start: ['one two | ', 'four'],
    keysPressed: 'daw',
    end: ['one tw|o'],
  });

  newTest({
    title: "Can handle 'daw' on word at beginning of file",
    start: ['o|ne'],
    keysPressed: 'daw',
    end: ['|'],
  });

  newTest({
    title: "Can handle 'daw' on word at beginning of line",
    start: ['one two', 'th|ree'],
    keysPressed: 'daw',
    end: ['one two', '|'],
  });

  newTest({
    title: "Can handle 'daw' on word at end of line with trailing whitespace",
    start: ['one tw|o  ', 'three four'],
    keysPressed: 'daw',
    end: ['one| ', 'three four'],
  });

  newTest({
    title: "Can handle 'daw' around word at end of line",
    start: ['one t|wo', ' three'],
    keysPressed: 'daw',
    end: ['on|e', ' three'],
  });

  newTest({
    title: "Can handle 'daw' on line with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'daw',
    end: ['one   two   three', '| five'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on big word with cursor inside spaces",
    start: ['one   two |  three,   four  '],
    keysPressed: 'daW',
    end: ['one   two|   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' around word at whitespace",
    start: ['<div  | class="btn"> foo'],
    keysPressed: 'daW',
    end: ['<div| foo'],
  });

  newTest({
    title: "Can handle 'daW' on word with trailing spaces",
    start: ['one   tw|o   three,   four  '],
    keysPressed: 'daW',
    end: ['one   |three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on word with leading spaces",
    start: ['one   two   th|ree,   four  '],
    keysPressed: 'daW',
    end: ['one   two   |four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on word with numeric prefix",
    start: ['on|e   two   three,   four  '],
    keysPressed: 'd3aW',
    end: ['|four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on word with numeric prefix and across lines",
    start: ['one   two   three,   fo|ur  ', 'five.  six'],
    keysPressed: 'd2aW',
    end: ['one   two   three,   |six'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on word with numeric prefix and across lines with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'd2aW',
    end: ['one   two   three', '|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on beginning of word",
    start: ['one |two three'],
    keysPressed: 'daW',
    end: ['one |three'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on end of one line",
    start: ['one |two'],
    keysPressed: 'daW',
    end: ['on|e'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' on line with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'daW',
    end: ['one   two   three', '| five'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'daW' around word at the last WORD (t|wo)",
    start: ['one t|wo', ' three'],
    keysPressed: 'daW',
    end: ['on|e', ' three'],
  });

  newTest({
    title: "Can handle 'daW' around word at the last WORD (tw|o)",
    start: ['one tw|o', ' three'],
    keysPressed: 'daW',
    end: ['on|e', ' three'],
  });

  newTest({
    title: 'Can handle \'daW\' around word at the last WORD (class="btn"|>)',
    start: ['<div class="btn"|>', 'foo'],
    keysPressed: 'daW',
    end: ['<di|v', 'foo'],
  });

  newTest({
    title: 'Can handle \'daW\' around word at the last WORD of the end of document (class="btn"|>)',
    start: ['<div class="btn"|>'],
    keysPressed: 'daW',
    end: ['<di|v'],
  });

  newTest({
    title: 'Can handle \'daW\' around word at the last WORD (c|lass="btn">)',
    start: ['<div c|lass="btn">', 'foo'],
    keysPressed: 'daW',
    end: ['<di|v', 'foo'],
  });

  newTest({
    title: 'Can handle \'daW\' around word at the last WORD of the end of document (c|lass="btn">)',
    start: ['<div c|lass="btn">'],
    keysPressed: 'daW',
    end: ['<di|v'],
  });

  newTest({
    title: "Can handle 'diw' on word with cursor inside spaces",
    start: ['one   two |  three,   four  '],
    keysPressed: 'diw',
    end: ['one   two|three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diw' on word",
    start: ['one   tw|o   three,   four  '],
    keysPressed: 'diw',
    end: ['one   |   three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diw' on word with numeric prefix",
    start: ['on|e   two   three,   four  '],
    keysPressed: 'd3iw',
    end: ['|   three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diw' on trailing spaces at the end of line",
    start: ['one   two   three  | ', 'five  six'],
    keysPressed: 'diw',
    end: ['one   two   thre|e', 'five  six'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diw' on line with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'diw',
    end: ['one   two   three', '|', 'four five'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diw' on word with numeric prefix and across lines",
    start: ['one   two   three,   fo|ur  ', 'five  six'],
    keysPressed: 'd3iw',
    end: ['one   two   three,   |  six'],
    endMode: Mode.Normal,
  });

  newTest({
    title:
      "Can handle 'diw' on word with numeric prefix and across lines, containing words end with `.`",
    start: ['one   two   three,   fo|ur  ', 'five.  six'],
    keysPressed: 'd3iw',
    end: ['one   two   three,   |.  six'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diw' on word with numric prefix and across lines with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'd3iw',
    end: ['one   two   three', '|five'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on big word with cursor inside spaces",
    start: ['one   two |  three,   four  '],
    keysPressed: 'diW',
    end: ['one   two|three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on word with trailing spaces",
    start: ['one   tw|o,   three,   four  '],
    keysPressed: 'diW',
    end: ['one   |   three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on word with leading spaces",
    start: ['one   two   th|ree,   four  '],
    keysPressed: 'diW',
    end: ['one   two   |   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on line with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'diW',
    end: ['one   two   three', '|', 'four five'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on word with numeric prefix",
    start: ['on|e   two   three,   four  '],
    keysPressed: 'd3iW',
    end: ['|   three,   four  '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on word with numeric prefix and across lines",
    start: ['one   two   three,   fo|ur  ', 'five.  six'],
    keysPressed: 'd3iW',
    end: ['one   two   three,   |  six'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on word with numric prefix and across lines with no text",
    start: ['one   two   three', '|', 'four five'],
    keysPressed: 'd3iw',
    end: ['one   two   three', '|five'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'diW' on beginning of word",
    start: ['one |two three'],
    keysPressed: 'diW',
    end: ['one | three'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'dae'",
    start: ['Two roads diverged in a |wood, and I', 'I took the one less traveled by'],
    keysPressed: 'dae',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'dae' with caret at document's top",
    start: ['|Two roads diverged in a wood, and I', 'I took the one less traveled by'],
    keysPressed: 'dae',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'dae' with caret at document's end",
    start: ['Two roads diverged in a wood, and I', 'I took the one less traveled by|'],
    keysPressed: 'dae',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'die' on blank content",
    start: ['|'],
    keysPressed: 'die',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'die' with leading space",
    start: [
      '     ',
      '    ',
      '|Two roads diverged in a wood, and I',
      'I took the one less traveled by',
    ],
    keysPressed: 'die',
    end: ['     ', '    ', '|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'die' with trailing space",
    start: [
      'Two roads |diverged in a wood, and I',
      'I took the one less traveled by',
      '    ',
      '   ',
    ],
    keysPressed: 'die',
    end: ['|', '    ', '   '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'die' with both leading and trailing space",
    start: [
      '  ',
      ' ',
      'Two roads diverged in a |wood, and I',
      'I took the one less traveled by',
      '    ',
      '   ',
    ],
    keysPressed: 'die',
    end: ['  ', ' ', '|', '    ', '   '],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'die' on blank content",
    start: ['|'],
    keysPressed: 'die',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle d} at beginning of line',
    start: ['|foo', 'bar', '', 'fun'],
    keysPressed: 'd}',
    end: ['|', 'fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle y} at beginning of line',
    start: ['|foo', 'bar', '', 'fun'],
    keysPressed: 'y}p',
    end: ['foo', '|foo', 'bar', 'bar', '', 'fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle d} when not at beginning of line',
    start: ['f|oo', 'bar', '', 'fun'],
    keysPressed: 'd}',
    end: ['|f', '', 'fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle } with operator and count, at beginning of line',
    start: ['|foo', '', 'bar', '', 'fun'],
    keysPressed: 'd2}',
    end: ['|', 'fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle } with operator and count, and not at beginning of line',
    start: ['f|oo', '', 'bar', '', 'fun'],
    keysPressed: 'd2}',
    end: ['|f', '', 'fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle dip',
    start: ['foo', '', 'bar baz', 'bar |baz', '', 'fun'],
    keysPressed: 'dip',
    end: ['foo', '', '|', 'fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle dip on empty lines',
    start: ['foo', '', '|', '', 'fun'],
    keysPressed: 'dip',
    end: ['foo', '|fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle dap',
    start: ['foo', '', 'bar baz', 'bar |baz', '', 'fun'],
    keysPressed: 'dap',
    end: ['foo', '', '|fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle dap with two blank lines',
    start: ['foo', '', 'bar baz', 'bar |baz', '', '', 'fun'],
    keysPressed: 'dap',
    end: ['foo', '', '|fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle dap one single line with two blank lines',
    start: ['foo', '', 'bar |baz', '', '', 'fun'],
    keysPressed: 'dap',
    end: ['foo', '', '|fun'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Select sentence with trailing spaces',
    start: ["That's my sec|ret, Captain. I'm always angry."],
    keysPressed: 'das',
    end: ["|I'm always angry."],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Select sentence with leading spaces',
    start: ["That's my secret, Captain. I'm a|lways angry."],
    keysPressed: 'das',
    end: ["That's my secret, Captain|."],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Select inner sentence with trailing spaces',
    start: ["That's my sec|ret, Captain. I'm always angry."],
    keysPressed: 'dis',
    end: ["| I'm always angry."],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Select inner sentence with leading spaces',
    start: ["That's my secret, Captain. I'm a|lways angry."],
    keysPressed: 'dis',
    end: ["That's my secret, Captain.| "],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Select spaces between sentences',
    start: ["That's my secret, Captain.  |  I'm always angry."],
    keysPressed: 'visd',
    end: ["That's my secret, Captain.|I'm always angry."],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'df'",
    start: ['aext tex|t'],
    keysPressed: '^dft',
    end: ['| text'],
  });

  newTest({
    title: "Can handle 'dt'",
    start: ['aext tex|t'],
    keysPressed: '^dtt',
    end: ['|t text'],
  });

  for (const key of ['<BS>', '<C-BS>', '<S-BS>']) {
    newTest({
      title: `${key} moves one character to the left`,
      start: ['text |text'],
      keysPressed: key,
      end: ['text| text'],
    });

    newTest({
      title: `${key} goes across line boundaries when 'whichwrap' contains 'b'`,
      config: { whichwrap: 'b' },
      start: ['one', '|two'],
      keysPressed: key,
      end: ['on|e', 'two'],
    });

    newTest({
      title: `${key} does not go across line boundaries when 'whichwrap' does not contain 'b'`,
      config: { whichwrap: '' },
      start: ['one', '|two'],
      keysPressed: key,
      end: ['one', '|two'],
    });
  }

  newTest({
    title: 'Can handle A and backspace',
    start: ['|text text'],
    keysPressed: 'A<BS><Esc>',
    end: ['text te|x'],
  });

  newTest({
    title: 'A should update desiredColumn',
    start: ['|longer line', 'short'],
    keysPressed: 'A<Esc>jk',
    end: ['longer lin|e', 'short'],
  });

  newTest({
    title: 'I should updated desiredColumn',
    start: ['     hell|o', 'a'],
    keysPressed: 'I<Esc>jk',
    end: ['    | hello', 'a'],
  });

  newTest({
    title: 'leaving insert mode should update desired column when entered with a',
    start: ['a long line of text', 'shor|t'],
    keysPressed: 'amore<Esc>kj',
    end: ['a long line of text', 'shortmor|e'],
  });

  newTest({
    title: 'leaving insert mode should update desired column when entered with i',
    start: ['a long line of text', 'shor|t'],
    keysPressed: 'imore<Esc>kj',
    end: ['a long line of text', 'shormor|et'],
  });

  newTest({
    title: "Can handle 'yy' without changing cursor position",
    start: ['one', 'tw|o'],
    keysPressed: 'yy',
    end: ['one', 'tw|o'],
  });

  suite('I', () => {
    newTest({
      title: 'I enters insert mode at start of line after any whitespace',
      start: ['  on|e'],
      keysPressed: 'I',
      end: ['  |one'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '[count]I',
      start: ['  on|e'],
      keysPressed: '2Itest<Esc>',
      end: ['  testtes|tone'],
    });
  });

  suite('gI', () => {
    newTest({
      title: 'gI enters insert mode at start of line',
      start: ['    o|ne'],
      keysPressed: 'gItest',
      end: ['test|    one'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '[count]gI',
      start: ['    o|ne'],
      keysPressed: '3gIab<Esc>',
      end: ['ababa|b    one'],
      endMode: Mode.Normal,
    });
  });

  suite('gi', () => {
    newTest({
      title: '`gi` enters insert mode at point of last insertion',
      start: ['|'],
      keysPressed: 'ione<Esc>otwo<Esc>0gi',
      end: ['one', 'two|'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`[count]gi`',
      start: ['|'],
      keysPressed: 'ione<Esc>otwo<Esc>03giab<Esc>',
      end: ['one', 'twoababa|b'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "`gi` enters insert mode at start of document if there's no prior insertion",
      start: ['one', 'two', 'thr|ee'],
      keysPressed: 'gi',
      end: ['|one', 'two', 'three'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`gi` after (c)hange',
      start: ['one |two three'],
      keysPressed: 'cwab<Esc>0gi',
      end: ['one ab| three'],
      endMode: Mode.Insert,
    });
  });

  suite('g;', () => {
    newTest({
      title: 'g; before any changes throws E664',
      start: ['one t|wo three'],
      keysPressed: 'g;',
      end: ['one t|wo three'],
      statusBar: 'E664: changelist is empty',
    });

    newTest({
      title: 'g; works correctly after insert',
      start: ['one', 'tw|o', 'three'],
      keysPressed: 'iXYZ<Esc>Gg;',
      end: ['one', 'twXY|Zo', 'three'],
    });

    newTest({
      title: 'g; works correctly after delete',
      start: ['one', 'two', 'th|ree'],
      keysPressed: 'xggg;',
      end: ['one', 'two', 'th|ee'],
    });

    newTest({
      title: 'g; works correctly after change',
      start: ['one', 'two', 'th|ree'],
      keysPressed: 'clXYZ<Esc>ggg;',
      end: ['one', 'two', 'thXY|Zee'],
    });

    // TODO: Test with multiple changes
  });

  newTest({
    title: 'g, before any changes throws E664',
    start: ['one t|wo three'],
    keysPressed: 'g,',
    end: ['one t|wo three'],
    statusBar: 'E664: changelist is empty',
  });

  newTest({
    title: 'g, works correctly',
    start: ['|'],
    keysPressed: 'ione<Esc>atwo<Esc>g;g;g,',
    end: ['onetw|o'],
  });

  newTest({
    title: 'g_ works correctly',
    start: ['te|sttest'],
    keysPressed: 'g_',
    end: ['testtes|t'],
  });

  newTest({
    title: '3g_ works correctly',
    start: ['tes|ttest', 'testtest', 'testtest'],
    keysPressed: '3g_',
    end: ['testtest', 'testtest', 'testtes|t'],
  });

  newTest({
    title: 'gq handles spaces after single line comments correctly',
    start: [
      '//    We choose to write a vim extension, not because it is easy, but because it is hard|.',
    ],
    keysPressed: 'Vgq',
    end: [
      '//    We choose to write a vim extension, not because it is easy, but because it',
      '|//    is hard.',
    ],
  });

  newTest({
    title: 'gq handles spaces before single line comments correctly',
    start: [
      '    // We choose to write a vim extension, not because it is easy, but because it is hard|.',
    ],
    keysPressed: 'Vgq',
    end: [
      '    // We choose to write a vim extension, not because it is easy, but because',
      '|    // it is hard.',
    ],
  });

  newTest({
    title: 'gq handles tabs before single line comments correctly',
    start: [
      '\t\t// We choose to write a vim extension, not because it is easy, but because it is hard|.',
    ],
    keysPressed: 'Vgq',
    end: [
      '\t\t// We choose to write a vim extension, not because it is easy, but',
      '|\t\t// because it is hard.',
    ],
  });

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq work correctly with cursor in the middle of a line',
      start: [
        '// We choose to write a vim extension, not |because it is easy, but because it is hard.',
        '// We choose to write a vim extension, not because it is easy, but because it is hard.',
      ],
      keysPressed: 'gqj',
      end: [
        '|// We choose to write a vim extension, not because it is easy, but because it is',
        '// hard.  We choose to write a vim extension, not because it is easy, but',
        '// because it is hard.',
      ],
    },
    process.platform === 'win32',
  );

  newTest({
    title: 'gq preserves newlines',
    start: ['|abc', '', '', '', 'def'],
    keysPressed: 'gqG',
    end: ['|abc', '', '', '', 'def'],
  });

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq handles single-line comments',
      start: ['|// abc', '// def'],
      keysPressed: 'gqG',
      end: ['|// abc def'],
    },
    process.platform === 'win32',
  );

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq handles multiline comments',
      start: ['|/*', ' * abc', ' * def', ' */'],
      keysPressed: 'gqG',
      end: ['|/*', ' * abc def', ' */'],
    },
    process.platform === 'win32',
  );

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq handles multiline comments with inner and final on same line',
      start: ['|/*', ' * abc', ' * def */'],
      keysPressed: 'gqG',
      end: ['|/*', ' * abc def */'],
    },
    process.platform === 'win32',
  );

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq handles multiline comments with content on start line',
      start: ['|/* abc', ' * def', '*/'],
      keysPressed: 'gqG',
      end: ['|/* abc def', ' */'],
    },
    process.platform === 'win32',
  );

  newTest({
    title: 'gq handles multiline comments with start and final on same line',
    start: ['|/* abc def */'],
    keysPressed: 'gqG',
    end: ['|/* abc def */'],
  });

  newTest({
    title: 'gq preserves blank lines in multiline comments',
    start: ['|/* abc', ' *', ' *', ' * def */'],
    keysPressed: 'gqG',
    end: ['|/* abc', ' *', ' *', ' * def */'],
  });

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq does not merge adjacent multiline comments',
      start: ['|/* abc */', '/* def */'],
      keysPressed: 'gqG',
      end: ['|/* abc */', '/* def */'],
    },
    process.platform === 'win32',
  );

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq does not merge adjacent multiline comments',
      start: ['|/* abc', ' */', '/* def', ' */'],
      keysPressed: 'gqG',
      end: ['|/* abc', ' */', '/* def', ' */'],
    },
    process.platform === 'win32',
  );

  // TODO(#4844): this fails on Windows
  newTestSkip(
    {
      title: 'gq leaves alone whitespace within a line',
      start: ["|Good morning, how are you?  I'm Dr. Worm.", "I'm interested", 'in      things.'],
      keysPressed: 'gqG',
      end: ["|Good morning, how are you?  I'm Dr. Worm.  I'm interested in      things."],
    },
    process.platform === 'win32',
  );

  newTest({
    title: 'gq breaks at exactly textwidth',
    start: [
      '|1 3 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9x split',
    ],
    keysPressed: 'gqG',
    end: [
      '|1 3 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9x',
      'split',
    ],
  });

  newTest({
    title: 'gq breaks before textwidth',
    start: [
      '|1 3 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9xs split',
    ],
    keysPressed: 'gqG',
    end: [
      '|1 3 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7',
      '9xs split',
    ],
  });

  newTest({
    title: 'gq breaks at exactly textwidth with indent and comment',
    start: [
      '| // 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9xs split',
    ],
    keysPressed: 'gqG',
    end: [
      '| // 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9',
      ' // 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7 9',
      ' // 5 7 911 3 5 7 921 3 5 7 931 3 5 7 941 3 5 7 951 3 5 7 961 3 5 7 971 3 5 7',
      ' // 9xs split',
    ],
  });

  newTest({
    title: 'gq breaks around long words',
    start: [
      '|this is a suuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuper long looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong                    word',
    ],
    keysPressed: 'gqG',
    end: [
      '|this is a',
      'suuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuper',
      'long looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong',
      'word',
    ],
  });

  newTest({
    title: '<Space> moves cursor one character right',
    start: ['|abc', 'def'],
    keysPressed: ' ',
    end: ['a|bc', 'def'],
  });

  newTest({
    title: "<Space> goes over line break when whichwrap includes 's'",
    config: { whichwrap: 's' },
    start: ['ab|c', 'def'],
    keysPressed: ' ',
    end: ['abc', '|def'],
  });

  newTest({
    title: "<Space> does not go over line break when whichwrap does not include 's'",
    config: { whichwrap: '' },
    start: ['ab|c', 'def'],
    keysPressed: ' ',
    end: ['ab|c', 'def'],
  });

  newTest({
    title: 'Can handle u',
    start: ['|ABC DEF'],
    keysPressed: 'vwu',
    end: ['|abc dEF'],
  });

  newTest({
    title: 'Can handle guw',
    start: ['|ABC DEF'],
    keysPressed: 'guw',
    end: ['|abc DEF'],
  });

  newTest({
    title: 'Can handle guae',
    start: ['|ABC', 'DEF', 'GHI'],
    keysPressed: 'guae',
    end: ['|abc', 'def', 'ghi'],
  });

  newTest({
    title: 'Can handle guie',
    start: [' ', ' ', '|ABC', 'DEF', 'GHI'],
    keysPressed: 'guie',
    end: [' ', ' ', '|abc', 'def', 'ghi'],
  });

  newTest({
    title: 'Can handle gUw',
    start: ['|abc def'],
    keysPressed: 'gUw',
    end: ['|ABC def'],
  });

  newTest({
    title: 'Can handle gUae',
    start: ['|Abc', 'def', 'GhI'],
    keysPressed: 'gUae',
    end: ['|ABC', 'DEF', 'GHI'],
  });

  newTest({
    title: 'Can handle gUie',
    start: [' ', ' ', '|abc', 'def', 'ghi'],
    keysPressed: 'gUie',
    end: [' ', ' ', '|ABC', 'DEF', 'GHI'],
  });

  newTest({
    title: 'Can handle u over line breaks',
    start: ['|ABC', 'DEF'],
    keysPressed: 'vG$u',
    end: ['|abc', 'def'],
  });

  newTest({
    title: 'can handle s in visual mode',
    start: ['|abc def ghi'],
    keysPressed: 'vwshi <Esc>',
    end: ['hi| ef ghi'],
  });

  newTest({
    title: 'can repeat backspace twice',
    start: ['|11223344'],
    keysPressed: 'A<BS><BS><Esc>0.',
    end: ['112|2'],
  });

  newTest({
    title: 'Can repeat dw',
    start: ['one |two three four'],
    keysPressed: 'dw.',
    end: ['one |four'],
  });

  newTest({
    title: 'Can repeat dw with count',
    start: ['one |two three four five'],
    keysPressed: 'dw2.',
    end: ['one |five'],
  });

  newTest({
    title: "Can handle 'dW' on last character of word",
    start: ['first secon|d third fourth'],
    keysPressed: 'dW',
    end: ['first secon|third fourth'],
  });

  newTest({
    title: 'can delete linewise with d2G',
    start: ['on|e', 'two', 'three'],
    keysPressed: 'd2G',
    end: ['|three'],
  });

  newTest({
    title: 'can delete linewise with d2gg',
    start: ['on|e', 'two', 'three'],
    keysPressed: 'd2gg',
    end: ['|three'],
  });

  newTest({
    title: 'can delete linewise with d2gg backwards',
    start: ['one', 'two', 'thr|ee', 'four'],
    keysPressed: 'd2gg',
    end: ['one', '|four'],
  });

  newTest({
    title: 'can delete with + motion and count',
    start: ['one', 'two', 'three', 'fo|ur', 'five', 'six', 'seven'],
    keysPressed: 'd2+',
    end: ['one', 'two', 'three', '|seven'],
  });

  newTest({
    title: 'can delete with - motion and count',
    start: ['one', 'two', 'three', 'four', 'five', 's|ix', 'seven'],
    keysPressed: 'd3-',
    end: ['one', 'two', '|seven'],
  });

  newTest({
    title: 'can delete with count before and after operator, 2d12w deletes 24 words',
    start: [
      '|one two three four five six seven eight nine ten',
      'one two three four five six seven eight nine ten',
      'one two three four five six seven eight nine ten',
    ],
    keysPressed: '2d12w',
    end: ['|five six seven eight nine ten'],
  });

  newTest({
    title: 'can dE correctly',
    start: ['|one two three'],
    keysPressed: 'dE',
    end: ['| two three'],
  });

  newTest({
    title: 'can dE correctly',
    start: ['|one((( two three'],
    keysPressed: 'dE',
    end: ['| two three'],
  });

  newTest({
    title: 'can dE correctly',
    start: ['one two |three'],
    keysPressed: 'dE',
    end: ['one two| '],
  });

  newTest({
    title: 'can do Y',
    start: ['|blah blah'],
    keysPressed: 'Yp',
    end: ['blah blah', '|blah blah'],
  });

  newTest({
    title: 'can do [count]Y',
    start: ['|one', 'two', 'three'],
    keysPressed: '2Yp',
    end: ['one', '|one', 'two', 'two', 'three'],
  });

  newTest({
    title: 'can do [count]Y if count is larger than EOF',
    start: ['|one', 'two', 'three'],
    keysPressed: '100Yp',
    end: ['one', '|one', 'two', 'three', 'two', 'three'],
  });

  newTest({
    title: 'Can do S',
    start: ['    one', '    tw|o', '    three'],
    keysPressed: '2S',
    end: ['    one', '    |'],
  });

  newTest({
    title: 'Can do C',
    start: ['export const options = {', '|', '};'],
    keysPressed: 'C',
    end: ['export const options = {', '|', '};'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cit on a matching tag',
    start: ['<blink>he|llo</blink>'],
    keysPressed: 'cit',
    end: ['<blink>|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Ignores cit on a non-matching tag',
    start: ['<blink>he|llo</unblink>'],
    keysPressed: 'cit',
    end: ['<blink>he|llo</unblink>'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Ignores cit on a nested tag',
    start: ['<blink>he|llo<hello></blink>'],
    keysPressed: 'cit',
    end: ['<blink>|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cit on a tag with an attribute tag',
    start: ['<blink |level="extreme">hello</blink>'],
    keysPressed: 'cit',
    end: ['<blink level="extreme">|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cat on a matching tag',
    start: ['one <blink>he|llo</blink> two'],
    keysPressed: 'cat',
    end: ['one | two'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cit on a multiline tag',
    start: [' <blink>\nhe|llo\ntext</blink>'],
    keysPressed: 'cit',
    end: [' <blink>|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cit on a multiline tag with nested tags',
    start: [' <blink>\n<h1>hello</h1>\nh<br>e|llo\nte</h1>xt</blink>'],
    keysPressed: 'cit',
    end: [' <blink>|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cit inside of a tag with another non closing tag inside tags',
    start: ['<blink>hello<br>wo|rld</blink>'],
    keysPressed: 'cit',
    end: ['<blink>|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cit inside of a tag with another empty closing tag inside tags',
    start: ['<blink>hel|lo</h1>world</blink>'],
    keysPressed: 'cit',
    end: ['<blink>|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do dit on empty tag block, cursor moves to inside',
    start: ['<bli|nk></blink>'],
    keysPressed: 'dit',
    end: ['<blink>|</blink>'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do cit on empty tag block, cursor moves to inside',
    start: ['<bli|nk></blink>'],
    keysPressed: 'cit',
    end: ['<blink>|</blink>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'can do cit with self closing tags',
    start: ['<div><div a=1/>{{c|ursor here}}</div>'],
    keysPressed: 'cit',
    end: ['<div>|</div>'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'yk moves cursor up',
    start: ['one', 't|wo', 'three'],
    keysPressed: 'yk',
    end: ['o|ne', 'two', 'three'],
  });

  newTest({
    title: 'yh moves cursor left',
    start: ['one', 'two', 'thr|ee'],
    keysPressed: 'yh',
    end: ['one', 'two', 'th|ree'],
  });

  newTest({
    title: 'yat yanks the correct tag when inside one',
    start: ['<foo>', '  <b|ar>asd</bar>', '</foo>'],
    keysPressed: 'yat$p',
    end: ['<foo>', '  <bar>asd</bar><bar>asd</bar|>', '</foo>'],
  });

  newTest({
    title: 'yat yanks the correct tag when cursor is on the opening angle bracket',
    start: ['<foo>', '  |<bar>asd</bar>', '</foo>'],
    keysPressed: 'yat$p',
    end: ['<foo>', '  <bar>asd</bar><bar>asd</bar|>', '</foo>'],
  });

  newTest({
    title: 'yat yanks the correct tag when cursor is between the beginning of the line and the tag',
    start: ['<foo>', ' | <bar>asd</bar>', '</foo>'],
    keysPressed: 'yat$p',
    end: ['<foo>', '  <bar>asd</bar><bar>asd</bar|>', '</foo>'],
  });

  newTest({
    title:
      'dat deletes the outer tag when there are other characters (not just WS) before the opening tag',
    start: ['<foo>', 'a | <bar>asd</bar>', '</foo>'],
    keysPressed: 'dat',
    end: ['|'],
  });

  newTest({
    title: 'dat deletes the outer tag when the cursor is after the inner tag',
    start: ['<foo>', '  <bar>asd</bar> |', '</foo>'],
    keysPressed: 'dat',
    end: ['|'],
  });

  newTest({
    title: 'Respects indentation with cc',
    start: ['{', '  int| a;'],
    keysPressed: 'cc',
    end: ['{', '  |'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Resets cursor to indent end with cc',
    start: ['{', ' | int a;'],
    keysPressed: 'cc',
    end: ['{', '  |'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "can handle 'cc' on empty line",
    start: ['foo', '|', 'bar'],
    keysPressed: 'cc',
    end: ['foo', '|', 'bar'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'cc copies linewise',
    start: ['foo', '|fun', 'bar'],
    keysPressed: 'cc<Esc>jp',
    end: ['foo', '', 'bar', '|fun'],
  });

  newTest({
    title: 'Vc preserves indentation of first line',
    start: ['one', '  t|wo', '      three', 'four'],
    keysPressed: 'Vj' + 'c',
    end: ['one', '  |', 'four'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'cj preserves indentation of first line',
    start: ['one', '  t|wo', '      three', 'four'],
    keysPressed: 'cj',
    end: ['one', '  |', 'four'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Indent current line with correct Vim Mode',
    start: ['|one', 'two'],
    keysPressed: '>>',
    end: ['\t|one', 'two'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can handle <Esc> and do nothing',
    start: ['te|st'],
    keysPressed: '<Esc>',
    end: ['te|st'],
  });

  newTest({
    title: 'Can handle # on consecutive words',
    start: ['test test test test |test'],
    keysPressed: '#',
    end: ['test test test |test test'],
  });

  newTest({
    title: 'Can handle # on skipped words',
    start: ['test aaa test aaa test aaa test aaa |test'],
    keysPressed: '#',
    end: ['test aaa test aaa test aaa |test aaa test'],
  });

  newTest({
    title: "Can 'D'elete the characters under the cursor until the end of the line",
    start: ['test aaa test aaa test aaa test |aaa test'],
    keysPressed: 'D',
    end: ['test aaa test aaa test aaa test| '],
  });

  newTest({
    title: "Can 'D'elete the characters under multiple cursors until the end of the line",
    start: [
      'test aaa test aaa test aaa test |aaa test',
      'test aaa test aaa test aaa test aaa test',
    ],
    keysPressed: '<C-alt+down>D<Esc>',
    end: ['test aaa test aaa test aaa test| ', 'test aaa test aaa test aaa test '],
  });

  newTest({
    title: 'cc on whitespace-only treats whitespace as indent',
    start: ['|     '],
    keysPressed: 'cc',
    end: ['     |'],
  });

  newTest({
    title: 'Can do cai',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'cai',
    end: ['|', 'do_something_else()'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do cii',
    start: ['if foo > 3:', '\tlog("foo is big")', '\tfoo = 3', '|', 'do_something_else()'],
    keysPressed: 'cii',
    end: ['if foo > 3:', '\t|', 'do_something_else()'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do caI',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'caI',
    end: ['|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can do dai',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'dai',
    end: ['|do_something_else()'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do dii',
    start: ['if foo > 3:', '    log("foo is big")', '    foo = 3', '|', 'do_something_else()'],
    keysPressed: 'dii',
    end: ['if foo > 3:', '|do_something_else()'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do daI',
    start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
    keysPressed: 'daI',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Will fail 'cia' with no delimiters",
    start: ['f|oo'],
    keysPressed: 'cia',
    end: ['f|oo'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Will fail 'cia' with flipped delimiters",
    start: [')f|oo('],
    keysPressed: 'cia',
    end: [')f|oo('],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Will fail 'cia' with separators but no delimiters",
    start: ['alpha,', 'b|eta,', 'gamma'],
    keysPressed: 'cia',
    end: ['alpha,', 'b|eta,', 'gamma'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can do 'cia' in a single argument",
    start: ['(f|oo)'],
    keysPressed: 'cia',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in () with cursor at opening delimiter",
    start: ['|()'],
    keysPressed: 'cia',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in () with cursor at closing delimiter",
    start: ['(|)'],
    keysPressed: 'cia',
    end: ['(|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,) with cursor at opening delimiter",
    start: ['|(,)'],
    keysPressed: 'cia',
    end: ['(|,)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,) with cursor at regular delimiter",
    start: ['(|,)'],
    keysPressed: 'cia',
    end: ['(,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,) with cursor at closing delimiter",
    start: ['(,|)'],
    keysPressed: 'cia',
    end: ['(,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,,,) with cursor at regular delimiter",
    start: ['(|,,,)'],
    keysPressed: 'cia',
    end: ['(,|,,)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,,,) with cursor at second-to-last delimiter",
    start: ['(,,|,)'],
    keysPressed: 'cia',
    end: ['(,,,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in (,,,) with cursor at closing delimiter",
    start: ['(,,,|)'],
    keysPressed: 'cia',
    end: ['(,,,|)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' with nested parentheses in argument",
    start: ['(foo, (void*) ba|r(Foo<T>), baz)'],
    keysPressed: 'cia',
    end: ['(foo, |, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor in first argument",
    start: ['(f|oo, bar, baz)'],
    keysPressed: 'cia',
    end: ['(|, bar, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor on opening delimiter",
    start: ['|(foo, bar, baz)'],
    keysPressed: 'cia',
    end: ['(|, bar, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor in middle argument",
    start: ['(foo, ba|r, baz)'],
    keysPressed: 'cia',
    end: ['(foo, |, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor on regular delimiter",
    start: ['(foo|, bar, baz)'],
    keysPressed: 'cia',
    end: ['(foo, |, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor in last argument",
    start: ['(foo, bar, b|az)'],
    keysPressed: 'cia',
    end: ['(foo, bar, |)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a single-line comma seperated list with cursor on closing delimiter",
    start: ['(foo, bar, baz|)'],
    keysPressed: 'cia',
    end: ['(foo, bar, |)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a whitespace-only argument",
    start: ['(foo, | , baz)'],
    keysPressed: 'cia',
    end: ['(foo,|, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a whitespace-only argument across multiple lines",
    start: ['(foo,', '  ', ' | ', '  ', ' , baz)'],
    keysPressed: 'cia',
    end: ['(foo,|, baz)'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' with trailing whitespace after separator",
    start: ['(', '   foo, ', '   b|ar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo, ', '   |,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' with trailing whitespace after separator and empty line",
    start: ['(', '   foo, ', '    ', '   b|ar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo, ', '    ', '   |,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multiline-line comma seperated list with cursor in first argument",
    start: ['(', '   f|oo,', '   bar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   |,', '   bar,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multiline-line comma seperated list with cursor in center argument",
    start: ['(', '   foo,', '   b|ar,', '   baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo,', '   |,', '   baz', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multiline-line comma seperated list with cursor in last argument",
    start: ['(', '   foo,', '   bar,', '   |baz', ')'],
    keysPressed: 'cia',
    end: ['(', '   foo,', '   bar,', '   |', ')'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'cia' in a multi-line indented statement with one argument.",
    start: ['   functionCall(', '      fo|o', '   )'],
    keysPressed: 'cia',
    end: ['   functionCall(', '      |', '   )'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can do 'daa' in a single argument",
    start: ['(f|oo)'],
    keysPressed: 'daa',
    end: ['(|)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Will fail 'daa' in ()",
    start: ['(|)'],
    keysPressed: 'daa',
    end: ['(|)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can do 'daa' in a single-line comma seperated list with cursor in first argument",
    start: ['(f|oo, bar, baz)'],
    keysPressed: 'daa',
    end: ['(|bar, baz)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can do 'daa' in a single-line comma seperated list with cursor in middle argument",
    start: ['(foo, b|ar, baz)'],
    keysPressed: 'daa',
    end: ['(foo|, baz)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can do 'daa' in a single-line comma seperated list with cursor in last argument",
    start: ['(foo, bar, |baz)'],
    keysPressed: 'daa',
    end: ['(foo, bar|)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can do 'daa' in a multiline-line comma seperated list with cursor in first argument",
    start: ['(', '   |foo,', '   bar,', '   baz', ')'],
    keysPressed: 'daa',
    end: ['|(', '   bar,', '   baz', ')'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can do 'daa' in a multiline-line comma seperated list with cursor in center argument",
    start: ['(', '   foo,', '   b|ar,', '   baz', ')'],
    keysPressed: 'daa',
    end: ['(', '   foo|,', '   baz', ')'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can do 'daa' in a multiline-line comma seperated list with cursor in last argument",
    start: ['(', '   foo,', '   bar,', '   ba|z', ')'],
    keysPressed: 'daa',
    end: ['(', '   foo,', '   ba|r', ')'],
    endMode: Mode.Normal,
  });

  suite('<C-u> / <C-d>', () => {
    newTest({
      title: 'can handle <C-u> when first line is visible and starting column is at the beginning',
      start: ['\t hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '<C-u>',
      end: ['\t |hello world', 'hello', 'hi hello', 'foo'],
    });

    newTest({
      title: 'can handle <C-u> when first line is visible and starting column is at the end',
      start: ['\t hello world', 'hello', 'hi hello', 'very long line at the bottom|'],
      keysPressed: '<C-u>',
      end: ['\t |hello world', 'hello', 'hi hello', 'very long line at the bottom'],
    });

    newTest({
      title: 'can handle <C-u> when first line is visible and starting column is in the middle',
      start: ['\t hello world', 'hello', 'hi hello', 'very long line |at the bottom'],
      keysPressed: '<C-u>',
      end: ['\t |hello world', 'hello', 'hi hello', 'very long line at the bottom'],
    });

    newTest({
      title: '[count]<C-u> sets and adheres to scroll option',
      start: ['abc', 'def', 'ghi', 'jkl', 'mno', 'pqr', 'st|u'],
      keysPressed: '2<C-u><C-u>',
      end: ['abc', 'def', '|ghi', 'jkl', 'mno', 'pqr', 'stu'],
    });

    newTest({
      title: '[count]<C-d> sets and adheres to scroll option',
      start: ['ab|c', 'def', 'ghi', 'jkl', 'mno', 'pqr', 'stu'],
      keysPressed: '2<C-d><C-d>',
      end: ['abc', 'def', 'ghi', 'jkl', '|mno', 'pqr', 'stu'],
    });
  });

  suite('<C-g>', () => {
    // TODO: test with untitled file
    // TODO: test [count]<C-g>

    suiteSetup(cleanUpWorkspace);

    newTest({
      title: '<C-g> displays info about the file in status bar (line 1 of 3)',
      start: ['o|ne', 'two', 'three'],
      keysPressed: '<C-g>',
      end: ['o|ne', 'two', 'three'],
      statusBar: '"{FILENAME}" 3 lines --33%--',
      saveDocBeforeTest: true,
    });

    newTest({
      title: '<C-g> displays info about the file in status bar (line 2 of 3)',
      start: ['one', '|two', 'three'],
      keysPressed: '<C-g>',
      end: ['one', '|two', 'three'],
      statusBar: '"{FILENAME}" 3 lines --66%--',
      saveDocBeforeTest: true,
    });

    newTest({
      title: '<C-g> displays info about the file in status bar (line 3 of 3)',
      start: ['one', 'two', 'thr|ee'],
      keysPressed: '<C-g>',
      end: ['one', 'two', 'thr|ee'],
      statusBar: '"{FILENAME}" 3 lines --100%--',
      saveDocBeforeTest: true,
    });

    newTest({
      title: '<C-g> displays info about the file in status bar (line 1 of 1)',
      start: ['o|ne'],
      keysPressed: '<C-g>',
      end: ['o|ne'],
      statusBar: '"{FILENAME}" 1 line --100%--',
      saveDocBeforeTest: true,
    });

    newTest({
      title: '<C-g> has special message for empty file',
      start: ['|'],
      keysPressed: '<C-g>',
      end: ['|'],
      statusBar: '"{FILENAME}" --No lines in buffer--',
      saveDocBeforeTest: true,
    });

    newTest({
      title: '<C-g> includes "[Modified]" when file is dirty',
      start: ['one', 't|wo', 'three'],
      keysPressed: 'x' + '<C-g>',
      end: ['one', 't|o', 'three'],
      statusBar: '"{FILENAME}" [Modified] 3 lines --66%--',
      saveDocBeforeTest: true,
    });
  });
});
