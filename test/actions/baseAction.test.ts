import * as assert from 'assert';
import * as vscode from 'vscode';

import { BaseAction } from '../../src/actions/base';
import { VimState } from '../../src/state/vimState';
import { setupWorkspace, cleanUpWorkspace } from './../testUtils';
import { ModeName } from '../../src/mode/mode';

class TestAction1D extends BaseAction {
  keys = ['a', 'b'];
  modes = [ModeName.Normal];
}

class TestAction2D extends BaseAction {
  keys = [['a', 'b'], ['c', 'd']];
  modes = [ModeName.Normal];
}

suite('base action', () => {
  const action1D = new TestAction1D();
  const action2D = new TestAction2D();
  let vimState: VimState;

  suiteSetup(async () => {
    await setupWorkspace();
    vimState = new VimState(vscode.window.activeTextEditor!);
  });

  suiteTeardown(cleanUpWorkspace);

  test('compare key presses', () => {
    const testCases: Array<[string[] | string[][], string[], boolean]> = [
      [['a'], ['a'], true],
      [[['a']], ['a'], true],
      [[['a'], ['b']], ['b'], true],
      [[['a'], ['b']], ['c'], false],
      [['a', 'b'], ['a', 'b'], true],
      [['a', 'b'], ['a', 'c'], false],
      [[['a', 'b'], ['c', 'd']], ['c', 'd'], true],
      [[''], ['a'], false],
      [['<Esc>'], ['<Esc>'], true],
    ];

    for (const test in testCases) {
      if (testCases.hasOwnProperty(test)) {
        const left = testCases[test][0];
        const right = testCases[test][1];
        const expected = testCases[test][2];

        const actual = BaseAction.CompareKeypressSequence(left, right);
        assert.strictEqual(actual, expected, `${left}. ${right}.`);
      }
    }
  });

  test('couldActionApply 1D keys positive', () => {
    const result = action1D.couldActionApply(vimState, ['a']);
    assert.strictEqual(result, true);
  });

  test('couldActionApply 1D keys negative', () => {
    const result = action1D.couldActionApply(vimState, ['b']);
    assert.strictEqual(result, false);
  });

  test('couldActionApply 2D keys positive', () => {
    const result = action2D.couldActionApply(vimState, ['c']);
    assert.strictEqual(result, true);
  });

  test('couldActionApply 2D keys negative', () => {
    const result = action2D.couldActionApply(vimState, ['b']);
    assert.strictEqual(result, false);
  });

  test('doesActionApply 1D keys positive', () => {
    const result = action1D.doesActionApply(vimState, ['a', 'b']);
    assert.strictEqual(result, true);
  });

  test('doesActionApply 1D keys negative', () => {
    const result = action1D.doesActionApply(vimState, ['a', 'a']);
    assert.strictEqual(result, false);
  });

  test('doesActionApply 2D keys positive', () => {
    const result = action2D.doesActionApply(vimState, ['c', 'd']);
    assert.strictEqual(result, true);
  });

  test('doesActionApply 2D keys negative', () => {
    const result = action2D.doesActionApply(vimState, ['a', 'a']);
    assert.strictEqual(result, false);
  });
});
