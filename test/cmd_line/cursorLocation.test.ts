import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { StatusBar } from '../../src/statusBar';

suite('cursor location', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suiteTeardown(cleanUpWorkspace);

  test('cursor location in command line', async () => {
    await modeHandler.handleMultipleKeyEvents([
      ':',
      't',
      'e',
      's',
      't',
      '<right>',
      '<right>',
      '<right>',
      '<left>',
    ]);

    const statusBarAfterCursorMovement = StatusBar.getText();
    await modeHandler.handleKeyEvent('<Esc>');

    const statusBarAfterEsc = StatusBar.getText();
    assert.strictEqual(
      statusBarAfterCursorMovement.trim(),
      ':tes|t',
      'Command Tab Completion Failed',
    );
  });

  test('cursor location in search', async () => {
    await modeHandler.handleMultipleKeyEvents([
      '/',
      't',
      'e',
      's',
      't',
      '<right>',
      '<right>',
      '<right>',
      '<left>',
    ]);

    const statusBarAfterCursorMovement = StatusBar.getText();

    await modeHandler.handleKeyEvent('<Esc>');
    const statusBarAfterEsc = StatusBar.getText();
    assert.strictEqual(
      statusBarAfterCursorMovement.trim(),
      '/tes|t',
      'Command Tab Completion Failed',
    );
  });
});
