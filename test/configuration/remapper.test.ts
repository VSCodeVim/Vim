import * as assert from 'assert';
import * as vscode from 'vscode';

import { Remappers, Remapper } from '../../src/configuration/remapper';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { Configuration } from '../testConfiguration';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';
import { IKeyRemapping } from '../../src/configuration/iconfiguration';
import { IRegisterContent, Register } from '../../src/register/register';
import { getAndUpdateModeHandler } from '../../extension';
import { VimState } from '../../src/state/vimState';

/* tslint:disable:no-string-literal */

suite('Remapper', () => {
  let modeHandler: ModeHandler;
  let vimState: VimState;
  const leaderKey = '\\';
  const defaultInsertModeKeyBindings: IKeyRemapping[] = [
    {
      before: ['j', 'j'],
      after: ['<Esc>'],
    },
    {
      before: ['<c-e>'],
      after: ['<Esc>'],
    },
  ];
  const defaultNormalModeKeyBindings: IKeyRemapping[] = [
    {
      before: ['leader', 'w'],
      commands: [
        {
          command: 'workbench.action.closeActiveEditor',
          args: [],
        },
      ],
    },
    {
      before: ['0'],
      commands: [
        {
          command: ':wq',
          args: [],
        },
      ],
    },
    {
      before: ['d'],
      after: ['"', '_', 'd'],
    },
    {
      before: ['y', 'y'],
      after: ['y', 'l'],
    },
    {
      before: ['e'],
      after: ['$'],
    },
  ];
  const defaultVisualModeKeyBindings: IKeyRemapping[] = [
    {
      before: ['leader', 'c'],
      commands: [
        {
          command: 'workbench.action.closeActiveEditor',
          args: [],
        },
      ],
    },
  ];

  class TestRemapper extends Remapper {
    constructor() {
      super('configKey', [Mode.Insert], false);
    }

    public findMatchingRemap(
      userDefinedRemappings: Map<string, IKeyRemapping>,
      inputtedKeys: string[],
      currentMode: Mode
    ) {
      return super.findMatchingRemap(userDefinedRemappings, inputtedKeys, currentMode);
    }

    public getRemappedKeySequenceLengthRange(
      remappings: Map<string, IKeyRemapping>
    ): [number, number] {
      return TestRemapper.getRemappedKeysLengthRange(remappings);
    }
  }

  const setupWithBindings = async ({
    insertModeKeyBindings,
    normalModeKeyBindings,
    visualModeKeyBindings,
  }: {
    insertModeKeyBindings?: IKeyRemapping[];
    normalModeKeyBindings?: IKeyRemapping[];
    visualModeKeyBindings?: IKeyRemapping[];
  }) => {
    const configuration = new Configuration();
    configuration.leader = leaderKey;
    configuration.insertModeKeyBindings = insertModeKeyBindings || [];
    configuration.normalModeKeyBindings = normalModeKeyBindings || [];
    configuration.visualModeKeyBindings = visualModeKeyBindings || [];

    await setupWorkspace(configuration);
    modeHandler = await getAndUpdateModeHandler();
    vimState = modeHandler.vimState;
  };

  teardown(cleanUpWorkspace);

  test('getLongestedRemappedKeySequence', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remappings: Map<string, IKeyRemapping> = new Map([
      ['abc', { before: ['a', 'b', 'c'] }],
      ['de', { before: ['d', 'e'] }],
      ['f', { before: ['f'] }],
    ]);

    // act
    const testRemapper = new TestRemapper();
    const actual = testRemapper.getRemappedKeySequenceLengthRange(remappings);

    // assert
    assert.strictEqual(actual[0], 1);
    assert.strictEqual(actual[1], 3);
  });

  test('getMatchingRemap', async () => {
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const testCases = [
      {
        // able to match number in normal mode
        before: '0',
        after: ':wq',
        input: '0',
        mode: Mode.Normal,
        expectedAfter: ':wq',
      },
      {
        // able to match characters in normal mode
        before: 'abc',
        after: ':wq',
        input: 'abc',
        mode: Mode.Normal,
        expectedAfter: ':wq',
      },
      {
        // able to match with preceding count in normal mode
        before: 'abc',
        after: ':wq',
        input: '0abc',
        mode: Mode.Normal,
        expectedAfter: ':wq',
      },
      {
        // must match exactly in normal mode
        before: 'abc',
        after: ':wq',
        input: 'defabc',
        mode: Mode.Normal,
      },
      {
        // able to match in insert mode
        before: 'jj',
        after: '<Esc>',
        input: 'jj',
        mode: Mode.Insert,
        expectedAfter: '<Esc>',
        expectedAfterMode: Mode.Normal,
      },
      {
        // able to match with preceding keystrokes in insert mode
        before: 'jj',
        after: '<Esc>',
        input: 'hello world jj',
        mode: Mode.Insert,
        expectedAfter: '<Esc>',
        expectedAfterMode: Mode.Normal,
      },
      {
        // able to match with preceding keystrokes in insert mode
        before: 'jj',
        after: '<Esc>',
        input: 'ifoo<Esc>ciwjj',
        mode: Mode.Insert,
        expectedAfter: '<Esc>',
        expectedAfterMode: Mode.Normal,
      },
    ];

    for (const testCase of testCases) {
      // setup
      const remappings: Map<string, IKeyRemapping> = new Map();
      remappings.set(testCase.before, {
        before: testCase.before.split(''),
        after: testCase.after.split(''),
      });

      // act
      const testRemapper = new TestRemapper();
      const actual = testRemapper.findMatchingRemap(
        remappings,
        testCase.input.split(''),
        testCase.mode
      );

      // assert
      if (testCase.expectedAfter) {
        assert(
          actual,
          `Expected remap for before=${testCase.before}. input=${testCase.input}. mode=${
            Mode[testCase.mode]
          }.`
        );
        assert.deepStrictEqual(actual!.after, testCase.expectedAfter.split(''));
      } else {
        assert.strictEqual(actual, undefined);
      }

      if (testCase.expectedAfterMode) {
        assert.strictEqual(modeHandler.currentMode, testCase.expectedAfterMode);
        assert.strictEqual(modeHandler.vimState.currentMode, testCase.expectedAfterMode);
      }
    }
  });

  test('jj -> <Esc> through modehandler', async () => {
    const expectedDocumentContent = 'lorem ipsum';

    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();

    const edit = new vscode.WorkspaceEdit();
    edit.insert(
      vscode.window.activeTextEditor!.document.uri,
      new vscode.Position(0, 0),
      expectedDocumentContent
    );
    await vscode.workspace.applyEdit(edit);

    await modeHandler.handleKeyEvent('i');
    assert.strictEqual(modeHandler.currentMode, Mode.Insert);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['j', 'j'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
    assert.strictEqual(vscode.window.activeTextEditor!.document.getText(), expectedDocumentContent);
  });

  test('0 -> :wq through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['0'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assert.strictEqual(vscode.window.visibleTextEditors.length, 0);
  });

  test('<c-e> -> <esc> in insert mode should go to normal mode', async () => {
    const expectedDocumentContent = 'lorem ipsum';

    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();

    const edit = new vscode.WorkspaceEdit();
    edit.insert(
      vscode.window.activeTextEditor!.document.uri,
      new vscode.Position(0, 0),
      expectedDocumentContent
    );
    vscode.workspace.applyEdit(edit);

    await modeHandler.handleKeyEvent('i');
    assert.strictEqual(modeHandler.currentMode, Mode.Insert);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['<C-e>'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
    assert.strictEqual(vscode.window.activeTextEditor!.document.getText(), expectedDocumentContent);
  });

  test('leader, w -> closeActiveEditor in normal mode through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey([leaderKey, 'w'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assert.strictEqual(vscode.window.visibleTextEditors.length, 0);
  });

  test('leader, c -> closeActiveEditor in visual mode through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    await modeHandler.handleKeyEvent('v');
    assert.strictEqual(modeHandler.currentMode, Mode.Visual);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey([leaderKey, 'c'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assert.strictEqual(vscode.window.visibleTextEditors.length, 0);
  });

  test('d -> black hole register delete in normal mode through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'line1', '<Esc>', '0']);

    const expected = 'text-to-put-on-register';
    let actual: IRegisterContent;
    Register.put(expected, modeHandler.vimState);
    actual = await Register.get(vimState);
    assert.strictEqual(actual.text, expected);

    // act
    await modeHandler.handleMultipleKeyEvents(['d', 'd']);

    // assert
    actual = await Register.get(vimState);
    assert.strictEqual(actual.text, expected);
  });

  test('d -> black hole register delete in normal mode through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'word1 word2', '<Esc>', '0']);

    const expected = 'text-to-put-on-register';
    let actual: IRegisterContent;
    Register.put(expected, modeHandler.vimState);
    actual = await Register.get(vimState);
    assert.strictEqual(actual.text, expected);

    // act
    await modeHandler.handleMultipleKeyEvents(['d', 'w']);

    // assert
    actual = await Register.get(vimState);
    assert.strictEqual(actual.text, expected);
  });

  test('jj -> <Esc> after ciw operator through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: [
        {
          before: ['j', 'j'],
          after: ['<Esc>'],
        },
      ],
    });

    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'word1 word2', '<Esc>', '0']);
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['c', 'i', 'w']);
    assert.strictEqual(modeHandler.currentMode, Mode.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);

    // assert
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
  });

  test('jj -> <Esc> does not leave behind character a j', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: [
        {
          before: ['j', 'j'],
          after: ['<Esc>'],
        },
      ],
    });

    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'foo', '<Esc>']);
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['a', 'bar']);
    assert.strictEqual(modeHandler.currentMode, Mode.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);
    assertEqualLines(['foobar']);

    // assert
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
  });

  test('jj -> <Esc> does not modify undo stack', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: [
        {
          before: ['j', 'j'],
          after: ['<Esc>'],
        },
      ],
    });

    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'foo', '<Esc>']);
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['a', 'bar']);
    assert.strictEqual(modeHandler.currentMode, Mode.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);
    assertEqualLines(['foobar']);

    // assert
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    await modeHandler.handleMultipleKeyEvents(['u']);
    assertEqualLines(['foo']);
  });

  test('ambiguous and potential remaps and timeouts', async () => {
    // setup
    await setupWithBindings({
      normalModeKeyBindings: [
        {
          before: ['w', 'w'],
          after: ['d', 'w'],
        },
        {
          before: ['w', 'w', 'w', 'w'],
          after: ['d', 'd'],
        },
        {
          before: ['b', 'b'],
          after: ['d', 'b'],
        },
      ],
    });

    // Offset because the timeout might not finish exactly on time.
    const timeoutOffset = 100;

    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'foo',
      '<space>',
      'bar',
      '<space>',
      'biz',
      '<Esc>',
      '0',
    ]);
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
    assertEqualLines(['foo bar biz']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      0,
      'Cursor is not on the right position, should be at the start of line'
    );

    // act and assert

    // check that 'ww' -> 'dw' waits for timeout to finish and timeout isn't run twice
    let result1 = await new Promise((r1Resolve, r1Reject) => {
      let p1 = new Promise((p1Resolve, p1Reject) => {
        setTimeout(() => {
          // Before the timeout finishes it shouldn't have changed anything yet,
          // because it is still waiting for a key or timeout to finish.
          assert.strictEqual(modeHandler.currentMode, Mode.Normal);
          assertEqualLines(['foo bar biz']);
          p1Resolve('Half Timeout Finished');
        }, Configuration.prototype.timeout / 2);
      });
      let p2 = new Promise((p2Resolve, p2Reject) => {
        setTimeout(() => {
          // After the timeout finishes (plus an offset to be sure it finished)
          // it should have handled the remapping, if it wrongly ran the timeout
          // twice this should fail too.
          assert.strictEqual(modeHandler.currentMode, Mode.Normal);
          assertEqualLines(['bar biz']);
          p2Resolve('Timeout plus offset Finished');
        }, Configuration.prototype.timeout + timeoutOffset);
      });
      let handleKeysPromise = modeHandler.handleMultipleKeyEvents(['w', 'w']);
      Promise.all([p1, p2, handleKeysPromise]).then((results) => {
        assert.strictEqual(results[0], 'Half Timeout Finished');
        assert.strictEqual(results[1], 'Timeout plus offset Finished');
        r1Resolve('ww -> dw waits for timeout to finish');
      });
    });

    assert.strictEqual(result1, 'ww -> dw waits for timeout to finish');

    // check that 'www' -> 'dw' and then 'w' waits for timeout to finish
    let result2 = await new Promise((r2Resolve, r2Reject) => {
      let p1 = new Promise((p1Resolve, p1Reject) => {
        setTimeout(() => {
          // Before the timeout finishes it shouldn't have changed anything yet,
          // because it is still waiting for a key or timeout to finish.
          assert.strictEqual(modeHandler.currentMode, Mode.Normal);
          assertEqualLines(['bar biz']);
          assert.strictEqual(
            modeHandler.vimState.cursorStopPosition.character,
            0,
            'Cursor is not on the right position, should be at the start of line'
          );
          p1Resolve('Half Timeout Finished');
        }, Configuration.prototype.timeout / 2);
      });
      let p2 = new Promise((p2Resolve, p2Reject) => {
        setTimeout(() => {
          // After the timeout finishes (plus an offset to be sure it finished)
          // it should have handled the remapping, if it wrongly ran the timeout
          // twice this should fail too.
          assert.strictEqual(modeHandler.currentMode, Mode.Normal);
          assertEqualLines(['biz']);
          assert.strictEqual(
            modeHandler.vimState.cursorStopPosition.character,
            2,
            'Cursor is not on the right position, should be at the end of line'
          );
          p2Resolve('Timeout plus offset Finished');
        }, Configuration.prototype.timeout + timeoutOffset);
      });
      let handleKeysPromise = modeHandler.handleMultipleKeyEvents(['w', 'w', 'w']);
      Promise.all([p1, p2, handleKeysPromise]).then((results) => {
        assert.strictEqual(results[0], 'Half Timeout Finished');
        assert.strictEqual(results[1], 'Timeout plus offset Finished');
        r2Resolve('www -> [dw, w] waits for timeout to finish');
      });
    });

    assert.strictEqual(result2, 'www -> [dw, w] waits for timeout to finish');

    // add new line
    await modeHandler.handleMultipleKeyEvents(['a', '\n', 'foo', '<Esc>']);
    assertEqualLines(['biz', 'foo']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      2,
      'Cursor is not on the right position, should be at the end of line'
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      1,
      'Cursor is not on the right position, should be on second line'
    );

    // check that 'wwww' -> 'dd' doesn't wait for timeout
    let result3 = await new Promise((r3Resolve, r3Reject) => {
      const start = Number(new Date());

      modeHandler.handleMultipleKeyEvents(['w', 'w', 'w', 'w']).then(() => {
        const now = Number(new Date());
        const elapsed = now - start;

        assertEqualLines(['biz']);
        assert.strictEqual(
          modeHandler.vimState.cursorStopPosition.character,
          0,
          'Cursor is not on the right position, shoul be at the start of line'
        );
        assert.strictEqual(
          modeHandler.vimState.cursorStopPosition.line,
          0,
          'Cursor is not on the right position, should be on first line'
        );

        // We check if the elapsed time is less than half the timeout instead of
        // just a few miliseconds to prevent any performance issue marking the
        // test as failed when it would've succeeded. If it is less than half the
        // timeout we can be sure the setTimeout was never ran.
        assert.strictEqual(elapsed < Configuration.prototype.timeout / 2, true);
        r3Resolve("wwww -> dd doesn't wait for timeout to finish");
      });
    });

    assert.strictEqual(result3, "wwww -> dd doesn't wait for timeout to finish");

    // add new line again
    await modeHandler.handleMultipleKeyEvents(['a', '\n', 'foo', '<Esc>']);
    assertEqualLines(['biz', 'foo']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      2,
      'Cursor is not on the right position, should be at the end of line'
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      1,
      'Cursor is not on the right position, should be on second line'
    );

    // check 'bb' -> 'dd' sending each 'b' one by one checking between them to see
    // that the remapping hasn't been handled yet and that the whole process
    // doesn't take the timeout to finish

    const startTime = Number(new Date());

    // send first 'b'
    await modeHandler.handleKeyEvent('b');

    // should be the same
    assertEqualLines(['biz', 'foo']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      2,
      'Cursor is not on the right position, should be at the end of line'
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      1,
      'Cursor is not on the right position, should be on second line'
    );

    // wait for 500 miliseconds (half of timeout) to simulate the time the user takes
    // between presses. Not using a fixed value here in case the default configuration
    // gets changed to use a lower value for timeout.
    await new Promise((wResolve, wReject) => {
      setTimeout(() => {
        wResolve(true);
      }, Configuration.prototype.timeout / 2);
    });

    // send second 'b'
    await modeHandler.handleKeyEvent('b');

    // check result and time elapsed
    const elapsedTime = Number(new Date()) - startTime;

    assertEqualLines(['biz']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      0,
      'Cursor is not on the right position, shoul be at the start of line'
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      0,
      'Cursor is not on the right position, should be on first line'
    );

    // We check if the elapsedTime is less than the timeout minus an offset just
    // to be sure that some performance issue doesn't make the test fail when it
    // would succeed but this might not be foolproof, since we are dealing with
    // times here.
    //
    // Note: I didn't want to use a Promise here again like previously, because I
    // wanted to have both methods of testing (with and without promises) and this
    // method should simulate better the real use from the user.
    assert.strictEqual(elapsedTime < Configuration.prototype.timeout - timeoutOffset, true);
  });
});

/* tslint:enable:no-string-literal */
