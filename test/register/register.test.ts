import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { IRegisterContent, Register } from '../../src/register/register';
import { VimState } from '../../src/state/vimState';
import { Clipboard } from '../../src/util/clipboard';
import { getTestingFunctions } from '../testSimplifier';
import { assertEqual, assertEqualLines, cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('register', () => {
  let modeHandler: ModeHandler;

  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  suite('clipboard', () => {
    setup(async () => {
      Clipboard.Copy('12345');
    });

    newTest({
      title: "Can access '*' (clipboard) register",
      start: ['|one'],
      keysPressed: '"*P',
      end: ['1234|5one'],
    });

    newTest({
      title: "Can access '+' (clipboard) register",
      start: ['|one'],
      keysPressed: '"+P',
      end: ['1234|5one'],
    });
  });

  newTest({
    title: 'Can copy to a register',
    start: ['|one', 'two'],
    keysPressed: '"add"ap',
    end: ['two', '|one'],
  });

  newTest({
    title: 'Can use two registers together',
    start: ['|one', 'two'],
    keysPressed: '"ayyj"byy"ap"bp',
    end: ['one', 'two', 'one', '|two'],
  });

  newTest({
    title: 'Can use black hole register',
    start: ['|asdf', 'qwer'],
    keysPressed: 'yyj"_ddkp',
    end: ['asdf', '|asdf'],
  });

  test('System clipboard works with chinese characters', async () => {
    const testString = '你好';
    Clipboard.Copy(testString);
    assertEqual(testString, await Clipboard.Paste());

    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    // Paste from our paste handler
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '"', '*', 'P', 'a']);
    assertEqualLines([testString]);

    // Now try the built in vscode paste
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

    assertEqualLines([testString + testString]);
  });

  test("Yank stores text in Register '0'", async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g',
      'g',
      'y',
      'y',
      'j',
      'y',
      'y',
      'g',
      'g',
      'd',
      'd',
      '"',
      '0',
      'P',
    ]);

    assertEqualLines(['test2', 'test2', 'test3']);
  });

  test("Multiline yank (`[count]yy`) stores text in Register '0'", async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g',
      'g',
      '2',
      'y',
      'y',
      'd',
      'd',
      '"',
      '0',
      'P',
    ]);

    assertEqualLines(['test1', 'test2', 'test2', 'test3']);
  });

  test("Multiline yank (`[count]Y`) stores text in Register '0'", async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g',
      'g',
      '2',
      'Y',
      'd',
      'd',
      '"',
      '0',
      'P',
    ]);

    assertEqualLines(['test1', 'test2', 'test2', 'test3']);
  });

  test("Register '1'-'9' stores delete content", async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3\n'.split(''));

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g',
      'g',
      'd',
      'd',
      'd',
      'd',
      'd',
      'd',
      '"',
      '1',
      'p',
      '"',
      '2',
      'p',
      '"',
      '3',
      'p',
    ]);

    assertEqualLines(['', 'test3', 'test2', 'test1']);
  });

  test('"A appends linewise text to "a', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g',
      'g',
      'v',
      'l',
      'l',
      '"',
      'a',
      'y',
      'j',
      'V',
      '"',
      'A',
      'y',
      'j',
      '"',
      'a',
      'p',
    ]);

    assertEqualLines(['test1', 'test2', 'test3', 'tes', 'test2']);
  });

  test('"A appends character wise text to "a', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\n'.split(''));

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g',
      'g',
      'v',
      'l',
      'l',
      'l',
      'l',
      '"',
      'a',
      'y',
      'j',
      'v',
      'l',
      'l',
      'l',
      'l',
      '"',
      'A',
      'y',
      'j',
      '"',
      'a',
      'p',
    ]);

    assertEqualLines(['test1', 'test2', 'test1test2']);
  });

  test('Can put and get to register', async () => {
    const expected = 'text-to-put-on-register';
    let vimState = new VimState(vscode.window.activeTextEditor!);
    vimState.recordedState.registerName = '0';
    let actual: IRegisterContent;

    try {
      Register.put(expected, vimState);
      actual = await Register.get(vimState);
      assert.equal(actual.text, expected);
    } catch (err) {
      assert.fail(err);
    }
  });

  test('Small deletion using x is stored in small delete register', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    modeHandler.vimState.registerName = '-';
    Register.put('', modeHandler.vimState);

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', '2', 'x', 'j', '"', '-', 'p']);

    assertEqualLines(['st1', 'tteest2', 'test3']);
  });

  test('Small deletion using Del is stored in small delete register', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    modeHandler.vimState.registerName = '-';
    Register.put('', modeHandler.vimState);

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', '<Del>', 'j', '"', '-', 'p']);

    assertEqualLines(['est1', 'ttest2', 'test3']);
  });

  test('Small deletion using X is stored in small delete register', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    modeHandler.vimState.registerName = '-';
    Register.put('', modeHandler.vimState);

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g',
      'g',
      'l',
      'l',
      '2',
      'X',
      'j',
      '"',
      '-',
      'p',
    ]);

    assertEqualLines(['st1', 'tteest2', 'test3']);
  });
});
