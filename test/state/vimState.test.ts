import * as assert from 'assert';
import * as vscode from 'vscode';
import { Position } from '../../src/common/motion/position';
import { Range } from '../../src/common/motion/range';
import { VimState } from '../../src/state/vimState';
import { setupWorkspace, cleanUpWorkspace } from '../testUtils';

suite('VimState', () => {
  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  test('de-dupes cursors', () => {
    // setup
    const vimState = new VimState(vscode.window.activeTextEditor!);
    const cursorStart = new Position(0, 0);
    const cursorStop = new Position(0, 1);
    const initialCursors = [new Range(cursorStart, cursorStop), new Range(cursorStart, cursorStop)];

    // test
    vimState.cursors = initialCursors;

    // assert
    assert.equal(vimState.cursors.length, initialCursors.length);
  });

  test('cursorStart/cursorStop should be first cursor in cursors', () => {
    // setup
    const vimState = new VimState(vscode.window.activeTextEditor!);
    const cursorStart = new Position(0, 0);
    const cursorStop = new Position(0, 1);
    const initialCursors = [
      new Range(cursorStart, cursorStop),
      new Range(new Position(1, 0), new Position(1, 1)),
      new Range(new Position(1, 10), new Position(1, 11)),
    ];

    // test
    vimState.cursors = initialCursors;

    // assert
    assert.equal(vimState.cursors.length, initialCursors.length);
    assert.equal(vimState.isMultiCursor, true);
    vimState.cursorStartPosition = cursorStart;
    vimState.cursorStopPosition = cursorStop;
  });

  test('cursorStart/cursorStop setter', () => {
    // setup
    const vimState = new VimState(vscode.window.activeTextEditor!);
    const cursorStart = new Position(0, 0);
    const cursorStop = new Position(0, 1);
    const initialCursors = [
      new Range(new Position(1, 0), new Position(1, 1)),
    ];

    // test
    vimState.cursors = initialCursors;
    vimState.cursorStartPosition = cursorStart;
    vimState.cursorStopPosition = cursorStop;

    // assert
    assert.equal(vimState.cursors.length, 1);
    assert.equal(vimState.isMultiCursor, false);
    vimState.cursorStartPosition = cursorStart;
    vimState.cursorStopPosition = cursorStop;
  });
});
