import * as assert from 'assert';
import * as vscode from 'vscode';
import { EasyMotion } from '../../src/actions/plugins/easymotion/easymotion';
import { Position } from 'vscode';
import { Cursor } from '../../src/common/motion/cursor';
import { VimState } from '../../src/state/vimState';

suite('VimState', () => {
  test('de-dupes cursors', async () => {
    // setup
    const vimState = new VimState(vscode.window.activeTextEditor!, new EasyMotion());
    await vimState.load();
    const cursorStart = new Position(0, 0);
    const cursorStop = new Position(0, 1);
    const initialCursors = [
      new Cursor(cursorStart, cursorStop),
      new Cursor(cursorStart, cursorStop),
    ];

    // test
    vimState.cursors = initialCursors;

    // assert
    assert.strictEqual(vimState.cursors.length, 1);
  });

  test('cursorStart/cursorStop should be first cursor in cursors', async () => {
    // setup
    const vimState = new VimState(vscode.window.activeTextEditor!, new EasyMotion());
    await vimState.load();
    const cursorStart = new Position(0, 0);
    const cursorStop = new Position(0, 1);
    const initialCursors = [
      new Cursor(cursorStart, cursorStop),
      new Cursor(new Position(1, 0), new Position(1, 1)),
    ];

    // test
    vimState.cursors = initialCursors;

    // assert
    assert.strictEqual(vimState.cursors.length, 2);
    assert.strictEqual(vimState.isMultiCursor, true);
    vimState.cursorStartPosition = cursorStart;
    vimState.cursorStopPosition = cursorStop;
  });
});
