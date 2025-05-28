import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { EasyMotion } from '../../src/actions/plugins/easymotion/easymotion';
import { ModeHandler } from '../../src/mode/modeHandler';
import { Register } from '../../src/register/register';
import { RecordedState } from '../../src/state/recordedState';
import { VimState } from '../../src/state/vimState';
import { Clipboard } from '../../src/util/clipboard';
import { newTest } from '../testSimplifier';
import { assertEqualLines, setupWorkspace } from '../testUtils';

suite('register', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suite('clipboard', () => {
    setup(async () => {
      await Clipboard.Copy('12345');
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
    await Clipboard.Copy(testString);
    assert.strictEqual(testString, await Clipboard.Paste());

    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    // Paste from our paste handler
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '"', '*', 'P', 'a']);
    assertEqualLines([testString]);

    // Now try the built in vscode paste
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

    // TODO: Not sure why this sleep should be necessary
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    assertEqualLines([testString + testString]);
  });

  newTest({
    title: "Yank stores text in Register '0'",
    start: ['|test1', 'test2', 'test3'],
    keysPressed: 'yy' + 'j' + 'yy' + 'gg' + 'dd' + '"0P',
    end: ['|test2', 'test2', 'test3'],
  });

  newTest({
    title: "Multiline yank (`[count]yy`) stores text in Register '0'",
    start: ['|test1', 'test2', 'test3'],
    keysPressed: '2yy' + 'dd' + '"0P',
    end: ['|test1', 'test2', 'test2', 'test3'],
  });

  newTest({
    title: "Multiline yank (`[count]Y`) stores text in Register '0'",
    start: ['|test1', 'test2', 'test3'],
    keysPressed: '2Y' + 'dd' + '"0P',
    end: ['|test1', 'test2', 'test2', 'test3'],
  });

  newTest({
    title: "Register '1'-'9' stores delete content",
    start: ['|test1', 'test2', 'test3', ''],
    keysPressed: 'dd' + 'dd' + 'dd' + '"1p' + '"2p' + '"3p',
    end: ['', 'test3', 'test2', '|test1'],
  });

  newTest({
    title: '"A appends linewise text to "a',
    start: ['|test1', 'test2', 'test3'],
    keysPressed: 'vll' + '"ay' + 'jV' + '"Ay' + 'j"ap',
    end: ['test1', 'test2', 'test3', '|tes', 'test2'],
  });

  newTest({
    title: '"A appends character wise text to "a',
    start: ['|test1', 'test2', ''],
    keysPressed: 've' + '"ay' + 'jve' + '"Ay' + 'j"ap',
    end: ['test1', 'test2', 'test1test|2'],
  });

  test('Can put and get to register', async () => {
    const expected = 'text-to-put-on-register';
    const vimState = new VimState(vscode.window.activeTextEditor!, new EasyMotion());
    await vimState.load();
    vimState.recordedState.registerName = '0';

    try {
      Register.put(vimState, expected);
      const actual = await Register.get(vimState.recordedState.registerName);
      assert.strictEqual(actual?.text, expected);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      assert.fail(err);
    }
  });

  newTest({
    title: 'Small deletion using x is stored in small delete register',
    start: ['|test1', 'test2', 'test3'],
    keysPressed: '2x' + 'j' + '"-p',
    end: ['st1', 'tt|eest2', 'test3'],
  });

  newTest({
    title: 'Small deletion using Del is stored in small delete register',
    start: ['|test1', 'test2', 'test3'],
    keysPressed: '<Del>' + 'j' + '"-p',
    end: ['est1', 't|test2', 'test3'],
  });

  newTest({
    title: 'Small deletion using X is stored in small delete register',
    start: ['te|st1', 'test2', 'test3'],
    keysPressed: '2X' + 'j' + '"-p',
    end: ['st1', 'tt|eest2', 'test3'],
  });

  test('Search register (/) is set by forward search', async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iWake up early in Karakatu, Alaska'.split('').concat(['<Esc>', '0']),
    );

    // Register changed by forward search
    await modeHandler.handleMultipleKeyEvents('/katu\n'.split(''));
    assert.strictEqual((await Register.get('/'))?.text, 'katu');

    // Register changed even if search doesn't exist
    await modeHandler.handleMultipleKeyEvents('0/notthere\n'.split(''));
    assert.strictEqual((await Register.get('/'))?.text, 'notthere');

    // Not changed if search is canceled
    await modeHandler.handleMultipleKeyEvents('0/Alaska'.split('').concat(['<Esc>']));
    assert.strictEqual((await Register.get('/'))?.text, 'notthere');
  });

  test('Search register (/) is set by backward search', async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iWake up early in Karakatu, Alaska'.split('').concat(['<Esc>', '$']),
    );

    // Register changed by forward search
    await modeHandler.handleMultipleKeyEvents('?katu\n'.split(''));
    assert.strictEqual((await Register.get('/'))?.text, 'katu');

    // Register changed even if search doesn't exist
    await modeHandler.handleMultipleKeyEvents('$?notthere\n'.split(''));
    assert.strictEqual((await Register.get('/'))?.text, 'notthere');

    // Not changed if search is canceled
    await modeHandler.handleMultipleKeyEvents('$?Alaska'.split('').concat(['<Esc>']));
    assert.strictEqual((await Register.get('/'))?.text, 'notthere');
  });

  test('Search register (/) is set by star search', async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iWake up early in Karakatu, Alaska'.split('').concat(['<Esc>', '0']),
    );

    await modeHandler.handleKeyEvent('*');
    assert.strictEqual((await Register.get('/'))?.text, '\\<Wake\\>');

    await modeHandler.handleMultipleKeyEvents(['g', '*']);
    assert.strictEqual((await Register.get('/'))?.text, 'Wake');

    await modeHandler.handleKeyEvent('#');
    assert.strictEqual((await Register.get('/'))?.text, '\\<Wake\\>');

    await modeHandler.handleMultipleKeyEvents(['g', '#']);
    assert.strictEqual((await Register.get('/'))?.text, 'Wake');
  });

  test('Command register (:) is set by command line', async () => {
    const command = '%s/old/new/g';
    await modeHandler.handleMultipleKeyEvents((':' + command + '\n').split(''));

    // :reg should not update the command register
    await modeHandler.handleMultipleKeyEvents(':reg\n'.split(''));

    const regStr = ((await Register.get(':'))?.text as RecordedState).commandString;
    assert.strictEqual(regStr, command);
  });

  test('Read-only registers cannot be written to', async () => {
    await modeHandler.handleMultipleKeyEvents('iShould not be copied'.split('').concat(['<Esc>']));

    Register.setReadonlyRegister('/', 'Expected for /');
    Register.setReadonlyRegister('.', 'Expected for .');
    Register.setReadonlyRegister('%', 'Expected for %');
    Register.setReadonlyRegister(':', 'Expected for :');

    await modeHandler.handleMultipleKeyEvents('"/yy'.split(''));
    await modeHandler.handleMultipleKeyEvents('".yy'.split(''));
    await modeHandler.handleMultipleKeyEvents('"%yy'.split(''));
    await modeHandler.handleMultipleKeyEvents('":yy'.split(''));

    assert.strictEqual((await Register.get('/'))?.text, 'Expected for /');
    assert.strictEqual((await Register.get('.'))?.text, 'Expected for .');
    assert.strictEqual((await Register.get('%'))?.text, 'Expected for %');
    assert.strictEqual((await Register.get(':'))?.text, 'Expected for :');
  });
});
