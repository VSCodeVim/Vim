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

  const jump = (lineNumber, columnNumber) =>
    new Jump({
      editor,
      fileName: 'Untitled',
      position: new Position(lineNumber, columnNumber),
    });

  const start = jump(0, 0);
  const open = jump(1, 0);
  const a1 = jump(2, 0);
  const b1 = jump(3, 0);
  const a2 = jump(4, 0);
  const b2 = jump(5, 0);
  const close = jump(6, 0);
  const end = jump(7, 0);

  const range = (n: number) => Array.from(Array(n).keys());
  const fixLineEndings = (t: string): string =>
    process.platform === 'win32' ? t.replace(/\\n/g, '\\r\\n') : t;
  const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
  const hasPrefix = (t: string): boolean => t.startsWith('<') && t.endsWith('>');
  const tokenize = (t: string): string[] => (hasPrefix(t) ? [t] : t.split(''));
  const sendKeys = async (keys: string[]) => {
    for (var i = 0; i < keys.length; i++) {
      const key = keys[i];
      await modeHandler.handleKeyEvent(key);
      await waitForCursorSync();
    }
  };

  const position = j => [j.position.line, j.position.character];
  const line = j => j.position.line;

  const assertJumps = (expectedJumps: Jump[]) => {
    assert.deepEqual(
      jumpTracker.jumps.map(line),
      expectedJumps.map(line),
      'Jumps are not in the correct order or the jumps are for the wrong lines'
    );
  };
  const assertCurrentJump = (expectedCurrentJump: Jump) =>
    assert.deepEqual(
      position(jumpTracker.currentJump || jumpTracker.end),
      position(expectedCurrentJump),
      'Current jump is incorrect'
    );

  const setupTestsWithText = async (textEditorText: string) => {
    modeHandler = await getAndUpdateModeHandler();
    editor = modeHandler.vimState.editor!;

    modeHandler.vimState.editor = vscode.window.activeTextEditor!;
    (modeHandler as any).vimState.cursorPosition = new Position(0, 0);

    await TextEditor.insert(textEditorText);
    await waitForCursorSync();

    jumpTracker = modeHandler.vimState.globalState.jumpTracker;
    await modeHandler.handleMultipleKeyEvents(['gg']);
    await waitForCursorSync();
    jumpTracker.clearJumps();
  };

  /**
   * Create a test that checks both recorded jumps and final jump position.
   *
   * To get expected results for the tests:
   * 1) Open vim with vim -u NONE
   * 2) Paste in the text being tested against (text variable)
   * 3) :clearjumps
   * 4) Reproduce the key combinations
   * 5) :jumps
   * Read jumps from top to bottom, that should be in the jumps variable.
   * The arrow (>) will be the currentJump variable.
   */
  const testJumps = async (keys: string[], jumps: Jump[], currentJump: Jump) => {
    test(`Can record jumps for key events: ${keys.map(k => k.replace('\n', '\\n'))}`, async () => {
      await sendKeys(flatten(keys.map(fixLineEndings).map(tokenize)));

      assertJumps(jumps);
      assertCurrentJump(currentJump);
    });
  };

  suite('Jump Tracker unit tests', () => {
    setup(async () => {
      await setupWorkspace();
      await setupTestsWithText(range(102).join('\n'));
    });

    teardown(() => {
      jumpTracker.clearJumps();
      cleanUpWorkspace();
    });

    test('Records up to 100 jumps, the fixed length in vanilla Vim', async () => {
      range(102).forEach((iteration: number) => {
        jumpTracker.recordJump(jump(iteration, 0), jump(iteration + 1, 0));
      });

      assert.equal(jumpTracker.jumps.length, 100, 'Jump tracker should cut off jumps at 100');
      assert.deepEqual(
        jumpTracker.jumps.map(j => j.position.line),
        range(102).slice(2, 102),
        "Jump tracker doesn't contain the expected jumps after removing old jumps"
      );
    });
  });

  suite('Can record jumps for actions the same as vanilla Vim', () => {
    const text = `start
{
a1
b1
a2
b2
}
end`;

    suite('Can track basic jumps', () => {
      setup(async () => {
        await setupWorkspace();
        await setupTestsWithText(text);
      });

      teardown(() => {
        jumpTracker.clearJumps();
        cleanUpWorkspace();
      });

      testJumps(['G', 'gg'], [start, end], end);
      testJumps(['G', 'gg', 'G'], [end, start], start);
      testJumps(['G', 'gg', 'G', 'gg'], [start, end], end);
      testJumps(['/b\n', 'n'], [start, b1], b1);
      testJumps(['G', '?b\n', 'gg', 'G'], [end, b2, start], start);
      testJumps(['j', '%', '%'], [open, close], close);
    });

    suite('Can track jumps with back/forward', () => {
      setup(async () => {
        await setupWorkspace();
        await setupTestsWithText(text);
      });

      teardown(() => {
        jumpTracker.clearJumps();
        cleanUpWorkspace();
      });

      testJumps(['j', '%', '%', '<C-o>'], [close, open], close);
      testJumps(['j', '%', '%', '<C-o>', '<C-i>'], [close, open], open);
      testJumps(['j', '%', '%', '<C-o>', '%'], [open, close], close);
      testJumps(['j', '%', '%', '<C-o>', 'gg'], [open, close], close);
      testJumps(['j', '%', '%', '<C-o>', '<C-o>', 'gg'], [open, close], close);
      testJumps(
        ['/^\n', 'nnn', '<C-o>', '<C-o>', '<C-o>', '<C-i>', 'gg'],
        [start, open, b1, a2, a1],
        a1
      );
      testJumps(['/^\n', 'nnn', '3', '<C-o>', '<C-i>', 'gg'], [start, open, b1, a2, a1], a1);
    });
  });
});
