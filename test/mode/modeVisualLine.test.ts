import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTest } from '../testSimplifier';
import { assertEqualLines, setupWorkspace } from './../testUtils';

suite('Mode Visual Line', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test('can be activated', async () => {
    await modeHandler.handleKeyEvent('V');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualLine);

    await modeHandler.handleKeyEvent('V');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  newTest({
    title: '<count>V selects <count> lines',
    start: ['|Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5'],
    keysPressed: 'j3V',
    end: ['Line 1', '[Line 2', 'Line 3', '|L]ine 4', 'Line 5'],
    endMode: Mode.VisualLine,
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
  });

  suite('Arrow keys work perfectly in Visual Line Mode', () => {
    newTest({
      title: 'Can handle <up> key',
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'V<up>x',
      end: ['blah', '|hur'],
    });

    newTest({
      title: 'Can handle <down> key',
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'V<down>x',
      end: ['blah', '|duh'],
    });
  });

  suite('Screen line motions in Visual Line Mode', () => {
    newTest({
      title: "Can handle 'gk'",
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'Vgkx',
      end: ['blah', '|hur'],
    });

    newTest({
      title: "Can handle 'gj'",
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'Vgjx',
      end: ['blah', '|duh'],
    });
  });

  suite('Can handle d/c correctly in Visual Line Mode', () => {
    newTest({
      title: 'Can handle d key',
      start: ['|{', '  a = 1;', '}'],
      keysPressed: 'VGdp',
      end: ['', '|{', '  a = 1;', '}'],
    });

    newTest({
      title: 'Can handle d key',
      start: ['|{', '  a = 1;', '}'],
      keysPressed: 'VGdP',
      end: ['|{', '  a = 1;', '}', ''],
    });

    newTest({
      title: 'Can handle d key',
      start: ['1', '2', '|{', '  a = 1;', '}'],
      keysPressed: 'VGdp',
      end: ['1', '2', '|{', '  a = 1;', '}'],
    });

    newTest({
      title: 'Can handle d key',
      start: ['1', '2', '|{', '  a = 1;', '}'],
      keysPressed: 'VGdP',
      end: ['1', '|{', '  a = 1;', '}', '2'],
    });

    newTest({
      title: "can handle 'c'",
      start: ['foo', 'b|ar', 'fun'],
      keysPressed: 'Vc',
      end: ['foo', '|', 'fun'],
      endMode: Mode.Insert,
    });
  });

  suite('handles replace in visual line mode', () => {
    newTest({
      title: 'Can do a single line replace',
      start: ['one |two three four five', 'one two three four five'],
      keysPressed: 'Vr1',
      end: ['|11111111111111111111111', 'one two three four five'],
    });

    newTest({
      title: 'Can do a multi visual line replace',
      start: ['one |two three four five', 'one two three four five'],
      keysPressed: 'Vjr1',
      end: ['|11111111111111111111111', '11111111111111111111111'],
    });

    newTest({
      title: 'Can do a multi visual line replace from the bottom up',
      start: ['test', 'test', 'test', '|test', 'test'],
      keysPressed: 'Vkkr1',
      end: ['test', '|1111', '1111', '1111', 'test'],
    });
  });

  suite('search works in visual line mode', () => {
    newTest({
      title: 'Works with /',
      start: ['f|oo', 'bar', 'fun', 'baz'],
      keysPressed: 'V/fun\nx',
      end: ['|baz'],
    });

    newTest({
      title: 'Works with ?',
      start: ['foo', 'bar', 'fun', 'b|az'],
      keysPressed: 'V?bar\nx',
      end: ['|foo'],
    });
  });

  suite('Non-darwin <C-c> tests', () => {
    if (process.platform === 'darwin') {
      return;
    }

    test('<C-c> copies and sets mode to normal', async () => {
      await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'Y', 'p']);

      assertEqualLines(['one two three', 'one two three']);

      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'H', 'V', '<C-c>']);

      // ensuring we're back in normal
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

      // test copy by pasting back from clipboard
      await modeHandler.handleMultipleKeyEvents(['H', '"', '+', 'P']);

      // TODO: should be assertEqualLines(['one two three', 'one two three', 'one two three']);
      // unfortunately it is
      assertEqualLines(['one two threeone two three', 'one two three']);
    });
  });

  newTest({
    title: 'Vp updates register content',
    start: ['|hello', 'world'],
    keysPressed: 'ddVpP',
    end: ['|world', 'hello'],
  });

  newTest({
    title: '"xVp only updates default register content',
    start: ['|abc', 'def', 'ghi'],
    keysPressed: 'V"ayjVj"ap"app',
    end: ['abc', 'abc', 'abc', '|def', 'ghi'],
  });

  newTest({
    title: 'Vp does not append unnecessary newlines (first line)',
    start: ['|begin', 'middle', 'end'],
    keysPressed: 'yyVp',
    end: ['|begin', 'middle', 'end'],
  });

  newTest({
    title: 'Vp does not append unnecessary newlines (middle line)',
    start: ['begin', '|middle', 'end'],
    keysPressed: 'yyVp',
    end: ['begin', '|middle', 'end'],
  });

  newTest({
    title: 'Vp does not append unnecessary newlines (last line)',
    start: ['begin', 'middle', '|end'],
    keysPressed: 'yyVp',
    end: ['begin', 'middle', '|end'],
  });

  newTest({
    title: 'Vp places the cursor on first non-whitespace character on line',
    start: ['begin', '|    middle', 'end'],
    keysPressed: 'yyjVp',
    end: ['begin', '    middle', '    |middle'],
  });

  suite('replace text in linewise visual-mode with linewise register content', () => {
    newTest({
      title: 'yyVp does not change the content but changes cursor position',
      start: ['fo|o', 'bar', 'fun', 'baz'],
      keysPressed: 'yyVp',
      end: ['|foo', 'bar', 'fun', 'baz'],
    });

    newTest({
      title: 'linewise visual put works also in the end of document',
      start: ['foo', 'bar', 'fun', '|baz'],
      keysPressed: 'yyVp',
      end: ['foo', 'bar', 'fun', '|baz'],
    });

    // TODO: In these `gv` tests, Vim would put the cursor on the last character, not the line break
    newTest({
      title: 'gv selects the last pasted text (which is shorter than original)',
      start: ['replace this', 'with me', 'or with me longer than the targe|t'],
      keysPressed: '2ggyy' + 'ggVp' + 'gv',
      end: ['[with me|', ']with me', 'or with me longer than the target'],
      endMode: Mode.VisualLine,
    });

    newTest({
      title: 'gv selects the last pasted text (which is longer than original)',
      start: ['replace this', 'with me', 'or with me longer than the targe|t'],
      keysPressed: 'yy' + 'ggVp' + 'gv',
      end: ['[or with me longer than the target|', ']with me', 'or with me longer than the target'],
      endMode: Mode.VisualLine,
    });

    newTest({
      title: 'gv selects the last pasted text (multiline)',
      start: ['replace this', 'foo', 'ba|r'],
      keysPressed: 'Vky' + 'ggVp' + 'gv',
      end: ['[foo', 'bar|', ']foo', 'bar'],
      endMode: Mode.VisualLine,
    });
  });

  suite('can prepend text with I', () => {
    newTest({
      title: 'multiline insert from bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'VkkI_',
      end: ['111', '_|222', '_|333', '_|444', '555'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'multiline insert from top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'VjjI_',
      end: ['111', '_|222', '_|333', '_|444', '555'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'skips blank lines',
      start: ['111', '2|22', ' ', '444', '555'],
      keysPressed: 'VjjI_',
      end: ['111', '_|222', ' ', '_|444', '555'],
      endMode: Mode.Insert,
    });
  });

  suite('can append text with A', () => {
    newTest({
      title: 'multiline append from bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'VkkA_',
      end: ['111', '222_|', '333_|', '444_|', '555'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'multiline append from top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'VjjA_',
      end: ['111', '222_|', '333_|', '444_|', '555'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'skips blank lines',
      start: ['111', '2|22', ' ', '444', '555'],
      keysPressed: 'VjjA_',
      end: ['111', '222_|', ' ', '444_|', '555'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'updates desired column correctly',
      start: ['|111111', '222', '333'],
      keysPressed: 'VjjA<Esc>jk',
      end: ['11111|1', '222', '333'],
    });
  });

  newTest({
    title: 'Exiting via <Esc> returns cursor to original column',
    start: ['rocinante', 'nau|voo', 'anubis', 'canterbury'],
    keysPressed: 'Vj<Esc>',
    end: ['rocinante', 'nauvoo', 'anu|bis', 'canterbury'],
  });

  newTest({
    title: 'Exiting via `VV` returns cursor to original column',
    start: ['rocinante', 'nau|voo', 'anubis', 'canterbury'],
    keysPressed: 'VjV',
    end: ['rocinante', 'nauvoo', 'anu|bis', 'canterbury'],
  });

  suite('Can handle ~/g~ in visual line mode', () => {
    newTest({
      title: '~/g~ on single line',
      start: ['|OnE', 'tWo', 'ThReE', 'fOuR'],
      keysPressed: 'jV~jjVg~',
      end: ['OnE', 'TwO', 'ThReE', '|FoUr'],
    });

    newTest({
      title: '~/g~ on multiple lines',
      start: ['|OnE', 'tWo', 'ThReE', 'fOuR'],
      keysPressed: 'Vj~jjVjg~',
      end: ['oNe', 'TwO', '|tHrEe', 'FoUr'],
    });
  });

  newTest({
    title: "Can handle 'J' when the selected area spans multiple lines",
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: 'VjjJ',
    end: ['one two| three', 'four'],
  });

  newTest({
    title: "Can handle 'gJ' when the entire selected area is on the same line",
    start: ['one', '|two', 'three', 'four'],
    keysPressed: 'VlgJ',
    end: ['one', 'two|three', 'four'],
  });

  newTest({
    title: "Can handle 'gJ' when the selected area spans multiple lines",
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: 'VjjgJ',
    end: ['onetwo|three', 'four'],
  });

  newTest({
    title: "Can handle 'gJ' when the selected area spans multiple lines and line has whitespaces",
    start: ['o|ne  ', 'two', '  three', 'four'],
    keysPressed: 'VjjgJ',
    end: ['one  two|  three', 'four'],
  });

  newTest({
    title: "Can handle 'gJ' when start position of the selected area is below the stop",
    start: ['one', 'two', 't|hree', 'four'],
    keysPressed: 'VkkgJ',
    end: ['onetwo|three', 'four'],
  });

  suite('C, R, and S', () => {
    for (const command of ['C', 'R', 'S']) {
      newTest({
        title: `'${command}' deletes selected lines and puts you into insert mode`,
        start: ['AAAAA', 'BB|BBB', 'CCCCC', 'DDDDD', 'EEEEE'],
        keysPressed: `Vjj${command}`,
        end: ['AAAAA', '|', 'EEEEE'],
        endMode: Mode.Insert,
      });

      newTest({
        title: `'${command}' deletes selected lines and puts you into insert mode (backward selection)`,
        start: ['AAAAA', 'BBBBB', 'CCCCC', 'DD|DDD', 'EEEEE'],
        keysPressed: `Vkk${command}`,
        end: ['AAAAA', '|', 'EEEEE'],
        endMode: Mode.Insert,
      });
    }
  });

  suite('Vi{ should not select the ending brace, if it is on a new line.', () => {
    // TODO: Vim would put the cursor on the last character, not the line break
    newTest({
      title: 'Vi{ selection content test',
      start: ['{', '  so|me text on new line', '}'],
      keysPressed: 'Vi{',
      end: ['{', '[  some text on new line|', ']}'],
      endMode: Mode.VisualLine,
    });
  });
});
