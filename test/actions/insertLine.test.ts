import * as assert from 'assert';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getAndUpdateModeHandler } from '../../extension';
import * as vscode from 'vscode';

suite('insertLineBefore', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace({
      config: {
        tabstop: 4,
        expandtab: true,
      },
    });
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suiteTeardown(cleanUpWorkspace);

  test('tabs are added to match previous line even if line above does not match', async () => {
    // Setup the test
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('i\na'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('2G>>ob\nc'.split(''));

    // This is the current state of the document
    //
    //    a
    //    b
    //    c
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '2', 'G', 'O', 'a']);
    const text = vscode.window.activeTextEditor?.document.getText().split('\n');
    assert.ok(text);
    assert.strictEqual(text[1].replace(/[\n\r]/g, ''), text[2].replace(/[\n\r]/g, ''));
  });

  test('no extra whitespace added when insertLineBefore inserts correct amount', async () => {
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('i\na'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('2G>>ob\nc'.split(''));

    // This is the current state of the document
    //
    //    a
    //    b
    //    c
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '3', 'G', 'O', 'b']);
    const text = vscode.window.activeTextEditor?.document.getText().split('\n');
    assert.ok(text);
    assert.strictEqual(text[2].replace(/[\n\r]/g, ''), text[3].replace(/[\n\r]/g, ''));
  });

  test('no extra whitespace left when insertLineBefore inserts more than correct amount', async () => {
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('i\na'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('2G>>ob\nc'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('3G>>'.split(''));

    // This is the current state of the document
    //
    //    a
    //        b
    //    c
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '4', 'G', '2', 'O', 'c']);
    const text = vscode.window.activeTextEditor?.document.getText().split('\n');
    //
    //    a
    //        b
    //    c
    //    c
    //    c
    assert.ok(text);
    assert.strictEqual(text[3].replace(/[\n\r]/g, ''), text[4].replace(/[\n\r]/g, ''));
    assert.strictEqual(text[4].replace(/[\n\r]/g, ''), text[5].replace(/[\n\r]/g, ''));
  });

  test('works at the top of the document', async () => {
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('ia'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('gg>>'.split(''));

    // This is the current state of the document
    //    a
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'O', 'a']);
    const text = vscode.window.activeTextEditor?.document.getText().split('\n');
    assert.ok(text);
    assert.strictEqual(text[0].replace(/[\n\r]/g, ''), text[1].replace(/[\n\r]/g, ''));
  });

  test('works with multiple cursors', async () => {
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g', 'd', 'G']);
    await modeHandler.handleMultipleKeyEvents('oa'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>']);
    await modeHandler.handleMultipleKeyEvents('2G>>'.split(''));
    // This is the current state of the document
    //
    //    a
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '2', 'G', '2', 'O', 'a']);
    // After
    //
    //    a
    //    a
    //    a
    const text = vscode.window.activeTextEditor?.document.getText().split('\n');
    assert.ok(text);
    assert.strictEqual(text[1].replace(/[\n\r]/g, ''), text[2].replace(/[\n\r]/g, ''));
    assert.strictEqual(text[2].replace(/[\n\r]/g, ''), text[3].replace(/[\n\r]/g, ''));
  });
});
