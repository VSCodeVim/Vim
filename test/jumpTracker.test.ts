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
{
a1
b1
a2
b2
}
end`;

  const jump = (line, character) =>
    new Jump({
      editor,
      fileName: 'Untitled',
      position: new Position(line, character),
    });

  const start = jump(0, 0);
  const open = jump(1, 0);
  const a1 = jump(2, 0);
  const b1 = jump(3, 0);
  const a2 = jump(4, 0);
  const b2 = jump(5, 0);
  const close = jump(6, 0);
  const end = jump(7, 0);

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
    const position = j => [j.position.line, j.position.character];

    assert.deepEqual(leftJumps.map(position), rightJumps.map(position));
  };

  const fixLineEndings = t => (process.platform === 'win32' ? t.replace(/\\n/g, '\\r\\n') : t);
  const tokenize = t => t.split('');
  const sendKeys = async keys => {
    for (var i = 0; i < keys.length; i++) {
      const key = keys[i];
      await modeHandler.handleKeyEvent(key);
      await waitForCursorSync();
    }
  };

  const testJumps = async (keys: string, jumps: Jump[]) => {
    test(`Can record jumps for key events: ${keys.replace('\n', '\\n')}`, async () => {
      await sendKeys(tokenize(fixLineEndings(keys)));
      assertJumpsEqual(jumpTracker.jumps, jumps);
    });
  };

  testJumps('Ggg', [start, end]);
  testJumps('GggG', [end, start]);
  testJumps('GggGgg', [start, end]);
  testJumps('/b\nn', [start, b1]);
  testJumps('G?b\nggG', [end, b2, start]);
  testJumps('j%%', [open, close]);
});
