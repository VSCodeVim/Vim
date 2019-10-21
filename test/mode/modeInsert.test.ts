import { getAndUpdateModeHandler } from '../../extension';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { TextEditor } from '../../src/textEditor';
import { getTestingFunctions } from '../testSimplifier';
import {
  assertEqual,
  assertEqualLines,
  cleanUpWorkspace,
  setupWorkspace,
  reloadConfiguration,
} from './../testUtils';
import { Globals } from '../../src/globals';

suite('Mode Insert', () => {
  let modeHandler: ModeHandler;

  const { newTest, newTestOnly, newTestSkip } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('can be activated', async () => {
    const activationKeys = ['o', 'I', 'i', 'O', 'a', 'A', '<Insert>'];

    for (const key of activationKeys) {
      await modeHandler.handleKeyEvent('<Esc>');
      assertEqual(modeHandler.currentMode.name, ModeName.Normal);

      await modeHandler.handleKeyEvent(key);
      assertEqual(modeHandler.currentMode.name, ModeName.Insert);
    }
  });

  test('can handle key events', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', '!']);

    return assertEqualLines(['!']);
  });

  test('<Esc> should change cursor position', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'h', 'e', 'l', 'l', 'o', '<Esc>']);

    assertEqual(TextEditor.getSelection().start.character, 4, '<Esc> moved cursor position.');
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
      assertEqual(modeHandler.currentMode.name === ModeName.Insert, true);
    }
  });

  test("Can handle 'O'", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't', '<Esc>', 'O']);

    return assertEqualLines(['', 'text']);
  });

  test("Can handle 'i'", async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      't',
      'e',
      'x',
      't',
      't',
      'e',
      'x',
      't', // insert 'texttext'
      '<Esc>',
      '^',
      'l',
      'l',
      'l',
      'l', // move to the 4th character
      'i',
      '!', // insert a !
    ]);

    assertEqualLines(['text!text']);
  });

  test("Can handle 'I'", async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      't',
      'e',
      'x',
      't',
      '<Esc>',
      '^',
      'l',
      'l',
      'l',
      'I',
      '!',
    ]);

    assertEqualLines(['!text']);
  });

  test("Can handle 'a'", async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      't',
      'e',
      'x',
      't',
      't',
      'e',
      'x',
      't', // insert 'texttext'
      '<Esc>',
      '^',
      'l',
      'l',
      'l',
      'l', // move to the 4th character
      'a',
      '!', // append a !
    ]);

    assertEqualLines(['textt!ext']);
  });

  test("Can handle 'A'", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't', '<Esc>', '^', 'A', '!']);

    assertEqualLines(['text!']);
  });

  test("Can handle '<C-w>'", async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      't',
      'e',
      'x',
      't',
      ' ',
      't',
      'e',
      'x',
      't',
      '<C-w>',
    ]);

    assertEqualLines(['text ']);
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
    title: 'Can handle <C-u>',
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

    assertEqual(
      TextEditor.getSelection().start.character,
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
    title: 'Can perform <ctrl+o> to exit and perform one command in normal',
    start: ['testtest|'],
    keysPressed: 'a123<C-o>b123',
    end: ['123|testtest123'],
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
});
