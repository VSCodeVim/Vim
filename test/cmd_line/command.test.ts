import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { StatusBar } from '../../src/statusBar';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('cmd_line/search command', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('command <C-w> can remove word in cmd line', async () => {
    await modeHandler.handleMultipleKeyEvents([':', 'a', 'b', 'c', '-', '1', '2', '3', '<C-w>']);
    let statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':abc-|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':abc|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('command <C-w> can remove word in search mode', async () => {
    await modeHandler.handleMultipleKeyEvents(['/', 'a', 'b', 'c', '-', '1', '2', '3', '<C-w>']);
    let statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, '/abc-|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, '/abc|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, '/|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, '/|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<Esc>');
  });

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
    const statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':|123', 'Failed to retain the text on the right of the cursor');
    await modeHandler.handleKeyEvent('<Esc>');
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
    const statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, '/|123', 'Failed to retain the text on the right of the cursor');
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('<C-u> deletes from cursor to first character', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<left>', '<left>', '<C-u>']);
    const statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':|yz');
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('<C-b> puts cursor at start of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleKeyEvent('<C-b>');
    const statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':|s/abc/xyz');
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('<Home> puts cursor at start of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleKeyEvent('<Home>');
    const statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':|s/abc/xyz');
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('<C-e> puts cursor at end of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<C-b>', '<C-e>']);
    const statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':s/abc/xyz|');
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('<End> puts cursor at end of command line', async () => {
    await modeHandler.handleMultipleKeyEvents(':s/abc/xyz'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Home>', '<End>']);
    const statusBar = StatusBar.getText().trim();
    assert.strictEqual(statusBar, ':s/abc/xyz|');
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('<C-p>/<C-n> go to the previous/next command', async () => {
    // Establish a history - :s/a/b, then :s/x/y.
    // :w is the current one, not yet confirmed
    await modeHandler.handleMultipleKeyEvents(':s/a/b\n'.split(''));
    await modeHandler.handleMultipleKeyEvents(':s/x/y\n'.split(''));
    await modeHandler.handleMultipleKeyEvents([':', 'w', '<C-p>']);

    // Going backward - :s/x/y, then :s/a/b
    assert.strictEqual(StatusBar.getText().trim(), ':s/x/y|');
    await modeHandler.handleKeyEvent('<C-p>');
    assert.strictEqual(StatusBar.getText().trim(), ':s/a/b|');

    // Going forward again - :s/x/y, then :w (the one we started typing)
    await modeHandler.handleKeyEvent('<C-n>');
    assert.strictEqual(StatusBar.getText().trim(), ':s/x/y|');
    await modeHandler.handleKeyEvent('<C-n>');

    // TODO: Really, this should be `:w|`. See #4093.
    assert.strictEqual(StatusBar.getText().trim(), ':|');
    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('<C-r> <C-w> insert word under cursor on command line', async () => {
    await modeHandler.handleMultipleKeyEvents('iabc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', ':', '<C-r>', '<C-w>']);
    const statusBar = StatusBar.getText().trim();
    assert.equal(statusBar, ':abc|', 'Failed to insert word');
  });

  test('<C-r> <C-w> insert right word of cursor on command line', async () => {
    await modeHandler.handleMultipleKeyEvents('i::abc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '0', ':', '<C-r>', '<C-w>']);
    const statusBar = StatusBar.getText().trim();
    assert.equal(statusBar, ':abc|', 'Failed to insert word');
  });

  test('<C-r> <C-w> insert word under cursor in search mode', async () => {
    await modeHandler.handleMultipleKeyEvents('iabc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '/', '<C-r>', '<C-w>']);
    const statusBar = StatusBar.getText().trim();
    assert.equal(statusBar, '/abc|', 'Failed to insert word');
  });
});
