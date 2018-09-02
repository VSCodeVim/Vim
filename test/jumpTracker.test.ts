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
    });

    suite('Can handle deleted lines', () => {
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
        keysPressed: '/a4\n/a5\nkkkdd',
        end: ['start', 'a1', '|a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a4'],
      });
    });
  });
});
