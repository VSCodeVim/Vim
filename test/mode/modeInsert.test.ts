import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace, reloadConfiguration } from './../testUtils';
import { Globals } from '../../src/globals';
import { newTest } from '../testSimplifier';

suite('Mode Insert', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test('can be activated', async () => {
    const activationKeys = ['o', 'I', 'i', 'O', 'a', 'A', '<Insert>'];

    for (const key of activationKeys) {
      await modeHandler.handleKeyEvent('<Esc>');
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

      await modeHandler.handleKeyEvent(key);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
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
      '<Esc> moved cursor position.',
    );
  });

  test('<C-c> can exit insert', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't', '<C-c>', 'o']);

    return assertEqualLines(['text', '']);
  });

  test('<copy> should not override system-clipboard after exiting insert mode', async () => {
    const yankTextAtSystemClipboard = ['i', 't', 'e', 'x', 't', '<Esc>', 'v', 'i', 'w', '<copy>'];

    const pasteTextAtInsertMode = ['a', '<C-r>', '+', '<copy>'];

    await modeHandler.handleMultipleKeyEvents([
      ...yankTextAtSystemClipboard,
      ...pasteTextAtInsertMode,
      '$',
      ...pasteTextAtInsertMode,
    ]);

    return assertEqualLines(['texttexttext']);
  });

  test('<Esc> can exit insert', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't', '<Esc>', 'o']);

    return assertEqualLines(['text', '']);
  });

  test('Stay in insert when entering characters', async () => {
    await modeHandler.handleKeyEvent('i');
    for (let i = 0; i < 10; i++) {
      await modeHandler.handleKeyEvent('1');
      assert.strictEqual(modeHandler.vimState.currentMode === Mode.Insert, true);
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

  suite('<C-w>', () => {
    newTest({
      title: '`<C-w>` deletes a word',
      start: ['text text| text'],
      keysPressed: 'i<C-w>',
      end: ['text | text'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`<C-w>` in whitespace deletes whitespace and prior word',
      start: ['one two     | three'],
      keysPressed: 'i<C-w>',
      end: ['one | three'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`<C-w>` on leading whitespace deletes to start of line',
      start: ['foo', '  |bar'],
      keysPressed: 'i<C-w>',
      end: ['foo', '|bar'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`<C-w>` at beginning of line deletes line break',
      start: ['foo', '|bar'],
      keysPressed: 'i<C-w>',
      end: ['foo|bar'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`<C-w>` at beginning of document does nothing',
      start: ['|foo', 'bar'],
      keysPressed: 'i<C-w>',
      end: ['|foo', 'bar'],
      endMode: Mode.Insert,
    });
  });

  suite('<C-u>', () => {
    newTest({
      title: '<C-u> deletes to start of line',
      start: ['text |text'],
      keysPressed: 'i<C-u>',
      end: ['|text'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Can handle <C-u> on leading characters',
      start: ['{', '  foo: |true', '}'],
      keysPressed: 'i<C-u>',
      end: ['{', '  |true', '}'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Can handle <C-u> on leading whitespace',
      start: ['{', '  |true', '}'],
      keysPressed: 'i<C-u>',
      end: ['{', '|true', '}'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-u> at start of line deletes line break',
      start: ['one', '|two', 'three'],
      keysPressed: 'i<C-u>',
      end: ['one|two', 'three'],
      endMode: Mode.Insert,
    });
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
      '<BS> moved cursor to correct position',
    );
  });

  test('will not remove leading spaces input by user', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', ' ', ' ', '<Esc>']);

    assertEqualLines(['  ']);
  });

  test('<BS> removes closing bracket just inserted', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', '(']);

    assertEqualLines(['()']);

    await modeHandler.handleMultipleKeyEvents(['<BS>', '<Esc>']);

    assertEqualLines(['']);
  });

  test('<BS> does not remove closing bracket inserted before', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', '(', '<Esc>']);

    assertEqualLines(['()']);

    await modeHandler.handleMultipleKeyEvents(['a', '<BS>', '<Esc>']);

    assertEqualLines([')']);
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
    title: 'Backspace in leading whitespace 1',
    start: ['        |    xyz'],
    editorOptions: {
      tabSize: 4,
    },
    keysPressed: 'i<BS>',
    end: ['    |    xyz'],
    endMode: Mode.Insert,
  });

  newTest({
    title: 'Backspace in leading whitespace 2',
    start: ['       |    xyz'],
    editorOptions: {
      tabSize: 4,
    },
    keysPressed: 'i<BS>',
    end: ['    |    xyz'],
    endMode: Mode.Insert,
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
    title:
      'Can perform <Esc> to exit and move cursor back one character from the most right position',
    start: ['|testtest'],
    keysPressed: 'A<Esc>',
    end: ['testtes|t'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can perform <Esc> to exit and move cursor back one character from middle of text',
    start: ['test|test'],
    keysPressed: 'i<Esc>',
    end: ['tes|ttest'],
    endMode: Mode.Normal,
  });

  suite('<C-o>', () => {
    newTest({
      title: 'Can <Esc> after entering insert mode from <ctrl+o>',
      start: ['|'],
      keysPressed: 'i<C-o>i<Esc>',
      end: ['|'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'Can perform <ctrl-o> after entering insert mode from <ctrl-o>',
      start: ['test|test'],
      keysPressed: 'i<C-o>i<C-o>',
      end: ['test|test'],
      endMode: Mode.Normal,
    });

    newTest({
      title:
        'Can perform <ctrl-o> to exit and perform one command in normal at the beginning of a line',
      start: ['|testtest'],
      keysPressed: 'i<C-o>l123',
      end: ['t123|esttest'],
      endMode: Mode.Insert,
    });

    newTest({
      title:
        'Can perform <ctrl-o> to exit and perform one command in normal at the middle of a row',
      start: ['test|test'],
      keysPressed: 'i<C-o>l123',
      end: ['testt123|est'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Can perform <ctrl-o> to exit and perform one command in normal at the end of a row',
      start: ['testtest|'],
      keysPressed: 'a123<C-o>zz',
      end: ['testtest123|'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Can perform <ctrl-o> to exit and paste',
      start: ['|XXX', '123456'],
      keysPressed: 'ye' + 'j' + 'A<C-o>p',
      end: ['XXX', '123456XXX|'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Can perform <ctrl-o> to exit and paste',
      start: ['|XXX', '123456'],
      keysPressed: 'ye' + 'j2|' + 'i<C-o>p',
      end: ['XXX', '12XXX|3456'],
      endMode: Mode.Insert,
    });
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
    title: 'Can insert custom digraph made with :dig[raphs]`',
    start: ['|'],
    keysPressed: ':dig R! 55357 56960\n' + 'i<C-k>R!',
    end: ['🚀|'],
    endMode: Mode.Insert,
  });

  suite('<C-a>', () => {
    newTest({
      title: 'Basic <C-a> test',
      start: ['tes|t'],
      keysPressed: 'a' + 'hello' + '<Esc>' + 'a' + '<C-a>',
      end: ['testhellohello|'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-a> with <BS>',
      start: ['tes|t'],
      keysPressed: 'i' + '<BS>' + '<Esc>' + 'a' + '<C-a>',
      end: ['t|t'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-a> with <BS> then regular character',
      start: ['tes|t'],
      keysPressed: 'i' + '<BS>1' + '<Esc>' + 'i' + '<C-a>',
      end: ['t1|1t'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-a> with arrows ignores everything before last arrow',
      start: ['one |two three'],
      keysPressed: 'i' + 'X<left>Y<left>Z' + '<Esc>' + 'W' + 'i' + '<C-a>',
      end: ['one ZYXtwo Z|three'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-a> insertion with arrows always inserts just before cursor',
      start: ['o|ne two three'],
      keysPressed: 'A' + 'X<left>Y<left>Z' + '<Esc>' + '0W' + 'i' + '<C-a>',
      end: ['one Z|two threeZYX'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-a> before entering any text',
      start: ['tes|t'],
      keysPressed: 'i' + '<C-a>',
      end: ['tes|t'],
      endMode: Mode.Insert,
      statusBar: 'E29: No inserted text yet',
    });
  });

  suite('<C-y>', () => {
    newTest({
      title: '<C-y> inserts character above cursor',
      start: ['abcde', '12|3', 'ABCDE'],
      keysPressed: 'i' + '<C-y><C-y>',
      end: ['abcde', '12cd|3', 'ABCDE'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-y> does nothing if line below is too short',
      start: ['abcde', '12|3', 'ABCDE'],
      keysPressed: 'i' + '<C-y><C-y><C-y><C-y><C-y><C-y>',
      end: ['abcde', '12cde|3', 'ABCDE'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-y> does nothing on first line',
      start: ['|', 'ABCDE'],
      keysPressed: 'i' + '<C-y><C-y>',
      end: ['|', 'ABCDE'],
      endMode: Mode.Insert,
    });
  });

  suite('<C-e>', () => {
    newTest({
      title: '<C-e> inserts character below cursor',
      start: ['abcde', '12|3', 'ABCDE'],
      keysPressed: 'i' + '<C-e><C-e>',
      end: ['abcde', '12CD|3', 'ABCDE'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-e> does nothing if line below is too short',
      start: ['abcde', '12|3', 'ABCDE'],
      keysPressed: 'i' + '<C-e><C-e><C-e><C-e><C-e><C-e>',
      end: ['abcde', '12CDE|3', 'ABCDE'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-e> does nothing on last line',
      start: ['abcde', '|'],
      keysPressed: 'i' + '<C-e><C-e>',
      end: ['abcde', '|'],
      endMode: Mode.Insert,
    });
  });

  newTest({
    title: "Can handle '<C-r>' paste register",
    start: ['foo |bar'],
    keysPressed: 'yei<C-r>"',
    end: ['foo bar|bar'],
    endMode: Mode.Insert,
  });

  newTest({
    title: "Can handle '<C-r>' paste register with multiple cursors",
    start: ['foo |bar', 'foo bar'],
    // create two cursors on bar, yank. Then paste it in insert mode
    keysPressed: 'gbgby' + 'i<C-r>"',
    end: ['foo bar|bar', 'foo barbar'],
    endMode: Mode.Insert,
  });

  suite('<C-t>', () => {
    newTest({
      title: '<C-t> increases indent (2 spaces)',
      editorOptions: { insertSpaces: true, tabSize: 2 },
      start: ['    x|yz'],
      keysPressed: 'i' + '<C-t>',
      end: ['      x|yz'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-t> increases indent (4 spaces)',
      editorOptions: { insertSpaces: true, tabSize: 4 },
      start: ['    x|yz'],
      keysPressed: 'i' + '<C-t>',
      end: ['        x|yz'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-t> increases indent (tab)',
      editorOptions: { insertSpaces: false },
      start: ['\tx|yz'],
      keysPressed: 'i' + '<C-t>',
      end: ['\t\tx|yz'],
      endMode: Mode.Insert,
    });
  });

  suite('<C-d>', () => {
    newTest({
      title: '<C-d> decreases indent (2 spaces)',
      editorOptions: { insertSpaces: true, tabSize: 2 },
      start: ['        x|yz'],
      keysPressed: 'i' + '<C-d>',
      end: ['      x|yz'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-d> decreases indent (4 spaces)',
      editorOptions: { insertSpaces: true, tabSize: 4 },
      start: ['        x|yz'],
      keysPressed: 'i' + '<C-d>',
      end: ['    x|yz'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '<C-d> decreases indent (tab)',
      editorOptions: { insertSpaces: false },
      start: ['\t\tx|yz'],
      keysPressed: 'i' + '<C-d>',
      end: ['\tx|yz'],
      endMode: Mode.Insert,
    });
  });

  suite('VSCode auto-surround', () => {
    test('preserves selection', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 's', 'e', 'l', 'e', 'c', 't']);
      await vscode.commands.executeCommand('editor.action.selectAll');
      await modeHandler.handleKeyEvent('"');
      assertEqualLines(['"select"']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
      assert.strictEqual(vscode.window.activeTextEditor!.selection.start.character, 1);
      assert.strictEqual(vscode.window.activeTextEditor!.selection.end.character, 7);
    });

    test('replaces selection', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'm', 'p']);
      await vscode.commands.executeCommand('editor.action.selectAll');
      await modeHandler.handleMultipleKeyEvents(['"', 'f', 'i', 'n', 'a', 'l']);
      assertEqualLines(['"final"']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
      assert.strictEqual(vscode.window.activeTextEditor!.selection.start.character, 6);
      assert.strictEqual(vscode.window.activeTextEditor!.selection.end.character, 6);
    });

    test('stacks', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 't', 'e', 'x', 't']);
      await vscode.commands.executeCommand('editor.action.selectAll');

      await modeHandler.handleMultipleKeyEvents(['"', "'", '(', '[', '{', '<', '`']);
      assertEqualLines(['"\'([{<`text`>}])\'"']);
    });

    test('handles snippet', async () => {
      await modeHandler.handleKeyEvent('i');
      await vscode.commands.executeCommand('editor.action.insertSnippet', {
        snippet: '${3:foo} ${1:bar} ${2:baz}',
      });
      await modeHandler.handleMultipleKeyEvents(['(', 'o', 'n', 'e']);
      await vscode.commands.executeCommand('jumpToNextSnippetPlaceholder');
      await modeHandler.handleMultipleKeyEvents(['<', 't', 'w', 'o']);
      await vscode.commands.executeCommand('jumpToNextSnippetPlaceholder');
      await modeHandler.handleKeyEvent('`');
      assertEqualLines(['`foo` (one) <two>']);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    });
  });
});
