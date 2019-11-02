import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { TextEditor } from '../../src/textEditor';
import { getTestingFunctions } from '../testSimplifier';
import { assertEqual, assertEqualLines, cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Visual Line', () => {
  let modeHandler: ModeHandler;

  const { newTest, newTestOnly, newTestSkip } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('can be activated', async () => {
    await modeHandler.handleKeyEvent('v');
    assertEqual(modeHandler.currentMode.name, ModeName.Visual);

    await modeHandler.handleKeyEvent('v');
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test('Can handle w', async () => {
    await modeHandler.handleMultipleKeyEvents('itest test test\ntest\n'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'v', 'w']);

    const sel = TextEditor.getSelection();

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

    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test('Can handle x across a selection', async () => {
    await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '^', 'v', 'w', 'x']);

    assertEqualLines(['wo three']);

    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
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
    assertEqual(modeHandler.currentMode.name, ModeName.Insert);
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
      endMode: ModeName.Insert,
    });
  });

  suite('handles replace in visual line mode', () => {
    newTest({
      title: 'Can do a single line replace',
      start: ['one |two three four five', 'one two three four five'],
      keysPressed: 'Vr1',
      end: ['|11111111111111111111111', 'one two three four five'],
      endMode: ModeName.Normal,
    });

    newTest({
      title: 'Can do a multi visual line replace',
      start: ['one |two three four five', 'one two three four five'],
      keysPressed: 'Vjr1',
      end: ['|11111111111111111111111', '11111111111111111111111'],
      endMode: ModeName.Normal,
    });

    newTest({
      title: 'Can do a multi visual line replace from the bottom up',
      start: ['test', 'test', 'test', '|test', 'test'],
      keysPressed: 'Vkkr1',
      end: ['test', '|1111', '1111', '1111', 'test'],
      endMode: ModeName.Normal,
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
      assertEqual(modeHandler.currentMode.name, ModeName.Normal);

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

    test('gv selects the last pasted text (which is shorter than original)', async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ireplace this\nwith me\nor with me longer than the target'.split('')
      );
      await modeHandler.handleMultipleKeyEvents(['<Esc>']);
      await modeHandler.handleMultipleKeyEvents(
        '2ggyy'.split('') // yank the second line
      );
      await modeHandler.handleMultipleKeyEvents(
        'ggVp'.split('') // replace the first line
      );
      await modeHandler.handleMultipleKeyEvents(['g', 'v']);

      assertEqual(modeHandler.currentMode.name, ModeName.VisualLine);
      assertEqualLines(['with me', 'with me', 'or with me longer than the target']);

      const selection = TextEditor.getSelection();

      // ensuring selecting 'with me' at the first line
      assertEqual(selection.start.character, 0);
      assertEqual(selection.start.line, 0);
      assertEqual(selection.end.character, 'with me'.length);
      assertEqual(selection.end.line, 0);
    });

    test('gv selects the last pasted text (which is longer than original)', async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ireplace this\nwith me\nor with me longer than the target'.split('')
      );
      await modeHandler.handleMultipleKeyEvents(['<Esc>']);
      await modeHandler.handleMultipleKeyEvents(
        'yy'.split('') // yank the last line
      );
      await modeHandler.handleMultipleKeyEvents(
        'ggVp'.split('') // replace the first line
      );
      await modeHandler.handleMultipleKeyEvents(['g', 'v']);

      assertEqual(modeHandler.currentMode.name, ModeName.VisualLine);
      assertEqualLines([
        'or with me longer than the target',
        'with me',
        'or with me longer than the target',
      ]);

      const selection = TextEditor.getSelection();

      // ensuring selecting 'or with me longer than the target' at the first line
      assertEqual(selection.start.character, 0);
      assertEqual(selection.start.line, 0);
      assertEqual(selection.end.character, 'or with me longer than the target'.length);
      assertEqual(selection.end.line, 0);
    });

    test('gv selects the last pasted text (multiline)', async () => {
      await modeHandler.handleMultipleKeyEvents('ireplace this\nfoo\nbar'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>']);
      await modeHandler.handleMultipleKeyEvents(
        'Vky'.split('') // yank 'foo\nbar\n'
      );
      await modeHandler.handleMultipleKeyEvents(
        'ggVp'.split('') // replace the first line
      );
      await modeHandler.handleMultipleKeyEvents(['g', 'v']);

      assertEqual(modeHandler.currentMode.name, ModeName.VisualLine);
      assertEqualLines(['foo', 'bar', 'foo', 'bar']);

      const selection = TextEditor.getSelection();

      // ensuring selecting 'foo\nbar\n'
      assertEqual(selection.start.character, 0);
      assertEqual(selection.start.line, 0);
      assertEqual(selection.end.character, 3);
      assertEqual(selection.end.line, 1);
    });
  });

  suite('can prepend text with I', () => {
    newTest({
      title: 'multiline insert from bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'VkkI_',
      end: ['111', '_|222', '_333', '_444', '555'],
    });

    newTest({
      title: 'multiline insert from top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'VjjI_',
      end: ['111', '_|222', '_333', '_444', '555'],
    });

    newTest({
      title: 'skips blank lines',
      start: ['111', '2|22', ' ', '444', '555'],
      keysPressed: 'VjjI_',
      end: ['111', '_|222', ' ', '_444', '555'],
    });
  });

  suite('can append text with A', () => {
    newTest({
      title: 'multiline append from bottom up selection',
      start: ['111', '222', '333', '4|44', '555'],
      keysPressed: 'VkkA_',
      end: ['111', '222_|', '333_', '444_', '555'],
    });

    newTest({
      title: 'multiline append from top down selection',
      start: ['111', '2|22', '333', '444', '555'],
      keysPressed: 'VjjA_',
      end: ['111', '222_|', '333_', '444_', '555'],
    });

    newTest({
      title: 'skips blank lines',
      start: ['111', '2|22', ' ', '444', '555'],
      keysPressed: 'VjjA_',
      end: ['111', '222_|', ' ', '444_', '555'],
    });
  });
});
