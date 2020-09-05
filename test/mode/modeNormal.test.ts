import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { TextEditor } from '../../src/textEditor';
import { Configuration } from '../testConfiguration';
import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Normal', () => {
  let modeHandler: ModeHandler;
  const { newTest, newTestOnly, newTestSkip } = getTestingFunctions();

  setup(async () => {
    const configuration = new Configuration();
    configuration.tabstop = 4;
    configuration.expandtab = false;

    await setupWorkspace(configuration);
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('Can be activated', async () => {
    const activationKeys = ['<Esc>', '<C-[>'];

    for (const key of activationKeys) {
      await modeHandler.handleKeyEvent('i');
      await modeHandler.handleKeyEvent(key);

      assert.strictEqual(modeHandler.currentMode, Mode.Normal, `${key} doesn't work.`);
    }

    await modeHandler.handleKeyEvent('v');
    await modeHandler.handleKeyEvent('v');

    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
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

  newTest({
    title: "Can handle 's'",
    start: ['tex|t'],
    keysPressed: '^sk',
    end: ['k|ext'],
    endMode: Mode.Insert,
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
    title: "Can handle 'ca\"' starting behind the quoted word",
    start: ['|one "two"'],
    keysPressed: 'ca"',
    end: ['one |'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'ca\"' starting on the opening quote",
    start: ['one |"two"'],
    keysPressed: 'ca"',
    end: ['one |'],
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
    end: ['one |'],
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
    end: ['one |'],
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

  newTest({
    title: 'Can handle backspace',
    start: ['text |text'],
    keysPressed: '<BS><BS>',
    end: ['tex|t text'],
  });

  newTest({
    title: 'Can handle backspace across lines',
    start: ['one', '|two'],
    keysPressed: '<BS><BS>',
    end: ['o|ne', 'two'],
  });

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
    title: 'Can repeat w',
    start: ['|one two three four'],
    keysPressed: '2w',
    end: ['one two |three four'],
  });

  newTest({
    title: 'Can repeat p',
    start: ['|one'],
    keysPressed: 'yy2p',
    end: ['one', '|one', 'one'],
  });

  newTest({
    title: 'I works correctly',
    start: ['|    one'],
    keysPressed: 'Itest <Esc>',
    end: ['    test| one'],
  });

  newTest({
    title: 'gI works correctly',
    start: ['|    one'],
    keysPressed: 'gItest<Esc>',
    end: ['tes|t    one'],
  });

  newTest({
    title: 'gi works correctly',
    start: ['|'],
    keysPressed: 'ione<Esc>otwo<Esc>0gi',
    end: ['one', 'two|'],
  });

  newTest({
    title: '`. works correctly',
    start: ['one|'],
    keysPressed: 'atwo<Esc>`.',
    end: ['one|two'],
  });

  newTest({
    title: "'. works correctly",
    start: ['one|'],
    keysPressed: "atwo<Esc>'.",
    end: ['one|two'],
  });

  newTest({
    title: 'g; works correctly',
    start: ['|'],
    keysPressed: 'ione<Esc>atwo<Esc>g;g;',
    end: ['one|two'],
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
      '//    We choose to write a vim extension, not because it is easy, but because it is',
      '|//    hard.',
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

  newTest({
    title: 'gq work correctly with cursor in the middle of a line',
    start: [
      '// We choose to write a vim extension, not |because it is easy, but because it is hard.',
      '// We choose to write a vim extension, not because it is easy, but because it is hard.',
    ],
    keysPressed: 'gqj',
    end: [
      '|// We choose to write a vim extension, not because it is easy, but because it is',
      '// hard. We choose to write a vim extension, not because it is easy, but because',
      '// it is hard.',
    ],
  });

  newTest({
    title: 'Can handle space',
    start: ['|abc', 'def'],
    keysPressed: '  ',
    end: ['ab|c', 'def'],
  });

  newTest({
    title: 'Can handle space',
    start: ['|abc', 'def'],
    keysPressed: '    ',
    end: ['abc', 'd|ef'],
  });

  newTest({
    title: 'Undo 1',
    start: ['|'],
    keysPressed: 'iabc<Esc>adef<Esc>uu',
    end: ['|'],
  });

  newTest({
    title: 'Undo 2',
    start: ['|'],
    keysPressed: 'iabc<Esc>adef<Esc>u',
    end: ['ab|c'],
  });

  newTest({
    title: 'Undo cursor',
    start: ['|'],
    keysPressed: 'Iabc<Esc>Idef<Esc>Ighi<Esc>uuu',
    end: ['|'],
  });

  newTest({
    title: 'Undo cursor 2',
    start: ['|'],
    keysPressed: 'Iabc<Esc>Idef<Esc>Ighi<Esc>uu',
    end: ['|abc'],
  });

  newTest({
    title: 'Undo cursor 3',
    start: ['|'],
    keysPressed: 'Iabc<Esc>Idef<Esc>Ighi<Esc>u',
    end: ['|defabc'],
  });

  newTest({
    title: 'Undo with movement first',
    start: ['|'],
    keysPressed: 'iabc<Esc>adef<Esc>hlhlu',
    end: ['ab|c'],
  });

  newTest({
    title: "Can handle 'U'",
    start: ['|'],
    keysPressed: 'iabc<Esc>U',
    end: ['|'],
  });

  newTest({
    title: "Can handle 'U' for multiple changes",
    start: ['|'],
    keysPressed: 'idef<Esc>aghi<Esc>U',
    end: ['|'],
  });

  newTest({
    title: "Can handle 'U' for new line below",
    start: ['|'],
    keysPressed: 'iabc<Esc>odef<Esc>U',
    end: ['abc', '|'],
  });

  newTest({
    title: "Can handle 'U' for new line above",
    start: ['|'],
    keysPressed: 'iabc<Esc>Odef<Esc>U',
    end: ['|', 'abc'],
  });

  newTest({
    title: "Can handle 'U' for consecutive changes only",
    start: ['|'],
    keysPressed: 'iabc<Esc>odef<Esc>kAghi<Esc>U',
    end: ['ab|c', 'def'],
  });

  newTest({
    title: "Can handle 'u' to undo 'U'",
    start: ['|'],
    keysPressed: 'iabc<Esc>Uu',
    end: ['|abc'],
  });

  newTest({
    title: "Can handle 'U' to undo 'U'",
    start: ['|'],
    keysPressed: 'iabc<Esc>UU',
    end: ['|abc'],
  });

  newTest({
    title: "Can handle 'u' after :s/abc/def",
    start: ['|'],
    keysPressed: 'iabc<Esc>:s/abc/def/\nu',
    end: ['ab|c'],
  });

  newTest({
    title: 'Can handle undo delete',
    start: ['one |two three four five'],
    keysPressed: 'dwdwu',
    end: ['one |three four five'],
  });

  newTest({
    title: 'Can handle undo delete twice',
    start: ['one |two three four five'],
    keysPressed: 'dwdwuu',
    end: ['one |two three four five'],
  });

  newTest({
    title: 'Can handle undo delete with count',
    start: ['one |two three four five'],
    keysPressed: 'dwdw2u',
    end: ['one |two three four five'],
  });

  newTest({
    title: 'Can handle undo delete with count and redo',
    start: ['one |two three four five'],
    keysPressed: 'dwdw2u<C-r>',
    end: ['one |three four five'],
  });

  newTest({
    title: 'Redo',
    start: ['|'],
    keysPressed: 'iabc<Esc>adef<Esc>uu<C-r>',
    end: ['|abc'],
  });

  newTest({
    title: 'Redo',
    start: ['|'],
    keysPressed: 'iabc<Esc>adef<Esc>uu<C-r><C-r>',
    end: ['abc|def'],
  });

  newTest({
    title: 'Redo',
    start: ['|'],
    keysPressed: 'iabc<Esc>adef<Esc>uuhlhl<C-r><C-r>',
    end: ['abc|def'],
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
    title: 'can handle p in visual to end of line',
    start: ['1234 |5678', 'test test'],
    keysPressed: 'vllllyjvllllp',
    end: ['1234 5678', 'test |5678', ''],
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
    start: ['07|'],
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
    title: '/ does not affect mark',
    start: ['|one', 'twooo', 'thurr'],
    keysPressed: "ma/two\n'a",
    end: ['|one', 'twooo', 'thurr'],
  });

  newTest({
    title: '/ can search with regex',
    start: ['|', 'one two2o'],
    keysPressed: '/o\\do\n',
    end: ['', 'one tw|o2o'],
  });

  newTest({
    title: '/ can search with newline',
    start: ['|asdf', '__asdf', 'asdf'],
    keysPressed: '/\\nasdf\n',
    end: ['asdf', '__asd|f', 'asdf'],
  });

  newTest({
    title: '/ can search through multiple newlines',
    start: ['|asdf', '__asdf', 'asdf', 'abc', '   abc'],
    keysPressed: '/asdf\\nasdf\\nabc\n',
    end: ['asdf', '__|asdf', 'asdf', 'abc', '   abc'],
  });

  newTest({
    title: '/ with noignorecase, nosmartcase',
    config: { ignorecase: false, smartcase: false },
    start: ['bl|ah', 'blAh', 'BLAH', 'blah'],
    keysPressed: '/blah\n',
    end: ['blah', 'blAh', 'BLAH', '|blah'],
  });

  newTest({
    title: '/ matches ^ per line',
    start: ['|  asdf', 'asasdf', 'asdf', 'asdf'],
    keysPressed: '/^asdf\n',
    end: ['  asdf', 'asasdf', '|asdf', 'asdf'],
  });

  newTest({
    title: '/ matches $ per line',
    start: ['|asdfjkl', 'asdf  ', 'asdf', 'asdf'],
    keysPressed: '/asdf$\n',
    end: ['asdfjkl', 'asdf  ', '|asdf', 'asdf'],
  });

  /**
   * The escaped `/` and `?` the next tests are necessary because otherwise they denote a search offset.
   */
  newTest({
    title: 'Can search for forward slash',
    start: ['|One/two/three/four'],
    keysPressed: '/\\/\nn',
    end: ['One/two|/three/four'],
  });

  newTest({
    title: 'Can search backward for question mark',
    start: ['|One?two?three?four'],
    keysPressed: '?\\?\nn',
    end: ['One?two|?three?four'],
  });

  newTest({
    title: '/\\c forces case insensitive search',
    start: ['|__ASDF', 'asdf'],
    keysPressed: '/\\casdf\n',
    end: ['__|ASDF', 'asdf'],
  });

  newTest({
    title: '/\\C forces case sensitive search',
    start: ['|__ASDF', 'asdf'],
    keysPressed: '/\\Casdf\n',
    end: ['__ASDF', '|asdf'],
  });

  newTest({
    title: '<BS> deletes the last character in search in progress mode',
    start: ['|foo', 'bar', 'abd'],
    keysPressed: '/abc<BS>d\n',
    end: ['foo', 'bar', '|abd'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<S-BS> deletes the last character in search in progress mode',
    start: ['|foo', 'bar', 'abd'],
    keysPressed: '/abc<shift+BS>d\n',
    end: ['foo', 'bar', '|abd'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-h> deletes the last character in search in progress mode',
    start: ['|foo', 'bar', 'abd'],
    keysPressed: '/abc<C-h>d\n',
    end: ['foo', 'bar', '|abd'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can delete with search forward',
    start: ['foo |junk junk bar'],
    keysPressed: 'd/bar\n',
    end: ['foo |bar'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can delete with search backward',
    start: ['foo junk garbage trash |bar'],
    keysPressed: 'd?junk\n',
    end: ['foo |bar'],
    endMode: Mode.Normal,
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

  newTest({
    title: '`] go to the end of the previously operated or put text',
    start: ['hello|'],
    keysPressed: 'a world<Esc>`]',
    end: ['hello worl|d'],
  });

  newTest({
    title: "'] go to the end of the previously operated or put text",
    start: ['hello|'],
    keysPressed: "a world<Esc>']",
    end: ['hello worl|d'],
  });

  newTest({
    title: '`[ go to the start of the previously operated or put text',
    start: ['hello|'],
    keysPressed: 'a world<Esc>`[',
    end: ['hello| world'],
  });

  newTest({
    title: "'[ go to the start of the previously operated or put text",
    start: ['hello|'],
    keysPressed: "a world<Esc>'[",
    end: ['hello| world'],
  });

  suite('can handle gn', () => {
    test(`gn selects the next match text`, async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('gg'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.currentMode, Mode.Visual);

      const selection = TextEditor.getSelection();

      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 1);
    });

    const gnSelectsCurrentWord = async (jumpCmd: string) => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents(jumpCmd.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.currentMode, Mode.Visual);

      const selection = TextEditor.getSelection();

      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 1);
    };

    test(`gn selects the current word at |hello`, async () => {
      await gnSelectsCurrentWord('2gg');
    });

    test(`gn selects the current word at h|ello`, async () => {
      await gnSelectsCurrentWord('2ggl');
    });

    test(`gn selects the current word at hel|lo`, async () => {
      await gnSelectsCurrentWord('2ggeh');
    });

    test(`gn selects the current word at hell|o`, async () => {
      await gnSelectsCurrentWord('2gge');
    });

    test(`gn selects the next word at hello|`, async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('2ggel'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.currentMode, Mode.Visual);

      const selection = TextEditor.getSelection();

      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 2);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 2);
    });
  });

  suite('can handle dgn', () => {
    newTest({
      title: 'dgn deletes the next match text (from first line)',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nggdgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at |hello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\ndgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at h|ello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nldgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at hel|lo',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n3ldgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at hell|o',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nedgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the next word when cursor is at hello|',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\neldgn',
      end: ['foo', 'hello world', '|', 'hello'],
      endMode: Mode.Normal,
    });
  });

  suite('can handle cgn', () => {
    newTest({
      title: 'cgn deletes the next match text (from first line)',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nggcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at |hello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\ncgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at h|ello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nlcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at hel|lo',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n3lcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at hell|o',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\necgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the next word when cursor is at hello|',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nelcgn',
      end: ['foo', 'hello world', '|', 'hello'],
      endMode: Mode.Insert,
    });
  });

  suite('can handle gN', () => {
    test(`gN selects the previous match text`, async () => {
      await modeHandler.handleMultipleKeyEvents('ihello world\nhello\nhi hello\nfoo'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents(['G']);
      await modeHandler.handleMultipleKeyEvents(['g', 'N']);

      assert.strictEqual(modeHandler.currentMode, Mode.Visual);

      const selection = TextEditor.getSelection();

      assert.strictEqual(selection.start.character, 'hi '.length);
      assert.strictEqual(selection.start.line, 2);
      assert.strictEqual(selection.end.character, 'hi hello'.length);
      assert.strictEqual(selection.end.line, 2);
    });

    const gnSelectsCurrentWord = async (jumpCmd: string) => {
      await modeHandler.handleMultipleKeyEvents('ihello world\nhello\nhi hello\nfoo'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents(jumpCmd.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'N']);

      assert.strictEqual(modeHandler.currentMode, Mode.Visual);

      const selection = TextEditor.getSelection();

      assert.strictEqual(selection.start.character, 'hi '.length);
      assert.strictEqual(selection.start.line, 2);
      assert.strictEqual(selection.end.character, 'hi hello'.length);
      assert.strictEqual(selection.end.line, 2);
    };

    test(`gN selects the current word at hell|o`, async () => {
      await gnSelectsCurrentWord('3gg7l');
    });

    test(`gN selects the current word at hel|lo`, async () => {
      await gnSelectsCurrentWord('3gg6l');
    });

    test(`gN selects the current word at h|ello`, async () => {
      await gnSelectsCurrentWord('3gg4l');
    });

    test(`gN selects the current word at |hello`, async () => {
      await gnSelectsCurrentWord('3gg3l');
    });

    test(`gN selects the previous word at | hello`, async () => {
      await modeHandler.handleMultipleKeyEvents('ihello world\nhello\nhi hello\nfoo'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('3gg2l'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'N']);

      assert.strictEqual(modeHandler.currentMode, Mode.Visual);

      const selection = TextEditor.getSelection();

      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 1);
    });
  });

  suite('can handle dgN', () => {
    newTest({
      title: 'dgN deletes the previous match text (from first line)',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\nGdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at hell|o',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$dgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at hel|lo',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$hdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at h|ello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwldgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at |hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the previous word when cursor is at | hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwhdgN',
      end: ['hello world', '|', 'hi hello', 'foo'],
      endMode: Mode.Normal,
    });
  });

  suite('can handle cgN', () => {
    newTest({
      title: 'cgN deletes the previous match text (from first line)',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\nGcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at hell|o',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$cgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at hel|lo',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$hcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at h|ello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwlcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at |hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the previous word when cursor is at | hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwhcgN',
      end: ['hello world', '|', 'hi hello', 'foo'],
      endMode: Mode.Insert,
    });
  });

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

  suite('marks', async () => {
    const jumpToNewFile = async () => {
      let configuration = new Configuration();
      configuration.tabstop = 4;
      configuration.expandtab = false;
      await setupWorkspace(configuration);
      return getAndUpdateModeHandler();
    };

    test('capital marks can change the editors active document', async () => {
      const firstDocumentName = TextEditor.getDocumentName();
      await modeHandler.handleMultipleKeyEvents('mA'.split(''));

      const otherModeHandler = await jumpToNewFile();
      const otherDocumentName = TextEditor.getDocumentName();
      assert.notStrictEqual(firstDocumentName, otherDocumentName);

      await otherModeHandler.handleMultipleKeyEvents(`'A`.split(''));
      assert.strictEqual(TextEditor.getDocumentName(), firstDocumentName);
    });

    newTest({
      title: `can jump to lowercase mark`,
      start: ['|hello world and mars'],
      keysPressed: 'wma2w`a',
      end: ['hello |world and mars'],
      endMode: Mode.Normal,
    });
  });
});
