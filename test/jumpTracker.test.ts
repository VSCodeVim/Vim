import * as assert from 'assert';
import * as vscode from 'vscode';

import { Globals } from '../src/globals';
import { Jump } from './../src/jumps/jump';
import { JumpTracker } from '../src/jumps/jumpTracker';
import { ModeHandler } from '../src/mode/modeHandler';
import { Position } from '../src/common/motion/position';
import { TextEditor } from '../src/textEditor';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';
import { getAndUpdateModeHandler } from '../extension';
import { getTestingFunctions } from './testSimplifier';
import { waitForCursorSync } from '../src/util/util';

suite('Record and navigate jumps', () => {
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  const newJumpTest = options => {
    return newTest({
      title: `Can track jumps for keys: ${options.keysPressed.replace(/\n/g, '<CR>')}`,
      ...options,
    });
  };

  suite('Jump Tracker unit tests', () => {
    const jump = (lineNumber, columnNumber, fileName?) =>
      new Jump({
        editor: null,
        fileName: fileName || 'Untitled',
        position: new Position(lineNumber, columnNumber),
      });
    const file1 = jump(0, 0, 'file1');
    const file2 = jump(0, 0, 'file2');
    const file3 = jump(0, 0, 'file3');
    const file4 = jump(0, 0, 'file4');
    const range = (n: number) => Array.from(Array(n).keys());

    test('Can record jumps between files', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.recordFileJump(null, file1);
      jumpTracker.recordFileJump(file1, file2);
      jumpTracker.recordFileJump(file2, file3);
      jumpTracker.jumpBack(file3);
      jumpTracker.jumpBack(file2);

      assert.deepEqual(
        jumpTracker.jumps.map(j => j.fileName),
        ['file1', 'file2', 'file3'],
        'Unexpected jumps found'
      );
      assert.equal(jumpTracker.currentJump.fileName, 'file1', 'Unexpected current jump found');
    });

    test('Can record jumps between files after switching files', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.recordFileJump(null, file1);
      jumpTracker.recordFileJump(file1, file2);
      jumpTracker.recordFileJump(file2, file3);
      jumpTracker.jumpBack(file3);
      jumpTracker.recordFileJump(file2, file4);

      assert.deepEqual(
        jumpTracker.jumps.map(j => j.fileName),
        ['file1', 'file2', 'file3', 'file2'],
        'Unexpected jumps found'
      );
      assert.equal(jumpTracker.currentJump, null, 'Unexpected current jump found');
    });

    test('Can handle jumps to the same file multiple times', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.recordFileJump(null, file1);
      jumpTracker.recordFileJump(file1, file2);
      jumpTracker.recordFileJump(file2, file3);
      jumpTracker.recordFileJump(file3, file2);

      assert.deepEqual(
        jumpTracker.jumps.map(j => j.fileName),
        ['file1', 'file2', 'file3'],
        'Unexpected jumps found'
      );
      assert.equal(jumpTracker.currentJump, null, 'Unexpected current jump found');
    });

    test('Can record up to 100 jumps, the fixed length in vanilla Vim', async () => {
      const jumpTracker = new JumpTracker();

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
    suite('Can track basic jumps', () => {
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'Ggg',
        end: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['start', 'end'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'GggG',
        end: ['start', '{', 'a1', 'b1', 'a2', 'b2', '}', '|end'],
        jumps: ['end', 'start'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'GggGgg',
        end: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['start', 'end'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: '/b\nn',
        end: ['start', '{', 'a1', 'b1', 'a2', '|b2', '}', 'end'],
        jumps: ['start', 'b1'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'G?b\nggG',
        end: ['start', '{', 'a1', 'b1', 'a2', 'b2', '}', '|end'],
        jumps: ['end', 'b2', 'start'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'j%%',
        end: ['start', '|{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['{', '}'],
      });
    });

    suite('Can track jumps with back/forward', () => {
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'j%%<C-o>',
        end: ['start', '{', 'a1', 'b1', 'a2', 'b2', '|}', 'end'],
        jumps: ['|}', '{'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'j%%<C-o><C-i>',
        end: ['start', '|{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['}', '|{'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'j%%<C-o>%',
        end: ['start', '|{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['{', '}'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'j%%<C-o>gg',
        end: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['{', '}'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'j%%<C-o><C-o>gg',
        end: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['{', '}'],
      });
      newJumpTest({
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: '/^\nnnn<C-o><C-o><C-o><C-i>gg',
        end: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        jumps: ['start', '{', 'b1', 'a2', 'a1'],
      });

      newJumpTest({
        title: 'Can enter number to jump back multiple times',
        start: ['|start', '{', 'a1', 'b1', 'a2', 'b2', '}', 'end'],
        keysPressed: 'Gggj%2<C-o>',
        end: ['start', '{', 'a1', 'b1', 'a2', 'b2', '}', '|end'],
        jumps: ['start', '|end', '{', '}'],
      });
    });

    suite('Can shifts jump lines up after deleting a line', () => {
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkkdd',
        end: ['start', 'a1', '|a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a3'],
      });
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkdd',
        end: ['start', 'a1', 'a2', '|a4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a2', 'a4'],
      });
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnnn<C-o><C-o><C-o><C-o>dd',
        end: ['start', 'a1', '|a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a1', '|a3', 'a4', 'a5', 'end'],
      });
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/a4\n/a5\nkkkdd',
        end: ['start', 'a1', '|a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a4'],
      });
    });

    suite('Can shift jump lines down after inserting a line', () => {
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkkoINSERTED<Esc>0',
        end: ['start', 'a1', 'a2', '|INSERTED', 'a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a2', 'a3'],
      });
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkoINSERTED<Esc>0',
        end: ['start', 'a1', 'a2', 'a3', '|INSERTED', 'a4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a2', 'a3'],
      });
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkOINSERTED<Esc>0',
        end: ['start', 'a1', 'a2', '|INSERTED', 'a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a2', 'a3'],
      });
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/a4\n/a5\nkkkoINSERTED<Esc>0',
        end: ['start', 'a1', 'a2', '|INSERTED', 'a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a4'],
      });
    });

    suite('Can track jumps from substitutes', () => {
      newJumpTest({
        start: ['|a1', 'a2', 'a3'],
        keysPressed: ':%s/a/b\n',
        end: ['|b1', 'b2', 'b3'],
        jumps: ['b2', 'b3'],
      });
    });

    suite('Can track jumps from macros', () => {
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'end'],
        keysPressed: 'qq/^\nnq@q@q<C-o><C-o>',
        end: ['start', 'a1', 'a2', 'a3', '|a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'end'],
        jumps: ['start', 'a1', 'a2', 'a3', '|a4', 'a5', 'a6'],
      });
    });

    suite('Can track jumps from marks', () => {
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'end'],
        keysPressed: 'maG`a',
        end: ['|start', 'a1', 'a2', 'a3', 'end'],
        jumps: ['start', 'end'],
      });
    });
  });
});
