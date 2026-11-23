import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTest } from '../testSimplifier';
import { assertStatusBarEqual, setupWorkspace } from '../testUtils';

suite('cmd_line/search command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  for (const prompt of [':', '/']) {
    const endMode = prompt === ':' ? Mode.CommandlineInProgress : Mode.SearchInProgressMode;
    newTest({
      title: `<C-w> can remove word in ${prompt === ':' ? 'cmd line' : 'search mode'}`,
      start: ['|'],
      steps: [
        {
          title: 'removes "123"',
          keysPressed: `${prompt}abc-123<C-w>`,
          statusBar: `${prompt}abc-|`,
          endMode,
        },
        { title: 'removes "-"', keysPressed: '<C-w>', statusBar: `${prompt}abc|`, endMode },
        { title: 'removes "abc"', keysPressed: '<C-w>', statusBar: `${prompt}|`, endMode },
        { title: 'removes nothing', keysPressed: '<C-w>', statusBar: `${prompt}|`, endMode },
      ],
    });
  }

  test('command <C-w> can remove word in cmd line while retrain cmd on the right of the cursor', async () => {
    await modeHandler.handleMultipleKeyEvents([
      ':',
      'a',
      'b',
      'c',
      ' ',
      '1',
      '2',
      '3',
      '<left>',
      '<left>',
      '<left>',
      '<C-w>',
    ]);
    assertStatusBarEqual(':|123', 'Failed to retain the text on the right of the cursor');
  });

  test('command <C-w> can remove word in search mode while retrain cmd on the right of the cursor', async () => {
    await modeHandler.handleMultipleKeyEvents([
      '/',
      'a',
      'b',
      'c',
      ' ',
      '1',
      '2',
      '3',
      '<left>',
      '<left>',
      '<left>',
      '<C-w>',
    ]);
    assertStatusBarEqual('/|123', 'Failed to retain the text on the right of the cursor');
  });

  test('<C-u> deletes from cursor to first character', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<left>', '<left>', '<C-u>']);
    assertStatusBarEqual(':|yz');
  });

  test('<C-b> puts cursor at start of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleKeyEvent('<C-b>');
    assertStatusBarEqual(':|s/abc/xyz');
  });

  test('<Home> puts cursor at start of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleKeyEvent('<Home>');
    assertStatusBarEqual(':|s/abc/xyz');
  });

  test('<C-e> puts cursor at end of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<C-b>', '<C-e>']);
    assertStatusBarEqual(':s/abc/xyz|');
  });

  test('<End> puts cursor at end of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Home>', '<End>']);
    assertStatusBarEqual(':s/abc/xyz|');
  });

  newTest({
    title: '<C-p>/<C-n> go to the previous/next command',
    start: ['|'],
    steps: [
      {
        // Establish a history - :s/a/b, then :s/x/y. :w is the current one, not yet confirmed
        title: 'goes back to :s/x/y',
        keysPressed: ':s/a/b\n:s/x/y\n:w<C-p>',
        statusBar: ':s/x/y|',
        endMode: Mode.CommandlineInProgress,
      },
      {
        title: 'goes back to :s/a/b',
        keysPressed: '<C-p>',
        statusBar: ':s/a/b|',
        endMode: Mode.CommandlineInProgress,
      },
      {
        title: 'goes forward to :s/x/y',
        keysPressed: '<C-n>',
        statusBar: ':s/x/y|',
        endMode: Mode.CommandlineInProgress,
      },
      {
        title: 'goes forward to the command being typed',
        keysPressed: '<C-n>',
        // TODO: Really, this should be `:w|`. See #4093.
        statusBar: ':|',
        endMode: Mode.CommandlineInProgress,
      },
    ],
  });

  test('<C-r> <C-w> insert word under cursor on command line', async () => {
    await modeHandler.handleMultipleKeyEvents('iabc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', ':', '<C-r>', '<C-w>']);
    assertStatusBarEqual(':abc|', 'Failed to insert word under cursor');
  });

  test('<C-r> <C-w> insert word right of cursor on command line', async () => {
    await modeHandler.handleMultipleKeyEvents('i::abc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '0', ':', '<C-r>', '<C-w>']);
    assertStatusBarEqual(':abc|', 'Failed to insert word to right of cursor');
  });

  test('<C-r> <C-w> insert word under cursor in search mode', async () => {
    await modeHandler.handleMultipleKeyEvents('iabc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '/', '<C-r>', '<C-w>']);
    assertStatusBarEqual('/abc|', 'Failed to insert word under cursor');
  });

  test('<C-p> go to previous search string', async () => {
    await modeHandler.handleMultipleKeyEvents('/abc'.split('').concat('<Esc>'));
    await modeHandler.handleMultipleKeyEvents(['/', '<C-p>']);
    assertStatusBarEqual('/abc|', 'Failed to go to previous search string');
  });

  for (const key of ['<BS>', '<S-BS>', '<C-h>']) {
    test(`${key} removes one character from command line`, async () => {
      await modeHandler.handleMultipleKeyEvents(':abc'.split(''));
      await modeHandler.handleKeyEvent(key);
      assertStatusBarEqual(':ab|');
    });

    test(`${key} with empty command line goes to normal mode`, async () => {
      await modeHandler.handleKeyEvent(':');
      await modeHandler.handleKeyEvent(key);
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    });

    test(`${key} at start of non-empty command does nothing`, async () => {
      await modeHandler.handleMultipleKeyEvents(':abc'.split(''));
      await modeHandler.handleKeyEvent('<Home>');
      await modeHandler.handleKeyEvent(key);
      assertStatusBarEqual(':|abc');
    });
  }

  test(`<Del> removes one character from command line`, async () => {
    await modeHandler.handleMultipleKeyEvents(':abc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<left>', '<left>']);
    await modeHandler.handleMultipleKeyEvents(['<Del>']);
    assertStatusBarEqual(':a|c');
  });

  test(`<Del> with empty command line goes to normal mode`, async () => {
    await modeHandler.handleKeyEvent(':');
    await modeHandler.handleKeyEvent('<Del>');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  test(`<Del> at start of non-empty command acts normally`, async () => {
    await modeHandler.handleMultipleKeyEvents(':abc'.split(''));
    await modeHandler.handleKeyEvent('<Home>');
    await modeHandler.handleKeyEvent('<Del>');
    assertStatusBarEqual(':|bc');
  });
});
