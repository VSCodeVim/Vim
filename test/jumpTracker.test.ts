import * as assert from 'assert';
import * as vscode from 'vscode';

import { GlobalState } from '../src/state/globalState';
import { Jump } from './../src/jumps/jump';
import { JumpTracker } from '../src/jumps/jumpTracker';
import { Position } from '../src/common/motion/position';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';
import { getAndUpdateModeHandler } from '../extension';
import { getTestingFunctions } from './testSimplifier';
import { waitForCursorSync } from '../src/util/util';

suite('Record and navigate jumps', () => {
  let { newTest } = getTestingFunctions();

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

  const jump = (lineNumber, columnNumber, fileName?) =>
    new Jump({
      editor: null,
      fileName: fileName || 'Untitled',
      position: new Position(lineNumber, columnNumber),
    });

  suite('Jump Tracker unit tests', () => {
    const file1 = jump(0, 0, 'file1');
    const file2 = jump(0, 0, 'file2');
    const file3 = jump(0, 0, 'file3');
    const file4 = jump(0, 0, 'file4');
    const range = (n: number) => Array.from(Array(n).keys());

    test('Can record jumps between files', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.handleFileJump(null, file1);
      jumpTracker.handleFileJump(file1, file2);
      jumpTracker.handleFileJump(file2, file3);
      jumpTracker.recordJumpBack(file3);
      jumpTracker.recordJumpBack(file2);

      assert.deepEqual(
        jumpTracker.jumps.map(j => j.fileName),
        ['file1', 'file2', 'file3'],
        'Unexpected jumps found'
      );
      assert.equal(jumpTracker.currentJump.fileName, 'file1', 'Unexpected current jump found');
      assert.equal(jumpTracker.currentJumpNumber, 0, 'Unexpected current jump number found');
    });

    test('Can handle file jump events sent by vscode in response to recordJumpBack', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.handleFileJump(null, file1);
      jumpTracker.handleFileJump(file1, file2);
      jumpTracker.handleFileJump(file2, file3);
      jumpTracker.handleFileJump(file3, file4);

      jumpTracker.isJumpingThroughHistory = true;
      jumpTracker.recordJumpBack(file4);
      jumpTracker.handleFileJump(file4, file3);

      jumpTracker.isJumpingThroughHistory = true;
      jumpTracker.recordJumpBack(file3);
      jumpTracker.handleFileJump(file3, file2);

      assert.deepEqual(
        jumpTracker.jumps.map(j => j.fileName),
        ['file1', 'file2', 'file3', 'file4'],
        'Unexpected jumps found'
      );
      assert.equal(jumpTracker.currentJump.fileName, 'file2', 'Unexpected current jump found');
      assert.equal(jumpTracker.currentJumpNumber, 1, 'Unexpected current jump number found');
    });

    test('Can record jumps between files after switching files', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.handleFileJump(null, file1);
      jumpTracker.handleFileJump(file1, file2);
      jumpTracker.handleFileJump(file2, file3);
      jumpTracker.recordJumpBack(file3);
      jumpTracker.handleFileJump(file2, file4);

      assert.deepEqual(
        jumpTracker.jumps.map(j => j.fileName),
        ['file1', 'file2', 'file3', 'file2'],
        'Unexpected jumps found'
      );
      assert.equal(jumpTracker.currentJump, null, 'Unexpected current jump found');
    });

    test('Can handle jumps to the same file multiple times', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.handleFileJump(null, file1);
      jumpTracker.handleFileJump(file1, file2);
      jumpTracker.handleFileJump(file2, file3);
      jumpTracker.handleFileJump(file3, file2);

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

    test('Can handle text deleted from a file', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.recordJump(jump(0, 0, 'file2'), jump(5, 0, 'file2'));
      jumpTracker.recordJump(jump(5, 0, 'file2'), jump(0, 0, 'file1'));
      jumpTracker.recordJump(jump(0, 0, 'file1'), jump(3, 0, 'file1'));
      jumpTracker.recordJump(jump(3, 0, 'file1'), jump(5, 0, 'file1'));
      jumpTracker.recordJump(jump(5, 5, 'file1'), jump(6, 0, 'file1'));
      jumpTracker.recordJump(jump(6, 0, 'file1'), jump(2, 0, 'file1'));

      assert.deepEqual(
        jumpTracker.jumps.map(j => [j.position.line, j.position.character, j.fileName]),
        [
          [0, 0, 'file2'],
          [5, 0, 'file2'],
          [0, 0, 'file1'],
          [3, 0, 'file1'],
          [5, 5, 'file1'],
          [6, 0, 'file1'],
        ],
        `Jump tracker doesn't contain the expected jumps before handling deleted text`
      );

      // Note that this is just deleting lines 3 and 4.
      // vscode sends us a range where the end position is just AFTER the deleted text,
      // kind of like Array.slice.
      jumpTracker.handleTextDeleted(
        { fileName: 'file1' },
        new vscode.Range(new vscode.Position(3, 0), new vscode.Position(5, 0))
      );

      // Vim doesn't delete jumps at the deleted line, it just shifts other lines down
      // Note the column number was preserved for newer jump when it found duplicates on a line.
      assert.deepEqual(
        jumpTracker.jumps.map(j => [j.position.line, j.position.character, j.fileName]),
        [[0, 0, 'file2'], [5, 0, 'file2'], [0, 0, 'file1'], [3, 5, 'file1'], [4, 0, 'file1']],
        `Jump tracker doesn't contain the expected jumps after deleting two lines`
      );

      jumpTracker.handleTextDeleted(
        { fileName: 'file1' },
        new vscode.Range(new vscode.Position(3, 0), new vscode.Position(4, 0))
      );

      // If that results in multiple jumps on a line, though the duplicate is deleted
      // Preserve the newest jump in that case
      assert.deepEqual(
        jumpTracker.jumps.map(j => [j.position.line, j.position.character, j.fileName]),
        [[0, 0, 'file2'], [5, 0, 'file2'], [0, 0, 'file1'], [3, 0, 'file1']],
        `Jump tracker doesn't contain the expected jumps after deleting another line`
      );

      jumpTracker.handleTextDeleted(
        { fileName: 'file1' },
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(3, 0))
      );

      // If you delete lines such that jumps are past EOF, delete the jumps
      assert.deepEqual(
        jumpTracker.jumps.map(j => [j.position.line, j.position.character, j.fileName]),
        [[0, 0, 'file2'], [5, 0, 'file2'], [0, 0, 'file1']],
        `Jump tracker doesn't contain the expected jumps after deleting all lines in file`
      );
    });
  });

  suite('Jump Tracker integration tests', () => {
    async function waitFor(predicate: () => boolean, timeout: number = 1000): Promise<void> {
      await new Promise((resolve, reject) => {
        let checkJumpsInterval = setInterval(() => {
          if (predicate()) {
            resolve();
            clearInterval(checkJumpsInterval);
          }
        }, Math.min(10, timeout));

        let timer = setTimeout(() => {
          reject(new Error(`Timeout occurred when waiting for: ${predicate}`));
          clearInterval(checkJumpsInterval);
        }, timeout);
      });
    }

    const setupWithLines = async (
      lines: string[]
    ): Promise<{
      editor: vscode.TextEditor;
      jumpTracker: JumpTracker;
    }> => {
      const modeHandler = await getAndUpdateModeHandler();
      const vimState = modeHandler.vimState;
      const editor = vimState.editor;
      const globalState = new GlobalState();
      const jumpTracker = globalState.jumpTracker;

      vimState.cursorPosition = new Position(0, 0);

      await modeHandler.handleKeyEvent('<Esc>');
      await vimState.editor.edit(builder => {
        builder.insert(new Position(0, 0), lines.join('\n'));
      });
      await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
      await waitForCursorSync();

      assert.ok(vimState.cursorPosition.line === 0);

      jumpTracker.clearJumps();

      return { editor, jumpTracker };
    };

    test('Can record external commands as a jump', async () => {
      // Changing selection results in a onDidChangeTextEditorSelection
      // of 'command', so it simulates what a command like
      // 'workbench.action.gotoSymbol' would result in, which should
      // now be recorded as a jump in one of our onDidChangeTextEditorSelection
      // handlers.
      const lines = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
      const { editor, jumpTracker } = await setupWithLines(lines);

      editor.selection = new vscode.Selection(new vscode.Position(3, 0), new Position(3, 0));
      await waitFor(() => jumpTracker.jumps.length >= 1, 5000);
      editor.selection = new vscode.Selection(new vscode.Position(5, 0), new Position(5, 0));
      await waitFor(() => jumpTracker.jumps.length >= 2, 5000);

      assert.equal(jumpTracker.jumps.length, 2);
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

    suite('Can shifts jump lines up after deleting a line with Visual Line Mode', () => {
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

    suite('Can shifts jump lines up after deleting a line with Visual Mode', () => {
      newJumpTest({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkklvjjhx',
        end: ['start', 'a1', 'a|4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a4'],
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
