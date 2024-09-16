import * as vscode from 'vscode';
import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace } from './../testUtils';
import { newTest } from '../testSimplifier';

suite('VisualBlock mode', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test('can be activated', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleKeyEvent('<C-v>');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualBlock);

    await modeHandler.handleKeyEvent('<C-v>');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  newTest({
    title: '`[count]<C-v>` selects [count characters]',
    start: ['a|bcde'],
    keysPressed: '3<C-v>d',
    end: ['a|e'],
  });

  newTest({
    title: '`[count]<C-v>` does not go past EOL',
    start: ['a|bcde', '12345'],
    keysPressed: '100<C-v>d',
    end: ['|a', '12345'],
  });

  suite('`A` (append at end of each line of block)', () => {
    newTest({
      title: '`A` with forward selection',
      start: ['t|est', 'test'],
      keysPressed: '<C-v>' + 'lj' + 'A123',
      end: ['tes123|t', 'tes123t'],
    });

    newTest({
      title: '`A` with backward selection',
      start: ['te|st', 'test'],
      keysPressed: '<C-v>' + 'hj' + 'A123',
      end: ['tes123|t', 'tes123t'],
    });

    newTest({
      title: '`A` over shorter line adds necessary spaces',
      start: ['te|st', 'te', 't'],
      keysPressed: '<C-v>' + 'jj' + 'A123',
      end: ['tes123|t', 'te 123', 't  123'],
    });
  });

  suite('`I` (insert at start of each line of block)', () => {
    newTest({
      title: '`I` with forward selection',
      start: ['t|est', 'test'],
      keysPressed: '<C-v>' + 'lj' + 'I123',
      end: ['t123|est', 't123est'],
    });

    newTest({
      title: '`I` with backward selection',
      start: ['te|st', 'test'],
      keysPressed: '<C-v>' + 'hj' + 'I123',
      end: ['t123|est', 't123est'],
    });

    newTest({
      title: 'Can handle `I` with empty lines on first character (inserts on empty line)',
      start: ['|test', '', 'test'],
      keysPressed: '<C-v>' + 'lljj' + 'I123',
      end: ['123|test', '123', '123test'],
    });

    newTest({
      title:
        'Can handle `I` with empty lines on non-first character (does not insert on empty line)',
      start: ['t|est', '', 'test'],
      keysPressed: '<C-v>' + 'lljj' + 'I123',
      end: ['t123|est', '', 't123est'],
    });
  });

  for (const key of ['c', 's']) {
    suite(`Change ('${key}')`, () => {
      newTest({
        title: 'With forward selection',
        start: ['t|est', 'test'],
        keysPressed: '<C-v>' + 'lj' + 'c123',
        end: ['t123|t', 't123t'],
      });

      newTest({
        title: 'With backward selection',
        start: ['te|st', 'test'],
        keysPressed: '<C-v>' + 'hj' + 'c123',
        end: ['t123|t', 't123t'],
      });

      newTest({
        title: 'Skips short lines',
        start: ['te|st', '', 'x', 'test'],
        keysPressed: '<C-v>' + 'h3j' + 'c123',
        end: ['t123|t', '', 'x', 't123t'],
      });
    });
  }

  newTest({
    title: '`rX` replaces all characters in block with X',
    start: ['1234', '2|345', '3456', '4567'],
    keysPressed: '<C-v>' + 'lj' + 'rX',
    end: ['1234', '2|XX5', '3XX6', '4567'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '`D` deletes from block to end of each line',
    start: ['te|st', 'test'],
    keysPressed: '<C-v>jD',
    end: ['t|e', 'te'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '`C` deletes from block to end of each line, enters multi-cursor Insert mode',
    start: ['t|est', 'test'],
    keysPressed: '<C-v>jC' + 'xyz',
    end: ['txyz|', 'txyz'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle 'gj'",
    start: ['t|est', 'test'],
    keysPressed: '<C-v>gjI123',
    end: ['t123|est', 't123est'],
  });

  suite('`>` (indent at left edge of block)', () => {
    newTest({
      title: 'Repeated multiline `[count]>` indent (2 spaces) top down selection',
      editorOptions: { tabSize: 2 },
      start: ['This is |a long line', 'Short', 'Another long line'],
      keysPressed: '<C-v>jj3>jhh.',
      end: ['This is       a long line', 'Sh|      ort', 'An      other       long line'],
    });
    newTest({
      title: 'Repeated multiline `[count]>` indent (2 spaces) bottom up selection',
      editorOptions: { tabSize: 2 },
      start: ['This is a long line', 'Short', 'Another |long line'],
      keysPressed: '<C-v>kk3>jhh.',
      end: ['This is       a long line', 'Sh|      ort', 'An      other       long line'],
    });
    newTest({
      title: 'Repeated multiline `[count]>` indent (4 spaces) top down selection',
      editorOptions: { tabSize: 4 },
      start: ['This is |a long line', 'Short', 'Another long line'],
      keysPressed: '<C-v>jj3>jhh.',
      end: [
        'This is             a long line',
        'Sh|            ort',
        'An            other             long line',
      ],
    });
    newTest({
      title: 'Repeated multiline `[count]>` indent (4 spaces) bottom up selection',
      editorOptions: { tabSize: 4 },
      start: ['This is a long line', 'Short', 'Another |long line'],
      keysPressed: '<C-v>kk3>jhh.',
      end: [
        'This is             a long line',
        'Sh|            ort',
        'An            other             long line',
      ],
    });
  });

  suite('`<` (outdent at left edge of block)', () => {
    newTest({
      title: '`[count]<` outdent (2 spaces) should have no effect on non-whitespace character',
      editorOptions: { tabSize: 2 },
      start: ['This is |a long line', 'Short', 'Another long line'],
      keysPressed: '<C-v>2<',
      end: ['This is |a long line', 'Short', 'Another long line'],
    });
    newTest({
      title: 'Repeated multiline `[count]<` outdent (2 spaces) top down selection',
      editorOptions: { tabSize: 2 },
      start: ['This is |  a long line', 'Short', 'Another           long line'],
      keysPressed: '<C-v>jj2<jj.',
      end: ['This is a long line', 'Short', 'Another |  long line'],
    });
    newTest({
      title: 'Repeated multiline `[count]<` outdent (2 spaces) bottom up selection',
      editorOptions: { tabSize: 2 },
      start: ['This is   a long line', 'Short', 'Another |          long line'],
      keysPressed: '<C-v>kk2<jj.',
      end: ['This is a long line', 'Short', 'Another |  long line'],
    });
    newTest({
      title: 'Repeated multiline `[count]<` outdent (4 spaces) top down selection',
      editorOptions: { tabSize: 4 },
      start: ['This is |  a long line', 'Short', 'Another           long line'],
      keysPressed: '<C-v>jj2<jj.',
      end: ['This is a long line', 'Short', 'Another |long line'],
    });
    newTest({
      title: 'Repeated multiline `[count]<` outdent (4 spaces) bottom up selection',
      editorOptions: { tabSize: 4 },
      start: ['This is   a long line', 'Short', 'Another |          long line'],
      keysPressed: '<C-v>kk2<jj.',
      end: ['This is a long line', 'Short', 'Another |long line'],
    });
  });

  suite('Non-darwin `<C-c>` tests', () => {
    if (process.platform === 'darwin') {
      return;
    }

    test('`<C-c>` copies and sets mode to normal', async () => {
      await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'Y', 'p', 'p']);

      assertEqualLines(['one two three', 'one two three', 'one two three']);

      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'H', '<C-v>', 'e', 'j', 'j', '<C-c>']);

      // ensuring we're back in normal
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

      // test copy by pasting back
      await modeHandler.handleMultipleKeyEvents(['H', '"', '+', 'P']);

      // TODO: should be
      // assertEqualLines(['oneone two three', 'oneone two three', 'oneone two three']);
      // unfortunately it is
      assertEqualLines(['one', 'one', 'one', 'one two three', 'one two three', 'one two three']);
    });
  });

  newTest({
    title: 'Properly add to end of line (`j` then `$`)',
    start: ['|Dog', 'Angry', 'Dog', 'Angry', 'Dog'],
    keysPressed: '<C-v>4j$Aaa',
    end: ['Dogaa|', 'Angryaa', 'Dogaa', 'Angryaa', 'Dogaa'],
  });

  newTest({
    title: 'Properly add to end of lines (`$` then `j`)',
    start: ['|Dog', 'Angry', 'Dog', 'Angry', 'Dog'],
    keysPressed: '<C-v>' + '$' + '4j' + 'Aaa<Esc>',
    end: ['Doga|a', 'Angryaa', 'Dogaa', 'Angryaa', 'Dogaa'],
  });

  newTest({
    title: '`o` works in VisualBlock mode',
    start: ['|foo', 'bar', 'baz'],
    keysPressed: '<C-v>' + 'jjll' + 'o' + 'l' + 'd',
    end: ['|f', 'b', 'b'],
  });

  // TODO: `O` works in VisualBlock mode

  for (const cmd of ['s', 'd', 'x', 'X']) {
    newTest({
      title: `'${cmd}' deletes block`,
      start: ['11111', '2|2222', '33333', '44444', '55555'],
      keysPressed: `<C-v>jjll${cmd}`,
      end: ['11111', '2|2', '33', '44', '55555'],
      endMode: cmd === 's' ? Mode.Insert : Mode.Normal,
    });
  }

  newTest({
    title: 'Select register using `"` works in VisualBlock mode',
    start: ['abcde', '0|1234', 'abcde', '01234'],
    keysPressed: '<C-v>' + 'llj' + '"ay' + 'Go' + '<C-r>a<Esc>',
    end: ['abcde', '01234', 'abcde', '01234', '123', 'bc|d'],
  });

  newTest({
    title: 'Copy to register using `c` works in Visual Block mode',
    start: ['1|111', '2222', ''],
    keysPressed: '<C-v>' + 'lj' + 'c<Esc>' + 'jjp',
    end: ['11', '22', '|11', '22'],
  });

  newTest({
    title: 'Copy to register using `s` works in Visual Block mode',
    start: ['11|11', '2222', ''],
    keysPressed: '<C-v>' + 'hj' + 's<Esc>' + 'jjp',
    end: ['11', '22', '|11', '22'],
  });

  newTest({
    title: 'Copy to register using `D` works in Visual Block mode',
    start: ['1|111', '22222', ''],
    keysPressed: '<C-v>' + 'lj' + 'D<Esc>' + 'jjp',
    end: ['1', '2', '|111', '2222'],
  });

  suite('`J`', () => {
    newTest({
      title: "Can handle 'J' when the entire visual block is on the same line",
      start: ['one', '|two', 'three', 'four'],
      keysPressed: '<C-v>lJ',
      end: ['one', 'two| three', 'four'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'J' when the visual block spans multiple lines",
      start: ['o|ne', 'two', 'three', 'four'],
      keysPressed: '<C-v>jjlJ',
      end: ['one two| three', 'four'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'J' when start position of the visual block is below the stop",
      start: ['one', 'two', 't|hree', 'four'],
      keysPressed: '<C-v>kkJ',
      end: ['one two| three', 'four'],
      endMode: Mode.Normal,
    });
  });

  suite('`gJ`', () => {
    newTest({
      title: "Can handle 'gJ' when the entire visual block is on the same line",
      start: ['one', '|two', 'three', 'four'],
      keysPressed: '<C-v>lgJ',
      end: ['one', 'two|three', 'four'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'gJ' when the visual block spans multiple lines",
      start: ['o|ne', 'two', 'three', 'four'],
      keysPressed: '<C-v>jjlgJ',
      end: ['onetwo|three', 'four'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'gJ' when the visual block spans multiple lines and line has whitespaces",
      start: ['o|ne  ', 'two', '  three', 'four'],
      keysPressed: '<C-v>jjlgJ',
      end: ['one  two|  three', 'four'],
      endMode: Mode.Normal,
    });

    newTest({
      title: "Can handle 'gJ' when start position of the visual block is below the stop",
      start: ['one', 'two', 't|hree', 'four'],
      keysPressed: '<C-v>kkgJ',
      end: ['onetwo|three', 'four'],
      endMode: Mode.Normal,
    });
  });

  newTest({
    title: 'Can handle `~` and `g~` in VisualBlock mode',
    start: ['|OnE', 'tWo', 'ThReE', 'fOuR'],
    keysPressed: '<C-v>' + 'jl' + '~' + 'jjl' + '<C-v>' + 'jl' + 'g~',
    end: ['oNE', 'Two', 'T|HreE', 'foUR'],
  });

  suite('`R` and `S`', () => {
    for (const command of ['R', 'S']) {
      newTest({
        title: `'${command}' deletes selected lines and puts you into insert mode`,
        start: ['AAAAA', 'BB|BBB', 'CCCCC', 'DDDDD', 'EEEEE'],
        keysPressed: `<C-v>jjh${command}`,
        end: ['AAAAA', '|', 'EEEEE'],
        endMode: Mode.Insert,
      });

      newTest({
        title: `'${command}' deletes selected lines and puts you into insert mode (backward selection)`,
        start: ['AAAAA', 'BBBBB', 'CCCCC', 'DD|DDD', 'EEEEE'],
        keysPressed: `<C-v>kkl${command}`,
        end: ['AAAAA', '|', 'EEEEE'],
        endMode: Mode.Insert,
      });
    }
  });
});
