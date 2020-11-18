import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { Register } from '../../src/register/register';
import { VimState } from '../../src/state/vimState';
import { Clipboard } from '../../src/util/clipboard';
import { assertEqualLines, cleanUpWorkspace, setupWorkspace } from '../testUtils';
import { RecordedState } from '../../src/state/recordedState';
import { newTest } from '../testSimplifier';

suite('register', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
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
    assert.strictEqual(testString, await Clipboard.Paste());

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
    const vimState = new VimState(vscode.window.activeTextEditor!);
    await vimState.load();
    vimState.recordedState.registerName = '0';

    try {
      Register.put(expected, vimState);
      const actual = await Register.get(vimState);
      assert.strictEqual(actual?.text, expected);
    } catch (err) {
      assert.fail(err);
    }
  });

  test('Small deletion using x is stored in small delete register', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', '2', 'x', 'j', '"', '-', 'p']);

    assertEqualLines(['st1', 'tteest2', 'test3']);
  });

  test('Small deletion using Del is stored in small delete register', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents('itest1\ntest2\ntest3'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', '<Del>', 'j', '"', '-', 'p']);

    assertEqualLines(['est1', 'ttest2', 'test3']);
  });

  test('Small deletion using X is stored in small delete register', async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

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

  test('Search register (/) is set by forward search', async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iWake up early in Karakatu, Alaska'.split('').concat(['<Esc>', '0'])
    );

    // Register changed by forward search
    await modeHandler.handleMultipleKeyEvents('/katu\n'.split(''));
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'katu');

    // Register changed even if search doesn't exist
    await modeHandler.handleMultipleKeyEvents('0/notthere\n'.split(''));
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'notthere');

    // Not changed if search is canceled
    await modeHandler.handleMultipleKeyEvents('0/Alaska'.split('').concat(['<Esc>']));
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'notthere');
  });

  test('Search register (/) is set by backward search', async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iWake up early in Karakatu, Alaska'.split('').concat(['<Esc>', '$'])
    );

    // Register changed by forward search
    await modeHandler.handleMultipleKeyEvents('?katu\n'.split(''));
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'katu');

    // Register changed even if search doesn't exist
    await modeHandler.handleMultipleKeyEvents('$?notthere\n'.split(''));
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'notthere');

    // Not changed if search is canceled
    await modeHandler.handleMultipleKeyEvents('$?Alaska'.split('').concat(['<Esc>']));
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'notthere');
  });

  test('Search register (/) is set by star search', async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iWake up early in Karakatu, Alaska'.split('').concat(['<Esc>', '0'])
    );

    await modeHandler.handleKeyEvent('*');
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, '\\bWake\\b');

    await modeHandler.handleMultipleKeyEvents(['g', '*']);
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'Wake');

    await modeHandler.handleKeyEvent('#');
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, '\\bWake\\b');

    await modeHandler.handleMultipleKeyEvents(['g', '#']);
    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'Wake');
  });

  test('Command register (:) is set by command line', async () => {
    const command = '%s/old/new/g';
    await modeHandler.handleMultipleKeyEvents((':' + command + '\n').split(''));

    // :reg should not update the command register
    await modeHandler.handleMultipleKeyEvents(':reg\n'.split(''));

    const regStr = ((await Register.get(modeHandler.vimState, ':'))?.text as RecordedState)
      .commandString;
    assert.strictEqual(regStr, command);
  });

  test('Read-only registers cannot be written to', async () => {
    await modeHandler.handleMultipleKeyEvents('iShould not be copied'.split('').concat(['<Esc>']));

    Register.putByKey('Expected for /', '/', undefined, true);
    Register.putByKey('Expected for .', '.', undefined, true);
    Register.putByKey('Expected for %', '%', undefined, true);
    Register.putByKey('Expected for :', ':', undefined, true);

    await modeHandler.handleMultipleKeyEvents('"/yy'.split(''));
    await modeHandler.handleMultipleKeyEvents('".yy'.split(''));
    await modeHandler.handleMultipleKeyEvents('"%yy'.split(''));
    await modeHandler.handleMultipleKeyEvents('":yy'.split(''));

    assert.strictEqual((await Register.get(modeHandler.vimState, '/'))?.text, 'Expected for /');
    assert.strictEqual((await Register.get(modeHandler.vimState, '.'))?.text, 'Expected for .');
    assert.strictEqual((await Register.get(modeHandler.vimState, '%'))?.text, 'Expected for %');
    assert.strictEqual((await Register.get(modeHandler.vimState, ':'))?.text, 'Expected for :');
  });
});
