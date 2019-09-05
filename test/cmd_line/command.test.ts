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
    let statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, ':abc-|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, ':abc|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, ':|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, ':|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<Esc>');
  });

  test('command <C-w> can remove word in search mode', async () => {
    await modeHandler.handleMultipleKeyEvents(['/', 'a', 'b', 'c', '-', '1', '2', '3', '<C-w>']);
    let statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, '/abc-|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, '/abc|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, '/|', 'Failed to remove word');

    await modeHandler.handleKeyEvent('<C-w>');
    statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, '/|', 'Failed to remove word');

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
    const statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, ':|123', 'Failed to retain the text on the right of the cursor');
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
    const statusBar = StatusBar.Get().trim();
    assert.equal(statusBar, '/|123', 'Failed to retain the text on the right of the cursor');
    await modeHandler.handleKeyEvent('<Esc>');
  });
});
