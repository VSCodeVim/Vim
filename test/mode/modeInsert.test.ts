import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { TextEditor } from '../../src/textEditor';
import {
  assertEqualLines,
  cleanUpWorkspace,
  setupWorkspace,
  reloadConfiguration,
} from './../testUtils';
import { Globals } from '../../src/globals';
import { newTest } from '../testSimplifier';

suite('Mode Insert', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test('can be activated', async () => {
    const activationKeys = ['o', 'I', 'i', 'O', 'a', 'A', '<Insert>'];

    for (const key of activationKeys) {
      await modeHandler.handleKeyEvent('<Esc>');
      assert.strictEqual(modeHandler.currentMode, Mode.Normal);

      await modeHandler.handleKeyEvent(key);
      assert.strictEqual(modeHandler.currentMode, Mode.Insert);
    }
  });

  test('can handle key events', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', '!']);

    return assertEqualLines(['!']);
  });

  test('<Esc> should change cursor position', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'h', 'e', 'l', 'l', 'o', '<Esc>']);

    assert.strictEqual(
      vscode.window.activeTextEditor!.selection.start.character,
      4,
      '<Esc> moved cursor position.'
    );
  });

  test('<C-c> can exit insert', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't', '<C-c>', 'o']);

    return assertEqualLines(['text', '']);
  });

  test('<Esc> can exit insert', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't', '<Esc>', 'o']);

    return assertEqualLines(['text', '']);
  });

  test('Stay in insert when entering characters', async () => {
    await modeHandler.handleKeyEvent('i');
    for (let i = 0; i < 10; i++) {
      await modeHandler.handleKeyEvent('1');
      assert.strictEqual(modeHandler.currentMode === Mode.Insert, true);
    }
  });

  test("Can handle 'O'", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't', '<Esc>', 'O']);

    return assertEqualLines(['', 'text']);
  });

  newTest({
    title: "'i' puts you in insert mode before the cursor",
    start: ['text|text'],
    keysPressed: 'i!',
    end: ['text!|text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'I' puts you in insert mode at start of line",
    start: ['text|text'],
    keysPressed: 'I!',
    end: ['!|texttext'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'a' puts you in insert mode after the cursor",
    start: ['text|text'],
    keysPressed: 'a!',
    end: ['textt!|ext'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'A' appends to end of line",
    start: ['t|ext'],
    keysPressed: 'A!',
    end: ['text!|'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "'<C-w>' deletes a word",
    start: ['text text| text'],
    keysPressed: 'i<C-w>',
    end: ['text | text'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Can handle <C-w> on leading whitespace',
    start: ['foo', '  |bar'],
    keysPressed: 'i<C-w>',
    end: ['foo', '|bar'],
  });

  newTest({
    title: 'Can handle <C-w> at beginning of line',
    start: ['foo', '|bar'],
    keysPressed: 'i<C-w>',
    end: ['foo|bar'],
  });

  newTest({
    title: '<C-u> deletes to start of line',
    start: ['text |text'],
    keysPressed: 'i<C-u>',
    end: ['|text'],
  });

  newTest({
    title: 'Can handle <C-u> on leading characters',
    start: ['{', '  foo: |true', '}'],
    keysPressed: 'i<C-u>',
    end: ['{', '  |true', '}'],
  });

  newTest({
    title: 'Can handle <C-u> on leading whitespace',
    start: ['{', '  |true', '}'],
    keysPressed: 'i<C-u>',
    end: ['{', '|true', '}'],
  });

  test('Correctly places the cursor after deleting the previous line break', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'o',
      'n',
      'e',
      '\n',
      't',
      'w',
      'o',
      '<left>',
      '<left>',
      '<left>',
      '<BS>',
    ]);

    assertEqualLines(['onetwo']);

    assert.strictEqual(
      vscode.window.activeTextEditor!.selection.start.character,
      3,
      '<BS> moved cursor to correct position'
    );
  });

  test('will not remove leading spaces input by user', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', ' ', ' ', '<Esc>']);

    assertEqualLines(['  ']);
  });

  test('will remove closing bracket', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', '(', '<Esc>']);

    assertEqualLines(['()']);

    await modeHandler.handleMultipleKeyEvents(['a', '<BS>', '<Esc>']);

    assertEqualLines(['']);
  });

  newTest({
    title: 'Backspace works on whitespace only lines',
    start: ['abcd', '     |    '],
    keysPressed: 'a<BS><Esc>',
    end: ['abcd', '   | '],
  });

  newTest({
    title: 'Backspace works on end of whitespace only lines',
    start: ['abcd', '     | '],
    keysPressed: 'a<BS><Esc>',
    end: ['abcd', '   | '],
  });

  newTest({
    title: 'Backspace works at beginning of file',
    start: ['|bcd'],
    keysPressed: 'i<BS>a<Esc>',
    end: ['|abcd'],
  });

  newTest({
    title: 'Delete works in insert mode',
    start: ['leather ma|an'],
    keysPressed: 'i<Del><Esc>',
    end: ['leather m|an'],
  });

  newTest({
    title: 'Delete works at line end',
    start: ['boy next| ', 'door'],
    keysPressed: 'a<Del><Esc>',
    end: ['boy next| door'],
  });

  newTest({
    title: 'Delete works at end of file',
    start: ['yes si|r'],
    keysPressed: 'a<Del><Esc>',
    end: ['yes si|r'],
  });

  newTest({
    title: 'Delete works with repeat',
    start: ['This is| not good'],
    keysPressed: 'a<Del><Del><Del><Del><Esc>.aawesome!<Esc>',
    end: ['This is awesome|!'],
  });

  newTest({
    title: 'Repeat insert by count times with dot',
    start: ['give me an a|:'],
    keysPressed: 'aa<Esc>4.',
    end: ['give me an a:aaaa|a'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can <Esc> after entering insert mode from <ctrl+o>',
    start: ['|'],
    keysPressed: 'i<C-o>i<Esc>',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can perform <ctrl+o> to exit and perform one command in normal',
    start: ['testtest|'],
    keysPressed: 'a123<C-o>b123',
    end: ['123|testtest123'],
  });

  newTest({
    title: 'Can <ctrl-o> after entering insert mode from <ctrl-o>',
    start: ['|'],
    keysPressed: 'i<C-o>i<C-o>',
    end: ['|'],
    endMode: Mode.Normal,
  });

  newTest({
    title:
      'Can perform <ctrl+o> to exit and perform one command in normal at the beginning of a row',
    start: ['|testtest'],
    keysPressed: 'i<C-o>l123',
    end: ['t123|esttest'],
  });

  newTest({
    title: 'Can perform insert command prefixed with count',
    start: ['tes|t'],
    keysPressed: '2i_<Esc>',
    end: ['tes_|_t'],
  });

  newTest({
    title: 'Can perform append command prefixed with count',
    start: ['tes|t'],
    keysPressed: '3a=<Esc>',
    end: ['test==|='],
  });

  newTest({
    title: 'Can perform insert at start of line command prefixed with count',
    start: ['tes|t'],
    keysPressed: '2I_<Esc>',
    end: ['_|_test'],
  });

  newTest({
    title: 'Can perform append to end of line command prefixed with count',
    start: ['t|est'],
    keysPressed: '3A=<Esc>',
    end: ['test==|='],
  });

  newTest({
    title: 'Can perform change char (s) command prefixed with count',
    start: ['tes|ttest'],
    keysPressed: '3s=====<Esc>',
    end: ['tes====|=st'],
  });

  newTest({
    title: 'Can perform command prefixed with count with <C-[>',
    start: ['|'],
    keysPressed: '3i*<C-[>',
    end: ['**|*'],
  });

  newTest({
    title: "Can handle 'o' with count",
    start: ['|foobar'],
    keysPressed: '5ofun<Esc>',
    end: ['foobar', 'fu|n', 'fun', 'fun', 'fun', 'fun'],
  });

  newTest({
    title: "Can handle 'O' with count",
    start: ['|foobar'],
    keysPressed: '5Ofun<Esc>',
    end: ['fun', 'fun', 'fun', 'fun', 'fu|n', 'foobar'],
  });

  // This corner case caused an issue, see #3915
  newTest({
    title: 'Can handle backspace at beginning of line with all spaces',
    start: ['abc', '|     '],
    keysPressed: 'i<BS><Esc>',
    end: ['ab|c     '],
  });

  test('Can handle digraph insert', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      't',
      'e',
      'x',
      't',
      '<C-k>',
      '-',
      '>',
      't',
      'e',
      'x',
      't',
      '<C-k>',
      '>',
      '-',
    ]);
    assertEqualLines(['text→text→']);
  });

  test('Can handle custom digraph insert', async () => {
    Globals.mockConfiguration.digraphs = {
      'R!': ['🚀', [55357, 56960]],
    };
    await reloadConfiguration();
    await modeHandler.handleMultipleKeyEvents(['i', '<C-k>', 'R', '!', '<C-k>', '!', 'R']);
    assertEqualLines(['🚀🚀']);
  });

  newTest({
    title: 'Can insert last inserted text',
    start: ['test|'],
    keysPressed: 'ahello<Esc>a<C-a>',
    end: ['testhellohello|'],
  });

  test('Can handle no inserted text yet when executing <ctrl-a>', async () => {
    try {
      await modeHandler.handleMultipleKeyEvents(['i', '<C-a>']);
    } catch (e) {
      assert(false);
    }
  });

  newTest({
    title: "Can handle '<C-r>' paste register",
    start: ['foo |bar'],
    keysPressed: 'yei<C-r>"',
    end: ['foo bar|bar'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle '<C-r>' paste register with mupltiple cursor",
    start: ['foo |bar', 'foo bar'],
    // create two cursors on bar, yank. Then paste it in insert mode
    keysPressed: 'gbgby' + 'i<C-r>"',
    end: ['foo bar|bar', 'foo barbar'],
    endMode: Mode.Insert,
  });
});
