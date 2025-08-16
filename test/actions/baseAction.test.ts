import * as assert from 'assert';
import * as vscode from 'vscode';

import { BaseAction } from '../../src/actions/base';
import { EasyMotion } from '../../src/actions/plugins/easymotion/easymotion';
import { Mode } from '../../src/mode/mode';
import { VimState } from '../../src/state/vimState';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

class TestAction1D extends BaseAction {
  keys = ['a', 'b'];
  actionType = 'command' as const;
  modes = [Mode.Normal];
}

class TestAction2D extends BaseAction {
  keys = [
    ['a', 'b'],
    ['c', 'd'],
  ];
  actionType = 'command' as const;
  modes = [Mode.Normal];
}

suite('base action', () => {
  const action1D = new TestAction1D();
  const action2D = new TestAction2D();
  let vimState: VimState;

  suiteSetup(async () => {
    await setupWorkspace();
    vimState = new VimState(vscode.window.activeTextEditor!, new EasyMotion());
    await vimState.load();
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
      [
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
        ['c', 'd'],
        true,
      ],
      [[''], ['a'], false],
      [['<Esc>'], ['<Esc>'], true],
    ];

    for (const test of testCases) {
      const [left, right, expected] = test;

      const actual = BaseAction.CompareKeypressSequence(left, right);
      assert.strictEqual(actual, expected, `${left}. ${right}.`);
    }
  });

  test('couldActionApply 1D keys positive', () => {
    assert.strictEqual(action1D.couldActionApply(vimState, ['a']), true);
  });

  test('couldActionApply 1D keys negative', () => {
    assert.strictEqual(action1D.couldActionApply(vimState, ['b']), false);
  });

  test('couldActionApply 2D keys positive', () => {
    assert.strictEqual(action2D.couldActionApply(vimState, ['c']), true);
  });

  test('couldActionApply 2D keys negative', () => {
    assert.strictEqual(action2D.couldActionApply(vimState, ['b']), false);
  });

  test('doesActionApply 1D keys positive', () => {
    assert.strictEqual(action1D.doesActionApply(vimState, ['a', 'b']), true);
  });

  test('doesActionApply 1D keys negative', () => {
    assert.strictEqual(action1D.doesActionApply(vimState, ['a', 'a']), false);
  });

  test('doesActionApply 2D keys positive', () => {
    assert.strictEqual(action2D.doesActionApply(vimState, ['c', 'd']), true);
  });

  test('doesActionApply 2D keys negative', () => {
    assert.strictEqual(action2D.doesActionApply(vimState, ['a', 'a']), false);
  });
});
