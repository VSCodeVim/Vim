import * as assert from 'assert';
import * as vscode from 'vscode';

import { Jump } from './../src/jumps/jump';
import { getAndUpdateModeHandler } from '../extension';
import { ModeHandler } from '../src/mode/modeHandler';
import { TextEditor } from '../src/textEditor';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';
import { JumpTracker } from '../src/jumps/jumpTracker';
import { Position } from '../src/common/motion/position';
import { waitForCursorSync } from '../src/util/util';

suite('Jump Tracker', () => {
  let jumpTracker: JumpTracker;
  let modeHandler: ModeHandler;
  let editor: vscode.TextEditor;

  const text = `start
a1
b1
c1
b2
d1
b3
e1
end`;

  const jump = (line, character) => new Jump({
    editor,
    fileName: 'Untitled',
    position: new Position(line, character),
  });

  const start = jump(0, 0);
  const b1 = jump(2, 0);
  const b3 = jump(6, 0);
  const end = jump(8, 0);


  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
    editor = modeHandler.vimState.editor!;

    modeHandler.vimState.editor = vscode.window.activeTextEditor!;
    (modeHandler as any).vimState.cursorPosition = new Position(0, 0);

    await TextEditor.insert(text);
    await waitForCursorSync();

    jumpTracker = modeHandler.vimState.globalState.jumpTracker;
    jumpTracker.clearJumps();
  });

  teardown(() => {
    jumpTracker.clearJumps();
    cleanUpWorkspace();
  });

  const assertJumpsEqual = (leftJumps, rightJumps) => {
    const position = j => ([j.position.line, j.position.character]);

    assert.deepEqual(
      leftJumps.map(position),
      rightJumps.map(position),
    );
  };

  const testJumps = async (keys, jumps) => {
    test(`jumpTracker records: ${keys.join('').replace('\n', '<CR>')}`, async () => {
      for (var i = 0; i < keys.length; i++) {
        const key = keys[i];
        await modeHandler.handleKeyEvent(key);
        await waitForCursorSync();
      }
      assertJumpsEqual(jumpTracker.jumps, jumps);
    });
  };

  testJumps(['G', 'g', 'g'], [start, end]);
  testJumps(['G', 'g', 'g', 'G'], [end, start]);
  testJumps(['G', 'g', 'g', 'G', 'g', 'g'], [start, end]);
  testJumps(['/', 'b', '\n', 'n'], [start, b1]);
  testJumps(['G', '?', 'b', '\n', 'g', 'g', 'G'], [end, b3, start]);
});
