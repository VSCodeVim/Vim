import * as assert from 'assert';
import * as vscode from 'vscode';

import { Jump } from './../src/jumps/jump';
import { JumpTracker } from '../src/jumps/jumpTracker';
import { setupWorkspace } from './testUtils';
import { Position } from 'vscode';
import { ITestObject, newTest, newTestSkip } from './testSimplifier';

suite('Record and navigate jumps', () => {
  suiteSetup(setupWorkspace);

  const newJumpTest = (options: ITestObject | Omit<ITestObject, 'title'>) => {
    return newTest({
      title: `Can track jumps for keys: ${options.keysPressed.replace(/\n/g, '<CR>')}`,
      ...options,
    });
  };

  const newJumpTestSkipOnWindows = (options: ITestObject | Omit<ITestObject, 'title'>) => {
    return newTestSkip(
      {
        title: `Can track jumps for keys: ${options.keysPressed.replace(/\n/g, '<CR>')}`,
        ...options,
      },
      process.platform === 'win32',
    );
  };

  suite('Jump Tracker unit tests', () => {
    const jump = (lineNumber: number, columnNumber: number, fileName?: string) =>
      new Jump({
        document: { fileName: fileName ?? 'Untitled' } as vscode.TextDocument,
        position: new Position(lineNumber, columnNumber),
      });
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

      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => j.fileName),
        ['file1', 'file2', 'file3'],
        'Unexpected jumps found',
      );
      assert.strictEqual(
        jumpTracker.currentJump.fileName,
        'file1',
        'Unexpected current jump found',
      );
      assert.strictEqual(jumpTracker.currentJumpNumber, 0, 'Unexpected current jump number found');
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

      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => j.fileName),
        ['file1', 'file2', 'file3', 'file4'],
        'Unexpected jumps found',
      );
      assert.strictEqual(
        jumpTracker.currentJump.fileName,
        'file2',
        'Unexpected current jump found',
      );
      assert.strictEqual(jumpTracker.currentJumpNumber, 1, 'Unexpected current jump number found');
    });

    test('Can record jumps between files after switching files', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.handleFileJump(null, file1);
      jumpTracker.handleFileJump(file1, file2);
      jumpTracker.handleFileJump(file2, file3);
      jumpTracker.recordJumpBack(file3);
      jumpTracker.handleFileJump(file2, file4);

      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => j.fileName),
        ['file1', 'file2', 'file3', 'file2'],
        'Unexpected jumps found',
      );
      assert.strictEqual(jumpTracker.currentJump, null, 'Unexpected current jump found');
    });

    test('Can handle jumps to the same file multiple times', async () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.handleFileJump(null, file1);
      jumpTracker.handleFileJump(file1, file2);
      jumpTracker.handleFileJump(file2, file3);
      jumpTracker.handleFileJump(file3, file2);

      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => j.fileName),
        ['file1', 'file2', 'file3'],
        'Unexpected jumps found',
      );
      assert.strictEqual(jumpTracker.currentJump, null, 'Unexpected current jump found');
    });

    test('Can record up to 100 jumps, the fixed length in vanilla Vim', async () => {
      const jumpTracker = new JumpTracker();

      range(102).forEach((iteration: number) => {
        jumpTracker.recordJump(jump(iteration, 0), jump(iteration + 1, 0));
      });

      assert.strictEqual(jumpTracker.jumps.length, 100, 'Jump tracker should cut off jumps at 100');
      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => j.position.line),
        range(102).slice(2, 102),
        "Jump tracker doesn't contain the expected jumps after removing old jumps",
      );
    });

    test('Can handle recording "from" jump with no corresponding "to" jump', () => {
      const jumpTracker = new JumpTracker();

      jumpTracker.recordJump(jump(0, 0));

      assert.strictEqual(
        jumpTracker.jumps.length,
        1,
        'Jump tracker failed to record "from"-only jump',
      );
      assert.deepEqual(
        jumpTracker.jumps.map((j) => [j.position.line, j.position.character, j.fileName]),
        [[0, 0, 'Untitled']],
        `Jump tracker doesn't contain expected jumps after recording "from"-only jump`,
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

      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => [j.position.line, j.position.character, j.fileName]),
        [
          [0, 0, 'file2'],
          [5, 0, 'file2'],
          [0, 0, 'file1'],
          [3, 0, 'file1'],
          [5, 5, 'file1'],
          [6, 0, 'file1'],
        ],
        `Jump tracker doesn't contain the expected jumps before handling deleted text`,
      );

      // Note that this is just deleting lines 3 and 4.
      // vscode sends us a range where the end position is just AFTER the deleted text,
      // kind of like Array.slice.
      jumpTracker.handleTextDeleted(
        { fileName: 'file1' },
        new vscode.Range(new vscode.Position(3, 0), new vscode.Position(5, 0)),
      );

      // Vim doesn't delete jumps at the deleted line, it just shifts other lines down
      // Note the column number was preserved for newer jump when it found duplicates on a line.
      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => [j.position.line, j.position.character, j.fileName]),
        [
          [0, 0, 'file2'],
          [5, 0, 'file2'],
          [0, 0, 'file1'],
          [3, 5, 'file1'],
          [4, 0, 'file1'],
        ],
        `Jump tracker doesn't contain the expected jumps after deleting two lines`,
      );

      jumpTracker.handleTextDeleted(
        { fileName: 'file1' },
        new vscode.Range(new vscode.Position(3, 0), new vscode.Position(4, 0)),
      );

      // If that results in multiple jumps on a line, though the duplicate is deleted
      // Preserve the newest jump in that case
      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => [j.position.line, j.position.character, j.fileName]),
        [
          [0, 0, 'file2'],
          [5, 0, 'file2'],
          [0, 0, 'file1'],
          [3, 0, 'file1'],
        ],
        `Jump tracker doesn't contain the expected jumps after deleting another line`,
      );

      jumpTracker.handleTextDeleted(
        { fileName: 'file1' },
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(3, 0)),
      );

      // If you delete lines such that jumps are past EOF, delete the jumps
      assert.deepStrictEqual(
        jumpTracker.jumps.map((j) => [j.position.line, j.position.character, j.fileName]),
        [
          [0, 0, 'file2'],
          [5, 0, 'file2'],
          [0, 0, 'file1'],
        ],
        `Jump tracker doesn't contain the expected jumps after deleting all lines in file`,
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
      newJumpTest({
        start: ['one', 'two', 'th|ree', 'four', 'five'],
        keysPressed: 'gg' + '3gg' + '4gg',
        end: ['one', 'two', 'three', '|four', 'five'],
        jumps: ['one', 'three'],
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
      newJumpTest({
        title: 'Can track one-line `` jumps',
        start: ['|start', 'var foo = {"a", "b"}', 'end'],
        keysPressed: 'jf{%r]``r[',
        end: ['start', 'var foo = |["a", "b"]', 'end'],
        jumps: ['var foo = ["a", "b"]'],
      });
      newJumpTest({
        title: 'Can track one-line double `` jumps',
        start: ['|start', 'var foo = {"a", "b"}', 'end'],
        keysPressed: 'jf{%r]``r[``',
        end: ['start', 'var foo = ["a", "b"|]', 'end'],
        jumps: ['var foo = ["a", "b"]'],
      });
      newJumpTest({
        title: "Can track one-line '' jumps",
        start: ['|start', 'var foo = {"a", "b"}', 'end'],
        keysPressed: "jf{%r]``r[''",
        end: ['start', '|var foo = ["a", "b"]', 'end'],
        jumps: ['var foo = ["a", "b"]'],
      });
      newJumpTest({
        title: "Can track one-line double '' jumps",
        start: ['|start', 'var foo = {"a", "b"}', 'end'],
        keysPressed: "jf{%r]``r[''''",
        end: ['start', '|var foo = ["a", "b"]', 'end'],
        jumps: ['var foo = ["a", "b"]'],
      });
      newJumpTest({
        title: "Can handle '' jumps with no previous jump",
        start: ['|start', 'var foo = {"a", "b"}', 'end'],
        keysPressed: "''",
        end: ['|start', 'var foo = {"a", "b"}', 'end'],
        jumps: [],
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
      // TODO(#4844): this fails on Windows
      newJumpTestSkipOnWindows({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkkoINSERTED<Esc>0',
        end: ['start', 'a1', 'a2', '|INSERTED', 'a3', 'a4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a2', 'a3'],
      });
      // TODO(#4844): this fails on Windows
      newJumpTestSkipOnWindows({
        start: ['|start', 'a1', 'a2', 'a3', 'a4', 'a5', 'end'],
        keysPressed: '/^\nnnnkoINSERTED<Esc>0',
        end: ['start', 'a1', 'a2', 'a3', '|INSERTED', 'a4', 'a5', 'end'],
        jumps: ['start', 'a1', 'a2', 'a3'],
      });
      // TODO(#4844): this fails on Windows
      newJumpTestSkipOnWindows({
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
        end: ['b1', 'b2', '|b3'],
        jumps: ['b3'],
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
