"use strict";

import { setupWorkspace, setTextEditorOptions, cleanUpWorkspace, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

suite("Mode Normal", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
        newTest,
        newTestOnly,
    } = getTestingFunctions(modeHandler);

    setup(async () => {
        await setupWorkspace();
        setTextEditorOptions(4, false);
    });

    teardown(cleanUpWorkspace);

    test("can be activated", async () => {
        let activationKeys = ['<escape>', 'ctrl+['];

        for (let key of activationKeys) {
            await modeHandler.handleKeyEvent('i');
            await modeHandler.handleKeyEvent(key!);

            assertEqual(modeHandler.currentMode.name, ModeName.Normal);
        }

        await modeHandler.handleKeyEvent('v');
        await modeHandler.handleKeyEvent('v');

        assertEqual(modeHandler.currentMode.name, ModeName.Normal);
    });

    newTest({
      title: "Can handle %",
      start: ['|((( )))'],
      keysPressed: '%',
      end: ["((( ))|)"],
    });

    newTest({
      title: "Can handle % before opening brace",
      start: ['|one (two)'],
      keysPressed: '%',
      end: ["one (two|)"],
    });

    newTest({
      title: "Can handle % nested inside parens",
      start: ['(|one { two })'],
      keysPressed: '%',
      end: ["(one { two |})"],
    });

    newTest({
      title: "Can handle dw",
      start: ['one |two three'],
      keysPressed: 'dw',
      end: ["one |three"],
    });

    newTest({
      title: "Can handle dw",
      start: ['one | '],
      keysPressed: 'dw',
      end: ["one| "],
    });

    newTest({
      title: "Can handle dw",
      start: ['one |two'],
      keysPressed: 'dw',
      end: ["one| "],
    });

    newTest({
      title: "Can handle dw across lines",
      start: ['one |two', '  three'],
      keysPressed: 'dw',
      end: ["one| ", "  three"]
    });

    newTest({
      title: "Can handle dw across lines",
      start: ['one |two', '', 'three'],
      keysPressed: 'dw',
      end: ["one| ", "", "three"]
    });

    newTest({
      title: "Can handle dd last line",
      start: ['one', '|two'],
      keysPressed: 'dd',
      end: ["|one"],
    });

    newTest({
      title: "Can handle dd single line",
      start: ['|one'],
      keysPressed: 'dd',
      end: ["|"],
    });

    newTest({
      title: "Can handle dd",
      start: ['|one', 'two'],
      keysPressed: 'dd',
      end: ["|two"],
    });

    newTest({
      title: "Can handle 3dd",
      start: ['|one', 'two', 'three', 'four', 'five'],
      keysPressed: '3dd',
      end: ["|four", "five"],
    });

    newTest({
      title: "Can handle 3dd off end of document",
      start: ['one', 'two', 'three', '|four', 'five'],
      keysPressed: '3dd',
      end: ["one", "two", "|three"],
    });

    newTest({
      title: "Can handle dd empty line",
      start: ['one', '|', 'two'],
      keysPressed: 'dd',
      end: ["one", "|two"],
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
      title: "Can handle 'cw'",
      start: ['text text tex|t'],
      keysPressed: '^lllllllcw',
      end: ['text te| text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 's'",
      start: ['tex|t'],
      keysPressed: '^sk',
      end: ['k|ext'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ciw'",
      start: ['text text tex|t'],
      keysPressed: '^lllllllciw',
      end: ['text | text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ciw' on blanks",
      start: ['text   text tex|t'],
      keysPressed: '^lllllciw',
      end: ['text|text text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw'",
      start: ['text text tex|t'],
      keysPressed: '^llllllcaw',
      end: ['text |text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on first letter",
      start: ['text text tex|t'],
      keysPressed: '^lllllcaw',
      end: ['text |text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on blanks",
      start: ['text   tex|t'],
      keysPressed: '^lllllcaw',
      end: ['text|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on blanks",
      start: ['text |   text text'],
      keysPressed: 'caw',
      end: ['text| text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci(' on first parentheses",
      start: ['print(|"hello")'],
      keysPressed: 'ci(',
      end: ['print(|)'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci(' with nested parentheses",
      start: ['call|(() => 5)'],
      keysPressed: 'ci(',
      end: ['call(|)'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci(' backwards through nested parens",
      start: ['call(() => |5)'],
      keysPressed: 'ci(',
      end: ['call(|)'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ca(' spanning multiple lines",
      start: ['call(', '  |arg1)'],
      keysPressed: 'ca(',
      end: ['call|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci{' spanning multiple lines",
      start: ['one {', '|', '}'],
      keysPressed: 'ci{',
      end: ['one {|}'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci(' on the closing bracket",
      start: ['(one|)'],
      keysPressed: 'ci(',
      end: ['(|)'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "will fail when ca( with no ()",
      start: ['|blaaah'],
      keysPressed: 'ca(',
      end: ['|blaaah'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "will fail when ca{ with no {}",
      start: ['|blaaah'],
      keysPressed: 'ca{',
      end: ['|blaaah'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'ci[' spanning multiple lines",
      start: ['one [', '|', ']'],
      keysPressed: 'ci[',
      end: ['one [|]'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci]' on first bracket",
      start: ['one[|"two"]'],
      keysPressed: 'ci]',
      end: ['one[|]'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ca[' on first bracket",
      start: ['one[|"two"]'],
      keysPressed: 'ca[',
      end: ['one|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ca]' on first bracket",
      start: ['one[|"two"]'],
      keysPressed: 'ca]',
      end: ['one|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\'' on first quote",
      start: ["|'one'"],
      keysPressed: "ci'",
      end: ["'|'"],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\'' inside quoted string",
      start: ["'o|ne'"],
      keysPressed: "ci'",
      end: ["'|'"],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\'' on closing quote",
      start: ["'one|'"],
      keysPressed: "ci'",
      end: ["'|'"],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\'' when string is ahead",
      start: ["on|e 'two'"],
      keysPressed: "ci'",
      end: ["one '|'"],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' on opening quote",
      start: ['|"one"'],
      keysPressed: 'ci"',
      end: ['"|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' starting behind the quoted word",
      start: ['|one "two"'],
      keysPressed: 'ci"',
      end: ['one "|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ca\"' starting behind the quoted word",
      start: ['|one "two"'],
      keysPressed: 'ca"',
      end: ['one |'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ca\"' starting on the opening quote",
      start: ['one |"two"'],
      keysPressed: 'ca"',
      end: ['one |'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' with escaped quotes",
      start: ['"one \\"tw|o\\""'],
      keysPressed: 'ci"',
      end: ['"|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' with a single escaped quote",
      start: ['|"one \\" two"'],
      keysPressed: 'ci"',
      end: ['"|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' with a single escaped quote behind",
      start: ['one "two \\" |three"'],
      keysPressed: 'ci"',
      end: ['one "|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' with an escaped backslash",
      start: ['one "tw|o \\\\three"'],
      keysPressed: 'ci"',
      end: ['one "|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' with an escaped backslash on closing quote",
      start: ['"\\\\|"'],
      keysPressed: 'ci"',
      end: ['"|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ca\"' starting on the closing quote",
      start: ['one "two|"'],
      keysPressed: 'ca"',
      end: ['one |'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ci\"' with complex escape sequences",
      start: ['"two|\\\\\\""'],
      keysPressed: 'ci"',
      end: ['"|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can pick the correct open quote between two strings for 'ci\"'",
      start: ['"one" |"two"'],
      keysPressed: 'ci"',
      end: ['"one" "|"'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "will fail when ca\" ahead of quoted string",
      start: ['"one" |two'],
      keysPressed: 'ca"',
      end: ['"one" |two'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'ca`' inside word",
      start: ['one `t|wo`'],
      keysPressed: 'ca`',
      end: ['one |'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'daw' on word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'daw',
      end: ['one   two|,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daw' on word with trailing spaces",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'daw',
      end: ['one   |three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daw' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'daw',
      end: ['one   two|,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daw' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'd3aw',
      end: ['|,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daw' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five  six'],
      keysPressed: 'd2aw',
      end: ['one   two   three,   |six'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daw' on word with numeric prefix and across lines, containing words end with `.`",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'd2aw',
      end: ['one   two   three,   |.  six'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daW' on big word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'daW',
      end: ['one   two|   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daW' on word with trailing spaces",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'daW',
      end: ['one   |three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daW' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'daW',
      end: ['one   two   |four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daW' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'd3aW',
      end: ['|four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'daW' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'd2aW',
      end: ['one   two   three,   |six'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diw' on word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'diw',
      end: ['one   two|three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diw' on word",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'diw',
      end: ['one   |   three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diw' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'd3iw',
      end: ['|   three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diw' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five  six'],
      keysPressed: 'd3iw',
      end: ['one   two   three,   |  six'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diw' on word with numeric prefix and across lines, containing words end with `.`",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'd3iw',
      end: ['one   two   three,   |.  six'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diW' on big word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'diW',
      end: ['one   two|three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diW' on word with trailing spaces",
      start: ['one   tw|o,   three,   four  '],
      keysPressed: 'diW',
      end: ['one   |   three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diW' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'diW',
      end: ['one   two   |   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diW' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'd3iW',
      end: ['|   three,   four  '],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'diW' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'd3iW',
      end: ['one   two   three,   |  six'],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can handle 'df'",
      start: ['aext tex|t'],
      keysPressed: '^dft',
      end: ['| text']
    });

    newTest({
      title: "Can handle 'dt'",
      start: ['aext tex|t'],
      keysPressed: '^dtt',
      end: ['|t text']
    });

    newTest({
      title: "Can handle A and backspace",
      start: ['|text text'],
      keysPressed: 'A<backspace><escape>',
      end: ['text te|x']
    });

    newTest({
      title: "Can handle 'P' after 'yy'",
      start: ['one', 'tw|o'],
      keysPressed: 'yyP',
      end: ['one', '|two', 'two']
    });

    newTest({
      title: "Can handle 'p' after 'yy'",
      start: ['one', 'tw|o'],
      keysPressed: 'yyp',
      end: ['one', 'two', '|two']
    });

    newTest({
      title: "Can handle 'P' after 'Nyy'",
      start: ['on|e', 'two', 'three'],
      keysPressed: '3yyP',
      end: ['|one', 'two', 'three', 'one', 'two', 'three']
    });

    newTest({
      title: "Can handle 'p' after 'Nyy'",
      start: ['on|e', 'two', 'three'],
      keysPressed: '3yyp',
      end: ['one', '|one', 'two', 'three', 'two', 'three']
    });

    newTest({
      title: "Can handle 'p' after 'yy' with correct cursor position",
      start: ['|  one', 'two'],
      keysPressed: 'yyjp',
      end: ['  one', 'two', '  |one']
    });

    newTest({
      title: "Can handle 'gp' after 'yy'",
      start: ['one', 'tw|o', 'three'],
      keysPressed: 'yygp',
      end: ['one', 'two', 'two', '|three']
    });

    newTest({
      title: "Can handle 'gp' after 'Nyy'",
      start: ['on|e', 'two', 'three'],
      keysPressed: '2yyjgp',
      end: ['one', 'two', 'one', 'two', '|three']
    });

    newTest({
      title: "Can handle 'gp' after 'Nyy' if cursor is on the last line",
      start: ['on|e', 'two', 'three'],
      keysPressed: '2yyjjgp',
      end: ['one', 'two', 'three', 'one', '|two']
    });

    newTest({
      title: "Can handle 'gP' after 'yy'",
      start: ['one', 'tw|o', 'three'],
      keysPressed: 'yygP',
      end: ['one', 'two', '|two', 'three']
    });

    newTest({
      title: "Can handle 'gP' after 'Nyy'",
      start: ['on|e', 'two', 'three'],
      keysPressed: '2yygP',
      end: ['one', 'two', '|one', 'two', 'three']
    });

    newTest({
      title: "Can handle ']p' after yy",
      start: ['  |one', '   two'],
      keysPressed: 'yyj]p',
      end: ['  one', '   two', '   |one']
    });

    newTest({
      title: "Can handle ']p' after 'Nyy'",
      start: [' |one', '  two', '  three'],
      keysPressed: '2yyjj]p',
      end: [' one', '  two', '  three', '  |one', '   two']
    });

    newTest({
      title: "Can handle ']p' after 'Nyy' and indent with tabs first",
      start: [' |one', '  two', '   three'],
      keysPressed: '2yyjj]p',
      end: [' one', '  two', '   three', '   |one', '\ttwo']
    });

    newTest({
      title: "Can handle ']p' after 'Nyy' and decrease indents if possible",
      start: ['    |one', ' two', ' three'],
      keysPressed: '2yyjj]p',
      end: ['    one', ' two', ' three', ' |one', 'two']
    });

    newTest({
      title: "Can handle '[p' after yy",
      start: ['   two', '  |one'],
      keysPressed: 'yyk[p',
      end: ['   |one', '   two', '  one']
    });

    newTest({
      title: "Can handle '[p' after 'Nyy'",
      start: ['  three', '|one', ' two'],
      keysPressed: '2yyk[p',
      end: ['  |one', '   two', '  three', 'one', ' two']
    });

    newTest({
      title: "Can handle '[p' after 'Nyy' and indent with tabs first",
      start: ['   three', '| one', '  two'],
      keysPressed: '2yyk[p',
      end: ['   |one', '\ttwo', '   three', ' one', '  two']
    });

    newTest({
      title: "Can handle '[p' after 'Nyy' and decrease indents if possible",
      start: [' three', '    |one', ' two'],
      keysPressed: '2yyk[p',
      end: [' |one', 'two', ' three', '    one', ' two']
    });


    newTest({
      title: "Can repeat w",
      start: ['|one two three four'],
      keysPressed: '2w',
      end: ['one two |three four']
    });

    newTest({
      title: "Can repeat p",
      start: ['|one'],
      keysPressed: 'yy2p',
      end: ['one', '|one', 'one']
    });

    newTest({
      title: "I works correctly",
      start: ['|    one'],
      keysPressed: 'Itest <escape>',
      end: ['    test| one']
    });

    newTest({
      title: "gI works correctly",
      start: ['|    one'],
      keysPressed: 'gItest<escape>',
      end: ['tes|t    one']
    });

    newTest({
      title: "Can handle space",
      start: ['|abc', 'def'],
      keysPressed: '  ',
      end: ['ab|c', 'def']
    });

    newTest({
      title: "Can handle space",
      start: ['|abc', 'def'],
      keysPressed: '    ',
      end: ['abc', 'd|ef']
    });

    newTest({
      title: "Undo 1",
      start: ['|'],
      keysPressed: 'iabc<escape>adef<escape>uu',
      end: ['|']
    });

    newTest({
      title: "Undo 2",
      start: ['|'],
      keysPressed: 'iabc<escape>adef<escape>u',
      end: ['ab|c']
    });

    newTest({
      title: "Undo cursor",
      start: ['|'],
      keysPressed: 'Iabc<escape>Idef<escape>Ighi<escape>uuu',
      end: ['|']
    });

    newTest({
      title: "Undo cursor 2",
      start: ['|'],
      keysPressed: 'Iabc<escape>Idef<escape>Ighi<escape>uu',
      end: ['|abc']
    });

    newTest({
      title: "Undo cursor 3",
      start: ['|'],
      keysPressed: 'Iabc<escape>Idef<escape>Ighi<escape>u',
      end: ['|defabc']
    });

    newTest({
      title: "Undo with movement first",
      start: ['|'],
      keysPressed: 'iabc<escape>adef<escape>hlhlu',
      end: ['ab|c']
    });

    newTest({
      title: "Redo",
      start: ['|'],
      keysPressed: 'iabc<escape>adef<escape>uu<c-r>',
      end: ['|abc']
    });

    newTest({
      title: "Redo",
      start: ['|'],
      keysPressed: 'iabc<escape>adef<escape>uu<c-r><c-r>',
      end: ['abc|def']
    });

    newTest({
      title: "Redo",
      start: ['|'],
      keysPressed: 'iabc<escape>adef<escape>uuhlhl<c-r><c-r>',
      end: ['abc|def']
    });

    newTest({
      title: "Can handle u",
      start: ['|ABC DEF'],
      keysPressed: 'vwu',
      end: ['|abc dEF']
    });

    newTest({
      title: "Can handle u over line breaks",
      start: ['|ABC', 'DEF'],
      keysPressed: 'vG$u',
      end: ['|abc', 'def']
    });

    newTest({
      title: "can handle s in visual mode",
      start: ["|abc def ghi"],
      keysPressed: "vwshi <escape>",
      end: ["hi| ef ghi"]
    });

    newTest({
      title: "can handle p with selection",
      start: ["|abc def ghi"],
      keysPressed: "vwywvwp",
      end: ["abc abc |dhi"]
    });

    newTest({
      title: "can handle P with selection",
      start: ["|abc def ghi"],
      keysPressed: "vwywvwP",
      end: ["abc abc |dhi"]
    });

    newTest({
      title: "can repeat backspace twice",
      start: ["|11223344"],
      keysPressed: "A<backspace><backspace><escape>0.",
      end: ["112|2"]
    });

    newTest({
      title: "can delete linewise with d2G",
      start: ["|one", "two" , "three"],
      keysPressed: "d2G",
      end: ["|three"]
    });

    newTest({
      title: "can dE correctly",
      start: ["|one two three"],
      keysPressed: "dE",
      end: ["| two three"]
    });

    newTest({
      title: "can dE correctly",
      start: ["|one((( two three"],
      keysPressed: "dE",
      end: ["| two three"]
    });

    newTest({
      title: "can dE correctly",
      start: ["one two |three"],
      keysPressed: "dE",
      end: ["one two| "]
    });

    newTest({
      title: "can ctrl-a correctly behind a word",
      start: ["|one 9"],
      keysPressed: "<c-a>",
      end: ["one 1|0"]
    });

    newTest({
      title: "can ctrl-a on word",
      start: ["one -|11"],
      keysPressed: "<c-a>",
      end: ["one -1|0"]
    });

    newTest({
      title: "can ctrl-a on a hex number",
      start: ["|0xf"],
      keysPressed: "<c-a>",
      end: ["0x1|0"]
    });

    newTest({
      title: "can ctrl-a on decimal",
      start: ["1|1.123"],
      keysPressed: "<c-a>",
      end: ["1|2.123"]
    });

    newTest({
      title: "can ctrl-a with numeric prefix",
      start: ["|-10"],
      keysPressed: "15<c-a>",
      end: ["|5"]
    });

    newTest({
      title: "can ctrl-a on a decimal",
      start: ["-10.|1"],
      keysPressed: "10<c-a>",
      end: ["-10.1|1"]
    });

    newTest({
      title: "can ctrl-a on an octal ",
      start: ["07|"],
      keysPressed: "<c-a>",
      end: ["01|0"]
    });

    newTest({
      title: "can ctrl-x correctly behind a word",
      start: ["|one 10"],
      keysPressed: "<c-x>",
      end: ["one |9"]
    });

    newTest({
      title: "can do Y",
      start: ["|blah blah"],
      keysPressed: "Yp",
      end: ["blah blah", "|blah blah"]
    });
});