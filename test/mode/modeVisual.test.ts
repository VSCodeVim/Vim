import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { Globals } from '../../src/globals';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTest, newTestSkip } from '../testSimplifier';
import { assertEqualLines, reloadConfiguration, setupWorkspace } from './../testUtils';

suite('Mode Visual', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test('can be activated', async () => {
    await modeHandler.handleKeyEvent('v');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('v');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  newTest({
    title: '[count]v',
    start: ['a|bcde'],
    keysPressed: '3vd',
    end: ['a|e'],
  });

  newTest({
    title: '[count]v past EOL',
    start: ['a|bcde', '12345'],
    keysPressed: '100vd',
    end: ['a|12345'],
  });

  test('Can handle w', async () => {
    await modeHandler.handleMultipleKeyEvents('itest test test\ntest\n'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'v', 'w']);

    const sel = modeHandler.vimState.editor.selection;
    assert.strictEqual(sel.start.character, 0);
    assert.strictEqual(sel.start.line, 0);

    // The input cursor comes BEFORE the block cursor. Try it out, this
    // is how Vim works.
    assert.strictEqual(sel.end.character, 6);
    assert.strictEqual(sel.end.line, 0);
  });

  test('Can handle wd', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'v', 'w', 'd']);

    assertEqualLines(['wo three']);
  });

  test('Can handle x', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'v', 'x']);

    assertEqualLines(['ne two three']);

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  test('Can handle x across a selection', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'v', 'w', 'x']);

    assertEqualLines(['wo three']);

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  test('Can do vwd in middle of sentence', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three foar'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'l', 'l', 'l', 'l', 'v', 'w', 'd']);

    assertEqualLines(['one hree foar']);
  });

  test('Can do vwd in middle of sentence', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'l', 'l', 'l', 'l', 'v', 'w', 'd']);

    assertEqualLines(['one hree']);
  });

  test('Can do vwd multiple times', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three four'.split(''));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      '^',
      'v',
      'w',
      'd',
      'v',
      'w',
      'd',
      'v',
      'w',
      'd',
    ]);

    assertEqualLines(['our']);
  });

  test('handles case where we go from selecting on right side to selecting on left side', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      '^',
      'l',
      'l',
      'l',
      'l',
      'v',
      'w',
      'b',
      'b',
      'd',
    ]);

    assertEqualLines(['wo three']);
  });

  newTest({
    title: 'Can handle H key',
    start: ['1', '2', '|3', '4', '5'],
    keysPressed: 'vH',
    end: ['|1', '2', '3', '4', '5'],
  });

  newTest({
    title: 'Can handle backspace key',
    start: ['blah', 'duh', 'd|ur', 'hur'],
    keysPressed: 'v<BS>x',
    end: ['blah', 'duh', '|r', 'hur'],
  });

  test('handles case where we delete over a newline', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two\n\nthree four'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '0', 'k', 'k', 'v', '}', 'd']);

    assertEqualLines(['three four']);
  });

  test('handles change operator', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'v', 'w', 'c']);

    assertEqualLines(['wo three']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });

  suite("Vim's EOL handling is weird", () => {
    test('delete through eol', async () => {
      await modeHandler.handleMultipleKeyEvents('ione\ntwo'.split(''));

      await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'g', 'g', 'v', 'l', 'l', 'l', 'd']);

      assertEqualLines(['two']);
    });

    test('join 2 lines by deleting through eol', async () => {
      await modeHandler.handleMultipleKeyEvents('ione\ntwo'.split(''));

      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'l', 'v', 'l', 'l', 'd']);

      assertEqualLines(['otwo']);
    });

    test("d$ doesn't delete whole line", async () => {
      await modeHandler.handleMultipleKeyEvents('ione\ntwo'.split(''));

      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', '$']);

      assertEqualLines(['', 'two']);
    });

    test('vd$ does delete whole line', async () => {
      await modeHandler.handleMultipleKeyEvents('ione\ntwo'.split(''));

      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'v', '$', 'd']);

      assertEqualLines(['two']);
    });

    newTest({
      title: 'Paste over selection copies the selection',
      start: ['|from to'],
      keysPressed: 'dewvep0P',
      end: ['t|o from'],
    });

    newTest({
      title: 'Paste over selection copies the selection linewise',
      start: ['foo', 'bar', '|fun'],
      keysPressed: 'viwykVkpp',
      end: ['fun', '|foo', 'bar', 'fun'],
    });
  });

  suite('Arrow keys work perfectly in Visual Mode', () => {
    newTest({
      title: 'Can handle <up> key',
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'v<up>x',
      end: ['blah', '|ur', 'hur'],
    });

    newTest({
      title: 'Can handle <down> key',
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'v<down>x',
      end: ['blah', 'duh', '|ur'],
    });

    newTest({
      title: 'Can handle <left> key',
      start: ['blah', 'duh', 'd|ur', 'hur'],
      keysPressed: 'v<left>x',
      end: ['blah', 'duh', '|r', 'hur'],
    });

    newTest({
      title: 'Can handle <right> key',
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'v<right>x',
      end: ['blah', 'duh', '|r', 'hur'],
    });
  });

  suite('Screen line motions in Visual Mode', () => {
    newTest({
      title: "Can handle 'gk'",
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'vgkx',
      end: ['blah', '|ur', 'hur'],
    });

    newTest({
      title: "Can handle 'gj'",
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'vgjx',
      end: ['blah', 'duh', '|ur'],
    });

    newTestSkip({
      title: "Preserves cursor position when handling 'gk'",
      start: ['blah', 'word', 'a', 'la|st'],
      keysPressed: 'vgkgkx',
      end: ['blah', 'wo|t'],
    });

    newTestSkip({
      title: "Preserves cursor position when handling 'gj'",
      start: ['blah', 'wo|rd', 'a', 'last'],
      keysPressed: 'vgjgjx',
      end: ['blah', 'wo|t'],
    });
  });

  suite('handles aw in visual mode', () => {
    newTest({
      title: "Can handle 'vawd' on word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'vawd',
      end: ['one   two|,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with trailing spaces",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'vawd',
      end: ['one   |three,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'vawd',
      end: ['one   two|,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'v3awd',
      end: ['|,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five  six'],
      keysPressed: 'v2awd',
      end: ['one   two   three,   |six'],
      endMode: Mode.Normal,
    });

    newTest({
      title:
        "Can handle 'vawd' on word with numeric prefix and across lines, containing words end with `.`",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'v2awd',
      end: ['one   two   three,   |.  six'],
      endMode: Mode.Normal,
    });
  });

  suite('handles aW in visual mode', () => {
    newTest({
      title: "Can handle 'vaWd' on big word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'vaWd',
      end: ['one   two|   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with trailing spaces",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'vaWd',
      end: ['one   |three,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'vaWd',
      end: ['one   two   |four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'v3aWd',
      end: ['|four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'v2aWd',
      end: ['one   two   three,   |six'],
      endMode: Mode.Normal,
    });
  });

  suite('handles aW in visual mode', () => {
    newTest({
      title: "Can handle 'vaWd' on big word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'vaWd',
      end: ['one   two|   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with trailing spaces",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'vaWd',
      end: ['one   |three,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'vaWd',
      end: ['one   two   |four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'v3aWd',
      end: ['|four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'v2aWd',
      end: ['one   two   three,   |six'],
      endMode: Mode.Normal,
    });
  });

  suite('handles aw in visual mode', () => {
    newTest({
      title: "Can handle 'vawd' on word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'vawd',
      end: ['one   two|,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with trailing spaces",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'vawd',
      end: ['one   |three,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'vawd',
      end: ['one   two|,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'v3awd',
      end: ['|,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vawd' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five  six'],
      keysPressed: 'v2awd',
      end: ['one   two   three,   |six'],
      endMode: Mode.Normal,
    });

    newTest({
      title:
        "Can handle 'vawd' on word with numeric prefix and across lines, containing words end with `.`",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'v2awd',
      end: ['one   two   three,   |.  six'],
      endMode: Mode.Normal,
    });
  });

  suite('handles aW in visual mode', () => {
    newTest({
      title: "Can handle 'vaWd' on big word with cursor inside spaces",
      start: ['one   two |  three,   four  '],
      keysPressed: 'vaWd',
      end: ['one   two|   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with trailing spaces",
      start: ['one   tw|o   three,   four  '],
      keysPressed: 'vaWd',
      end: ['one   |three,   four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with leading spaces",
      start: ['one   two   th|ree,   four  '],
      keysPressed: 'vaWd',
      end: ['one   two   |four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with numeric prefix",
      start: ['on|e   two   three,   four  '],
      keysPressed: 'v3aWd',
      end: ['|four  '],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'vaWd' on word with numeric prefix and across lines",
      start: ['one   two   three,   fo|ur  ', 'five.  six'],
      keysPressed: 'v2aWd',
      end: ['one   two   three,   |six'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'Y' in visual mode",
      start: ['one', '|two'],
      keysPressed: 'vwYP',
      end: ['one', '|two', 'two'],
      endMode: Mode.Normal,
    });
  });

  suite('handles as in visual mode', () => {
    newTest({
      title: 'Select sentence with trailing spaces in visual mode',
      start: ["That's my sec|ret, Captain. I'm always angry."],
      keysPressed: 'vlasd',
      end: ["That's my sec|I'm always angry."],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Select sentence with leading spaces in visual mode',
      start: ["That's my secret, Captain. I'm a|lways angry."],
      keysPressed: 'vhasd',
      end: ["That's my secret, Captain.|ways angry."],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Select multiple sentences in visual mode',
      start: ["That's my secret, Captain. I|'m always angry."],
      keysPressed: 'vhhasd',
      end: ['|m always angry.'],
      endMode: Mode.Normal,
    });
  });

  suite('handles is in visual mode', () => {
    newTest({
      title: 'Select inner sentence with trailing spaces in visual mode',
      start: ["That's my sec|ret, Captain. I'm always angry."],
      keysPressed: 'vlisd',
      end: ["That's my sec| I'm always angry."],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Select inner sentence with leading spaces in visual mode',
      start: ["That's my secret, Captain. I'm a|lways angry."],
      keysPressed: 'vhisd',
      end: ["That's my secret, Captain. |ways angry."],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Select spaces between sentences in visual mode',
      start: ["That's my secret, Captain.  |  I'm always angry."],
      keysPressed: 'vhisd',
      end: ["That's my secret, Captain.| I'm always angry."],
      endMode: Mode.Normal,
    });
  });

  suite('handles bracket blocks in visual mode', () => {
    const brackets = [
      {
        start: '{',
        end: '}',
      },
      {
        start: '[',
        end: ']',
      },
      {
        start: '(',
        end: ')',
      },
      {
        start: '<',
        end: '>',
      },
    ];

    // each test case gets run with start bracket and end bracket
    const bracketsToTest = brackets.flatMap(({ start, end }) => [
      { start, end, buttonToPress: start },
      { start, end, buttonToPress: end },
    ]);
    bracketsToTest.forEach(({ start, end, buttonToPress }) => {
      newTest({
        title: `Can do di${buttonToPress} on a matching bracket`,
        start: [`${start} one ${start} two ${start} th|ree ${end} four ${end} five ${end}`],
        keysPressed: `di${buttonToPress}`,
        end: [`${start} one ${start} two ${start}|${end} four ${end} five ${end}`],
        endMode: Mode.Normal,
      });

      newTest({
        title: `Can do di${buttonToPress} on a matching bracket from outside bracket`,
        start: [`| ${start} one ${start} two ${start} three ${end} four ${end} five ${end}`],
        keysPressed: `di${buttonToPress}`,
        end: [` ${start}|${end}`],
        endMode: Mode.Normal,
      });

      newTest({
        title: `Can do i${buttonToPress} on multiple matching brackets`,
        start: [`${start} one ${start} two ${start} th|ree ${end} four ${end} five ${end}`],
        keysPressed: `vi${buttonToPress}i${buttonToPress}i${buttonToPress}d`,
        end: [`${start}|${end}`],
        endMode: Mode.Normal,
      });

      newTest({
        title: `Can do d3i${buttonToPress} on matching brackets`,
        start: [`${start} one ${start} two ${start} th|ree ${end} four ${end} five ${end}`],
        keysPressed: `d3i${buttonToPress}`,
        end: [`${start}|${end}`],
        endMode: Mode.Normal,
      });

      newTest({
        title: `Can do d3i${buttonToPress} on matching brackets for multiple lines`,
        start: [start, 'one', start, 'two', start, 'th|ree', end, 'four', end, 'five', end],
        keysPressed: `d3i${buttonToPress}`,
        end: [start, `|${end}`],
        endMode: Mode.Normal,
      });
    });
  });

  suite('handles tag blocks in visual mode', () => {
    newTest({
      title: 'Can do vit on a matching tag',
      start: ['one <blink>he|llo</blink> two'],
      keysPressed: 'vitd',
      end: ['one <blink>|</blink> two'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Cannot do vit on a matching tag from outside tag',
      start: ['|one <blink>hello</blink> two'],
      keysPressed: 'vitd',
      end: ['|ne <blink>hello</blink> two'],
      endMode: Mode.Normal,
    });

    newTest({
      title:
        'Count-prefixed vit alternates expanding selection between inner and outer tag brackets',
      start: ['<div> one <p> t|wo </p> three </div>'],
      keysPressed: 'v3itd',
      end: ['<div>|</div>'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Can do vat on a matching tag',
      start: ['one <blink>he|llo</blink> two'],
      keysPressed: 'vatd',
      end: ['one | two'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Cannot do vat on a matching tag from from outside tag',
      start: ['|one <blink>hello</blink> two'],
      keysPressed: 'vatd',
      end: ['|ne <blink>hello</blink> two'],
      endMode: Mode.Normal,
    });
  });

  newTest({
    title: 'Can do vat on multiple matching tags',
    start: ['one <blank>two <blink>he|llo</blink> three</blank> four'],
    keysPressed: 'vatatd',
    end: ['one | four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can maintain selection on failure with vat on multiple matching tags',
    start: ['one <blank>two <blink>he|llo</blink> three</blank> four'],
    keysPressed: 'vatatatatd',
    end: ['one | four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can maintain selection on failure with repeat-prefixed vat on multiple matching tags',
    start: ['one <blank>two <blink>he|llo</blink> three</blank> four'],
    keysPressed: 'v4atd',
    end: ['one | four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Repeat-prefixed vat does not bleed below',
    start: ['<p>', '\t<p>', '\t|test', '\t</p>', '</p>', '', 'do not delete'],
    keysPressed: 'v8atd',
    end: ['|', '', 'do not delete'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Failed vat does not expand or move selection, remains in visual mode',
    start: ['one | two'],
    keysPressed: 'v4atd',
    end: ['one |two'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vi) on a matching parenthesis',
    start: ['test(te|st)'],
    keysPressed: 'vi)d',
    end: ['test(|)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vi) on a matching parenthesis from outside parathesis',
    start: ['|test(test)'],
    keysPressed: 'vi)d',
    end: ['test(|)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vi) on a matching parenthesis from outside parathesis for multiple lines',
    start: ['|test(test)', 'test(test)'],
    keysPressed: 'vi)d',
    end: ['test(|)', 'test(test)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vi) on multiple matching parens',
    start: ['test(te(te|st)st)'],
    keysPressed: 'vi)i)d',
    end: ['test(|)'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do va) on a matching parenthesis',
    start: ['test(te|st);'],
    keysPressed: 'va)d',
    end: ['test|;'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do va) on a matching parenthesis from outside parenthesis',
    start: ['|test(test);'],
    keysPressed: 'va)d',
    end: ['test|;'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do va) on multiple matching parens',
    start: ['test(te(te|st)st);'],
    keysPressed: 'va)a)d',
    end: ['test|;'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Failed va) does not expand or move selection, remains in visual mode',
    start: ['one | two'],
    keysPressed: 'v4a)d',
    end: ['one |two'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Repeat-prefixed va) does not bleed below',
    start: ['(', '\t(', '\t|', '\t)', ')', '', 'do not delete'],
    keysPressed: 'v8a)d',
    end: ['|', '', 'do not delete'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do va} on a matching bracket as first character',
    start: ['1|{', 'test', '}1'],
    keysPressed: 'va}d',
    end: ['1|1'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do va} on multiple matching brackets',
    start: ['test{te{te|st}st};'],
    keysPressed: 'va}a}d',
    end: ['test|;'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vi( on a matching bracket near first character',
    start: ['test(()=>{', '|', '});'],
    keysPressed: 'vi(d',
    end: ['test(|);'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vi{ on outer pair of nested braces',
    start: ['{', '  te|st', '  {', '    test', '  }', '}'],
    keysPressed: 'vi{d',
    end: ['{', '|}'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vi{ on braces indented by 1 and preserve indent',
    start: ['{', '  t|est', ' }'],
    keysPressed: 'vi{d',
    end: ['{', '| }'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do va] on multiple matching brackets',
    start: ['test[te[te|st]st];'],
    keysPressed: 'va]a]d',
    end: ['test|;'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do repeat-prefixed vaf on multiple matching pairs of different types',
    start: ['test <div><p>[[{{((|))}}]]</p></div> test;'],
    keysPressed: 'v8afd',
    end: ['test | test;'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Repeat-prefixed vaf does not bleed below',
    start: ['<p>', '\t(', '\t|', '\t)', '</p>', '', 'do not delete'],
    keysPressed: 'v8afd',
    end: ['|', '', 'do not delete'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'vaf only expands to enclosing pairs',
    start: ['test (f|oo) "hi" test;'],
    keysPressed: 'vafd',
    end: ['test | "hi" test;'],
    endMode: Mode.Normal,
  });
  suite('handles replace in visual mode', () => {
    newTest({
      title: 'Can do a single line replace',
      start: ['one |two three four five'],
      keysPressed: 'vwwer1',
      end: ['one |11111111111111 five'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Can do a multi line replace',
      start: ['one |two three four five', 'one two three four five'],
      keysPressed: 'vjer1',
      end: ['one |1111111111111111111', '1111111 three four five'],
      endMode: Mode.Normal,
    });
  });

  newTest({
    title: 'Can use . to repeat indent in visual',
    start: ['|foobar'],
    keysPressed: 'v>.',
    end: ['    |foobar'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do v_x to delete to first char',
    start: ['', 'test te|st test', ''],
    keysPressed: 'v_x',
    end: ['', '|t test', ''],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do vg_x to delete to last char with no EOL',
    start: ['', 'test te|st test', ''],
    keysPressed: 'vg_x',
    end: ['', 'test t|e', ''],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do v3g_x to delete to last char with no EOL with count',
    start: ['te|st', 'test', 'test', 'test'],
    keysPressed: 'v3g_x',
    end: ['t|e', 'test'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can do v$x to delete to last char including EOL',
    start: ['', 'test te|st test', ''],
    keysPressed: 'v$x',
    end: ['', 'test t|e'],
    endMode: Mode.Normal,
  });

  suite('`gv` restores previous visual selection', () => {
    suite('Visual mode', () => {
      newTest({
        title: 'Single char',
        start: ['one t|wo three'],
        keysPressed: 'v' + '<Esc>' + '0' + 'gv' + 'd',
        end: ['one t|o three'],
        endMode: Mode.Normal,
      });

      newTest({
        title: 'Forward selection, within line',
        start: ['one |two three'],
        keysPressed: 've' + '<Esc>' + '0' + 'gv' + 'd',
        end: ['one | three'],
        endMode: Mode.Normal,
      });

      newTest({
        title: 'Backward selection, within line',
        start: ['one tw|o three'],
        keysPressed: 'vb' + '<Esc>' + '0' + 'gv' + 'd',
        end: ['one | three'],
        endMode: Mode.Normal,
      });

      newTest({
        title: 'Forward selection, on EOL',
        start: ['one', 't|wo', 'three'],
        keysPressed: 'v$' + '<Esc>' + 'gg' + 'gv' + 'd',
        end: ['one', 't|three'],
        endMode: Mode.Normal,
      });
    });

    suite('VisualLine mode', () => {
      newTest({
        title: 'Single line',
        start: ['one', '|two', 'three'],
        keysPressed: 'V' + '<Esc>' + 'gg' + 'gv' + 'd',
        end: ['one', '|three'],
        endMode: Mode.Normal,
      });

      newTest({
        title: 'Forward selection',
        start: ['one', '|two', 'three', 'four', 'five'],
        keysPressed: 'Vjj' + '<Esc>' + 'gg' + 'gv' + 'd',
        end: ['one', '|five'],
        endMode: Mode.Normal,
      });

      newTest({
        title: 'Backward selection',
        start: ['one', 'two', 'three', '|four', 'five'],
        keysPressed: 'Vkk' + '<Esc>' + 'gg' + 'gv' + 'd',
        end: ['one', '|five'],
        endMode: Mode.Normal,
      });
    });

    suite('VisualBlock mode', () => {
      newTest({
        title: 'Single char',
        start: ['one', 't|wo', 'three'],
        keysPressed: '<C-v>' + '<Esc>' + 'gg' + 'gv' + 'd',
        end: ['one', 't|o', 'three'],
        endMode: Mode.Normal,
      });

      newTest({
        title: 'Forward selection, 3x3',
        start: ['abcde', 'b|cdea', 'cdeab', 'deabc', 'eabcd'],
        keysPressed: '<C-v>jjll' + '<Esc>' + 'gg' + 'gv' + 'd',
        end: ['abcde', 'b|a', 'cb', 'dc', 'eabcd'],
        endMode: Mode.Normal,
      });

      newTest({
        title: 'Backward selection, 3x3',
        start: ['abcde', 'bcdea', 'cdeab', 'dea|bc', 'eabcd'],
        keysPressed: '<C-v>kkhh' + '<Esc>' + 'gg' + 'gv' + 'd',
        end: ['abcde', 'b|a', 'cb', 'dc', 'eabcd'],
        endMode: Mode.Normal,
      });
    });
  });

  suite('D command will remove all selected lines', () => {
    newTest({
      title: 'D deletes all selected lines',
      start: ['first line', 'test| line1', 'test line2', 'second line'],
      keysPressed: 'vjD',
      end: ['first line', '|second line'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'D deletes the current line',
      start: ['first line', 'test| line1', 'second line'],
      keysPressed: 'vlllD',
      end: ['first line', '|second line'],
      endMode: Mode.Normal,
    });
  });

  suite('handles indent blocks in visual mode', () => {
    newTest({
      title: 'Can do vai',
      start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
      keysPressed: 'vaid',
      end: ['|do_something_else()'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Can do vii',
      start: ['if foo > 3:', '    bar|', '    if baz:', '        foo = 3', 'do_something_else()'],
      keysPressed: 'viid',
      end: ['if foo > 3:', '|do_something_else()'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Doesn't naively select the next line",
      start: ['if foo > 3:', '    bar|', 'if foo > 3:', '    bar'],
      keysPressed: 'viid',
      end: ['if foo > 3:', '|if foo > 3:', '    bar'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Searches backwards if cursor line is empty',
      start: ['if foo > 3:', '    log("foo is big")', '|', '    foo = 3', 'do_something_else()'],
      keysPressed: 'viid',
      end: ['if foo > 3:', '|do_something_else()'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Can do vaI',
      start: ['if foo > 3:', '    log("foo is big")|', '    foo = 3', 'do_something_else()'],
      keysPressed: 'vaId',
      end: ['|'],
      endMode: Mode.Normal,
    });
  });

  suite('visualstar', () => {
    setup(async () => {
      Globals.mockConfiguration.visualstar = true;
      await reloadConfiguration();
    });

    newTest({
      title: 'Works with *',
      start: [
        '|public modes = [ModeName.Visual',
        'public modes = [ModeName.VisualBlock',
        'public modes = [ModeName.VisualLine',
      ],
      // This is doing a few things:
      // - select to the end of "Visual"
      // - press "*", the cursor will go to the next line since it matches
      // - press "n", the cursor will go to the last line since it matches
      keysPressed: '2vfl*n',
      end: [
        'public modes = [ModeName.Visual',
        'public modes = [ModeName.VisualBlock',
        '|public modes = [ModeName.VisualLine',
      ],
      endMode: Mode.Normal,
    });

    newTest({
      title: '`*` escapes `/` properly',
      start: ['one |two//three four', 'one two//three four'],
      keysPressed: 'vE*',
      end: ['one two//three four', 'one |two//three four'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Works with #',
      start: [
        'public modes = [ModeName.Visual',
        'public modes = [ModeName.VisualBlock',
        '|public modes = [ModeName.VisualLine',
      ],
      // This is doing a few things:
      // - select to the end of "Visual"
      // - press "#", the cursor will go to the previous line since it matches
      // - press "n", the cursor will go to the first line since it matches
      keysPressed: '2vfl#n',
      end: [
        '|public modes = [ModeName.Visual',
        'public modes = [ModeName.VisualBlock',
        'public modes = [ModeName.VisualLine',
      ],
      endMode: Mode.Normal,
    });
  });

  suite('search works in visual mode', () => {
    newTest({
      title: 'Works with /',
      start: ['f|oo', 'bar', 'fun', 'baz'],
      keysPressed: 'v/baz\nx',
      end: ['f|az'],
    });

    newTest({
      title: 'Works with ?',
      start: ['foo', 'bar', 'fun', 'b|az'],
      keysPressed: 'v?foo\nx',
      end: ['|z'],
    });

    test('Selects correct range', async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo bar fun baz'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'v', 'w', '/']);

      const selection = modeHandler.vimState.editor.selection;
      // ensuring selection range starts from the beginning
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 0);
      assert.strictEqual(selection.end.character, 4);
      assert.strictEqual(selection.end.line, 0);
    });
  });

  suite('X will delete linewise', () => {
    newTest({
      title: 'normal selection',
      start: ['this is', 'the| best', 'test i have seen in', 'the world'],
      keysPressed: 'vjX',
      end: ['this is', '|the world'],
    });

    newTest({
      title: 'normal selection',
      start: ['this is', 'the| best', 'test i have seen in', 'the world'],
      keysPressed: 'vj$X',
      end: ['this is', '|the world'],
    });

    newTest({
      title: 'Backward selection',
      start: ['one', 'two', 't|hree', 'four'],
      keysPressed: 'vkX',
      end: ['one', '|four'],
    });
  });

  suite('C will delete linewise', () => {
    newTest({
      title: 'normal selection',
      start: ['this is', 'the| best', 'test i have seen in', 'the world'],
      keysPressed: 'vjC',
      end: ['this is', '|', 'the world'],
    });

    newTest({
      title: 'normal selection',
      start: ['this is', 'the| best', 'test i have seen in', 'the world'],
      keysPressed: 'vj$C',
      end: ['this is', '|', 'the world'],
    });
  });

  suite('R will delete linewise', () => {
    newTest({
      title: 'normal selection',
      start: ['this is', 'the| best', 'test i have seen in', 'the world'],
      keysPressed: 'vjR',
      end: ['this is', '|', 'the world'],
    });

    newTest({
      title: 'normal selection',
      start: ['this is', 'the| best', 'test i have seen in', 'the world'],
      keysPressed: 'vj$R',
      end: ['this is', '|', 'the world'],
    });
  });

  suite('Linewise Registers will be inserted properly', () => {
    newTest({
      title: 'downward selection',
      start: ['i ya|nked', 'this line', '', '1.line', 'a123456', 'b123456', '2.line'],
      keysPressed: 'vjY4j3lvjllp',
      end: ['i yanked', 'this line', '', '1.line', 'a12', '|i yanked', 'this line', '6', '2.line'],
    });

    newTest({
      title: 'upward selection',
      start: ['i yanked', 'this| line', '', '1.line', 'a123456', 'b123456', '2.line'],
      keysPressed: 'vkY4j3lvjllp',
      end: ['i yanked', 'this line', '', '1.line', 'a12', '|i yanked', 'this line', '6', '2.line'],
    });
  });

  suite('Indent Tests using > on visual selections', () => {
    newTest({
      title: 'multiline indent top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'Vjj>',
      end: ['111', '  |222', '  333', '  444', '555'],
    });

    newTest({
      title: 'multiline indent bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'Vkk>',
      end: ['111', '  |222', '  333', '  444', '555'],
    });

    newTest({
      title: 'repeat multiline indent top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'Vjj>.',
      end: ['111', '    |222', '    333', '    444', '555'],
    });

    newTest({
      title: 'repeat multiline indent bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'Vkk>.',
      end: ['111', '    |222', '    333', '    444', '555'],
    });
  });

  suite('Outdent Tests using < on visual selections', () => {
    newTest({
      title: 'multiline outdent top down selection',
      start: ['    111', '    2|22', '    333', '   444', '    555'],
      keysPressed: 'Vjj<',
      end: ['    111', '  |222', '  333', '  444', '    555'],
    });

    newTest({
      title: 'multiline outdent bottom up selection',
      start: ['    111', '    222', '    333', '   4|44', '    555'],
      keysPressed: 'Vkk<',
      end: ['    111', '  |222', '  333', '  444', '    555'],
    });

    newTest({
      title: 'repeat multiline outdent top down selection',
      start: ['    111', '    2|22', '    333', '   444', '    555'],
      keysPressed: 'Vjj<.',
      end: ['    111', '|222', '333', '444', '    555'],
    });

    newTest({
      title: 'repeat multiline outdent bottom up selection',
      start: ['    111', '    222', '    333', '   4|44', '    555'],
      keysPressed: 'Vkk<.',
      end: ['    111', '|222', '333', '444', '    555'],
    });
  });

  suite('Non-darwin <C-c> tests', () => {
    if (process.platform === 'darwin') {
      return;
    }

    test('<C-c> copies and sets mode to normal', async () => {
      await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'v', 'e', '<C-c>']);

      // ensuring we're back in normal
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
      assertEqualLines(['one two three']);

      // test copy by pasting back
      await modeHandler.handleMultipleKeyEvents(['^', '"', '+', 'P']);

      assertEqualLines(['oneone two three']);
    });
  });

  suite('vi{ will go to end of second to last line', () => {
    newTest({
      title: 'select',
      start: ['    func() {', '    |    hi;', '        alw;', '    }'],
      keysPressed: 'vi{yG0P',
      end: ['    func() {', '        hi;', '        alw;', '|        hi;', '        alw;', '    }'],
    });
  });

  suite('Transition between visual mode', () => {
    test('vv will back to normal mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['v']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
      await modeHandler.handleMultipleKeyEvents(['v']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    });

    test('vV will transit to visual line mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['v']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
      await modeHandler.handleMultipleKeyEvents(['V']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualLine);
    });

    test('v<C-v> will transit to visual block mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['v']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
      await modeHandler.handleMultipleKeyEvents(['<C-v>']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualBlock);
    });

    test('Vv will transit to visual (char) mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['V']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualLine);
      await modeHandler.handleMultipleKeyEvents(['v']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    });

    test('VV will back to normal mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['V']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualLine);
      await modeHandler.handleMultipleKeyEvents(['V']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    });

    test('V<C-v> will transit to visual block mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['V']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualLine);
      await modeHandler.handleMultipleKeyEvents(['<C-v>']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualBlock);
    });

    test('<C-v>v will transit to visual (char) mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['<C-v>']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualBlock);
      await modeHandler.handleMultipleKeyEvents(['v']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    });

    test('<C-v>V will back to visual line mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['<C-v>']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualBlock);
      await modeHandler.handleMultipleKeyEvents(['V']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualLine);
    });

    test('<C-v><C-v> will back to normal mode', async () => {
      await modeHandler.handleMultipleKeyEvents(['<C-v>']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualBlock);
      await modeHandler.handleMultipleKeyEvents(['<C-v>']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    });
  });

  suite('replace text in characterwise visual-mode with characterwise register content', () => {
    test('gv selects the last pasted text (which is shorter than original)', async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ireplace this\nwith me\nor with me longer than the target'.split(''),
      );
      await modeHandler.handleMultipleKeyEvents(['<Esc>']);
      await modeHandler.handleMultipleKeyEvents(
        '2ggv$hy'.split(''), // yank the second line
      );
      await modeHandler.handleMultipleKeyEvents(
        'ggv$hp'.split(''), // replace the first line
      );
      await modeHandler.handleMultipleKeyEvents(['g', 'v']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
      assertEqualLines(['with me', 'with me', 'or with me longer than the target']);

      const selection = modeHandler.vimState.editor.selection;
      // ensuring selecting 'with me' at the first line
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 0);
      assert.strictEqual(selection.end.character, 'with me'.length);
      assert.strictEqual(selection.end.line, 0);
    });

    test('gv selects the last pasted text (which is longer than original)', async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ireplace this\nwith me\nor with me longer than the target'.split(''),
      );
      await modeHandler.handleMultipleKeyEvents(['<Esc>']);
      await modeHandler.handleMultipleKeyEvents(
        'v0y'.split(''), // yank the last line
      );
      await modeHandler.handleMultipleKeyEvents(
        'ggv$hp'.split(''), // replace the first line
      );
      await modeHandler.handleMultipleKeyEvents(['g', 'v']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
      assertEqualLines([
        'or with me longer than the target',
        'with me',
        'or with me longer than the target',
      ]);

      const selection = modeHandler.vimState.editor.selection;
      // ensuring selecting 'or with me longer than the target' at the first line
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 0);
      assert.strictEqual(selection.end.character, 'or with me longer than the target'.length);
      assert.strictEqual(selection.end.line, 0);
    });

    test('gv selects the last pasted text (multiline)', async () => {
      await modeHandler.handleMultipleKeyEvents('ireplace this\nfoo\nbar'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>']);
      await modeHandler.handleMultipleKeyEvents(
        '2ggvjey'.split(''), // yank 'foo\nbar'
      );
      await modeHandler.handleMultipleKeyEvents(
        'ggvep'.split(''), // replace 'replace'
      );
      await modeHandler.handleMultipleKeyEvents(['g', 'v']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
      assertEqualLines(['foo', 'bar this', 'foo', 'bar']);

      const selection = modeHandler.vimState.editor.selection;
      // ensuring selecting 'foo\nbar'
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 0);
      assert.strictEqual(selection.end.character, 3);
      assert.strictEqual(selection.end.line, 1);
    });
  });

  suite('can handle gn', () => {
    test('gn selects the next match text', async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('ggv'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 0);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 1);
    });

    test('gn selects the current word at |hello', async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('2ggv'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 5);
      assert.strictEqual(selection.end.line, 1);
    });

    test('gn selects the current word at h|ello', async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('2gglv'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 1);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 5);
      assert.strictEqual(selection.end.line, 1);
    });

    test('gn selects the current word at hel|lo', async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('2ggehv'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 3);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 5);
      assert.strictEqual(selection.end.line, 1);
    });

    test('gn selects the next word at hell|o', async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('2ggev'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 4);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 5);
      assert.strictEqual(selection.end.line, 2);
    });

    test('gn selects the next word at hello|', async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('2ggelv'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 5);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 5);
      assert.strictEqual(selection.end.line, 2);
    });
  });

  suite('can prepend text with I', () => {
    newTest({
      title: 'multiline insert from bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'vkkI_',
      end: ['111', '2_|22', '_333', '_444', '555'],
    });

    newTest({
      title: 'multiline insert from top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'vjjI_',
      end: ['111', '2_|22', '_333', '_444', '555'],
    });

    newTest({
      title: 'skips blank lines',
      start: ['111', '2|22', ' ', '444', '555'],
      keysPressed: 'vjjI_',
      end: ['111', '2_|22', ' ', '_444', '555'],
    });
  });

  suite('can append text with A', () => {
    newTest({
      title: 'multiline append from bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'vkkA_',
      end: ['111', '222_|', '333_', '44_4', '555'],
    });

    newTest({
      title: 'multiline append from top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'vjjA_',
      end: ['111', '222_|', '333_', '44_4', '555'],
    });

    newTest({
      title: 'skips blank lines',
      start: ['111', '2|22', ' ', '444', '555'],
      keysPressed: 'vjjA_',
      end: ['111', '222_|', ' ', '44_4', '555'],
    });
  });

  suite('Can handle u/gu, U/gU', () => {
    newTest({
      title: 'U/gU on single character',
      start: ['|one two three'],
      keysPressed: 'vUwwvgU',
      end: ['One two |Three'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'U/gU across a selection',
      start: ['|one two three'],
      keysPressed: 'vllllUwwvlgU',
      end: ['ONE Two |THree'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'U/gU across a selection (reverse)',
      start: ['|one two three'],
      keysPressed: 'wvhhUwwvhhgU',
      end: ['onE Tw|O Three'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'u/gu on single character',
      start: ['|ONE TWO THREE'],
      keysPressed: 'vuwwvgu',
      end: ['oNE TWO |tHREE'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'u/gu across a selection',
      start: ['|ONE TWO THREE'],
      keysPressed: 'vlllluwwvlgu',
      end: ['one tWO |thREE'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'u/gu across a selection (reverse)',
      start: ['|ONE TWO THREE'],
      keysPressed: 'wvhhuwwvhhgu',
      end: ['ONe tW|o tHREE'],
      endMode: Mode.Normal,
    });
  });

  suite('Can handle ~/g~', () => {
    newTest({
      title: '~/g~ on single character',
      start: ['|one TWO three FOUR'],
      keysPressed: 'v~wvg~wv~wvg~',
      end: ['One tWO Three |fOUR'],
      endMode: Mode.Normal,
    });

    newTest({
      title: '~/g~ across a selection',
      start: ['|OnE TwO tHrEe'],
      keysPressed: 'vllll~wwvlg~',
      end: ['oNe twO |ThrEe'],
      endMode: Mode.Normal,
    });
  });

  newTest({
    title: "Can handle 'J' when the selected area spans multiple lines",
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: 'vjjJ',
    end: ['one two| three', 'four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'gJ' when the entire selected area is on the same line",
    start: ['one', '|two', 'three', 'four'],
    keysPressed: 'vlgJ',
    end: ['one', 'two|three', 'four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'gJ' when the selected area spans multiple lines",
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: 'vjjgJ',
    end: ['onetwo|three', 'four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'gJ' when the selected area spans multiple lines and line has whitespaces",
    start: ['o|ne  ', 'two', '  three', 'four'],
    keysPressed: 'vjjgJ',
    end: ['one  two|  three', 'four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'gJ' when start position of the selected area is below the stop",
    start: ['one', 'two', 't|hree', 'four'],
    keysPressed: 'vkkgJ',
    end: ['onetwo|three', 'four'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Preserves desired column correctly when moving in visual mode',
    start: ['|one', '', 'two', 'three'],
    keysPressed: 'vjj<Esc>',
    end: ['one', '', '|two', 'three'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Updates desired column correctly when moving in visual mode',
    start: ['|one', 'two', 'three'],
    keysPressed: 'vlj<Esc>',
    end: ['one', 't|wo', 'three'],
    endMode: Mode.Normal,
  });

  suite('C, R, and S', () => {
    for (const command of ['C', 'R', 'S']) {
      newTest({
        title: `'${command}' deletes selected lines and puts you into insert mode`,
        start: ['AAAAA', 'BB|BBB', 'CCCCC', 'DDDDD', 'EEEEE'],
        keysPressed: `vjjh${command}`,
        end: ['AAAAA', '|', 'EEEEE'],
        endMode: Mode.Insert,
      });

      newTest({
        title: `'${command}' deletes selected lines and puts you into insert mode (backward selection)`,
        start: ['AAAAA', 'BBBBB', 'CCCCC', 'DD|DDD', 'EEEEE'],
        keysPressed: `vkkl${command}`,
        end: ['AAAAA', '|', 'EEEEE'],
        endMode: Mode.Insert,
      });
    }
  });

  suite('Visual mode with command editor.action.smartSelect.grow', () => {
    newTest({
      title: 'Command editor.action.smartSelect.grow enters visual mode',
      config: {
        normalModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        leader: ' ',
      },
      start: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `    "be|fore": ["j"],`,
        `    "after": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      keysPressed: ' aflh',
      end: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `    "|before": ["j"],`,
        `    "after": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'Command editor.action.smartSelect.grow enters visual mode and increases selection',
      config: {
        normalModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        visualModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        leader: ' ',
      },
      start: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `    "be|fore": ["j"],`,
        `    "after": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      keysPressed: ' af afd',
      end: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `   | `,
        `    "after": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Command editor.action.smartSelect.grow enters visual mode on single character',
      config: {
        normalModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        visualModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        leader: ' ',
      },
      start: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `    "before": ["|j"],`,
        `    "after": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      keysPressed: ' afd',
      end: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `    "before": ["|"],`,
        `    "after": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Command editor.action.smartSelect.grow enters visual mode on multicursors',
      config: {
        normalModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        visualModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        leader: ' ',
      },
      start: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `    "before": ["|j"],`,
        `    "after": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      // the initial 'vlgb<Esc>_ll' is just to create a multicursor on the words 'before' and 'after'
      keysPressed: 'vlgb<Esc>_ll afd<Esc>',
      end: [
        `"vim.normalModeKeyBindingsNonRecursive": [`,
        `  {`,
        `    "|": ["j"],`,
        `    "": ["g", "j"],`,
        `  },`,
        `]`,
      ],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Command editor.action.smartSelect.expand on visual mode linewise',
      config: {
        visualModeKeyBindings: [
          {
            before: ['J'],
            commands: ['editor.action.smartSelect.expand'],
          },
        ],
        leader: ' ',
      },
      start: [
        `{`,
        `  "vim.visualModeKeyBindingsNonRecursive": [`,
        `    {|`,
        `      "before": ["J"],`,
        `      "commands": ["editor.action.smartSelect.expand"]`,
        `    },`,
        `    {`,
        `      "before": ["K"],`,
        `      "commands": ["editor.action.smartSelect.shrink"]`,
        `    }`,
        `  ],`,
        `}`,
      ],
      keysPressed: 'VJd',
      end: [
        `{`,
        `  "vim.visualModeKeyBindingsNonRecursive": [`,
        `|`,
        `    {`,
        `      "before": ["K"],`,
        `      "commands": ["editor.action.smartSelect.shrink"]`,
        `    }`,
        `  ],`,
        `}`,
      ],
      endMode: Mode.Normal,
    });
  });
});
