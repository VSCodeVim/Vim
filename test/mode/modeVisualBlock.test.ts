import * as vscode from 'vscode';
import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';
import { assertEqualLines, cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Visual Block', () => {
  let modeHandler: ModeHandler;

  const { newTest, newTestOnly, newTestSkip } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('can be activated', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleKeyEvent('<C-v>');
    assert.strictEqual(modeHandler.currentMode, Mode.VisualBlock);

    await modeHandler.handleKeyEvent('<C-v>');
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
  });

  newTest({
    title: 'Can handle A forward select',
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljA123',
    end: ['tes123|t', 'tes123t'],
  });

  newTest({
    title: 'Can handle A backwards select',
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjA123',
    end: ['tes123|t', 'tes123t'],
  });

  newTest({
    title: '`A` over shorter line adds necessary spaces',
    start: ['te|st', 'te', 't'],
    keysPressed: '<C-v>jjA123',
    end: ['tes123|t', 'te 123', 't  123'],
  });

  newTest({
    title: 'Can handle I forward select',
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljI123',
    end: ['t123|est', 't123est'],
  });

  newTest({
    title: 'Can handle I backwards select',
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjI123',
    end: ['t123|est', 't123est'],
  });

  newTest({
    title: 'Can handle I with empty lines on first character (inserts on empty line)',
    start: ['|test', '', 'test'],
    keysPressed: '<C-v>lljjI123',
    end: ['123|test', '123', '123test'],
  });

  newTest({
    title: 'Can handle I with empty lines on non-first character (does not insert on empty line)',
    start: ['t|est', '', 'test'],
    keysPressed: '<C-v>lljjI123',
    end: ['t123|est', '', 't123est'],
  });

  newTest({
    title: 'Can handle c forward select',
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljc123',
    end: ['t123|t', 't123t'],
  });

  newTest({
    title: 'Can handle c backwards select',
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjc123',
    end: ['t123|t', 't123t'],
  });

  newTest({
    title: 'Can handle C',
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjC123',
    end: ['t123|', 't123'],
  });

  newTest({
    title: 'Can do a multi line replace',
    start: ['one |two three four five', 'one two three four five'],
    keysPressed: '<C-v>jeer1',
    end: ['one |111111111 four five', 'one 111111111 four five'],
    endMode: Mode.Normal,
  });

  newTest({
    title: "Can handle 'D'",
    start: ['tes|t', 'test'],
    keysPressed: '<C-v>hjD',
    end: ['t|e', 'te'],
  });

  newTest({
    title: "Can handle 'gj'",
    start: ['t|est', 'test'],
    keysPressed: '<C-v>gjI123',
    end: ['t123|est', 't123est'],
  });

  suite('Non-darwin <C-c> tests', () => {
    if (process.platform === 'darwin') {
      return;
    }

    test('<C-c> copies and sets mode to normal', async () => {
      await modeHandler.handleMultipleKeyEvents('ione two three'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'Y', 'p', 'p']);

      assertEqualLines(['one two three', 'one two three', 'one two three']);

      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'H', '<C-v>', 'e', 'j', 'j', '<C-c>']);

      // ensuring we're back in normal
      assert.strictEqual(modeHandler.currentMode, Mode.Normal);

      // test copy by pasting back
      await modeHandler.handleMultipleKeyEvents(['H', '"', '+', 'P']);

      // TODO: should be
      // assertEqualLines(['oneone two three', 'oneone two three', 'oneone two three']);
      // unfortunately it is
      assertEqualLines(['one', 'one', 'one', 'one two three', 'one two three', 'one two three']);
    });
  });

  newTest({
    title: 'Properly add to end of lines j then $',
    start: ['|Dog', 'Angry', 'Dog', 'Angry', 'Dog'],
    keysPressed: '<C-v>4j$Aaa',
    end: ['Dogaa|', 'Angryaa', 'Dogaa', 'Angryaa', 'Dogaa'],
  });

  newTest({
    title: 'Properly add to end of lines $ then j',
    start: ['|Dog', 'Angry', 'Dog', 'Angry', 'Dog'],
    keysPressed: '<C-v>$4jAaa<Esc>',
    end: ['Doga|a', 'Angryaa', 'Dogaa', 'Angryaa', 'Dogaa'],
  });

  newTest({
    title: 'o works in visual block mode',
    start: ['|foo', 'bar', 'baz'],
    keysPressed: '<C-v>jjllold',
    end: ['|f', 'b', 'b'],
  });

  newTest({
    title: 'd deletes block',
    start: ['11111', '2|2222', '33333', '44444', '55555'],
    keysPressed: '<C-v>jjlld',
    end: ['11111', '2|2', '33', '44', '55555'],
  });

  newTest({
    title: 'x deletes block',
    start: ['11111', '2|2222', '33333', '44444', '55555'],
    keysPressed: '<C-v>jjllx',
    end: ['11111', '2|2', '33', '44', '55555'],
  });

  newTest({
    title: 'X deletes block',
    start: ['11111', '2|2222', '33333', '44444', '55555'],
    keysPressed: '<C-v>jjllX',
    end: ['11111', '2|2', '33', '44', '55555'],
  });

  newTest({
    title: 'Select register using " works in visual block mode',
    start: ['abcde', '0|1234', 'abcde', '01234'],
    keysPressed: '<C-v>llj"ayGo<C-r>a<Esc>',
    end: ['abcde', '01234', 'abcde', '01234', '123', 'bcd', '|'],
  });

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

  newTest({
    title: 'Can handle ~/g~ in visual block mode',
    start: ['|OnE', 'tWo', 'ThReE', 'fOuR'],
    keysPressed: '<C-v>jl~jjl<C-v>jlg~',
    end: ['oNE', 'Two', 'T|HreE', 'foUR'],
  });

  suite('R and S', () => {
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
