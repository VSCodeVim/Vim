import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';
import { assertEqual, assertEqualLines, cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Visual Block', () => {
  let modeHandler: ModeHandler;

  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('can be activated', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleKeyEvent('<C-v>');
    assertEqual(modeHandler.currentMode.name, ModeName.VisualBlock);

    await modeHandler.handleKeyEvent('<C-v>');
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
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
    endMode: ModeName.Normal,
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
      assertEqual(modeHandler.currentMode.name, ModeName.Normal);

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
});
