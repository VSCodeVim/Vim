import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { IKeyRemapping } from '../../src/configuration/iconfiguration';
import { Remapper, Remappers } from '../../src/configuration/remapper';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { IRegisterContent, Register } from '../../src/register/register';
import { VimState } from '../../src/state/vimState';
import { StatusBar } from '../../src/statusBar';
import { Configuration } from '../testConfiguration';
import { assertEqualLines, setupWorkspace } from '../testUtils';

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
      before: ['y', 'y'],
      after: ['y', 'l'],
    },
    {
      before: ['e'],
      after: ['$'],
    },
  ];
  const defaultNormalModeKeyBindingsNonRecursive: IKeyRemapping[] = [
    {
      before: ['d'],
      after: ['"', '_', 'd'],
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
      super('configKey', [Mode.Insert]);
    }

    public override findMatchingRemap(
      userDefinedRemappings: Map<string, IKeyRemapping>,
      inputtedKeys: string[],
    ) {
      return super.findMatchingRemap(userDefinedRemappings, inputtedKeys);
    }

    public getRemappedKeySequenceLengthRange(
      remappings: Map<string, IKeyRemapping>,
    ): [number, number] {
      return TestRemapper.getRemappedKeysLengthRange(remappings);
    }
  }

  const setupWithBindings = async ({
    insertModeKeyBindings,
    normalModeKeyBindings,
    normalModeKeyBindingsNonRecursive,
    visualModeKeyBindings,
  }: {
    insertModeKeyBindings?: IKeyRemapping[];
    normalModeKeyBindings?: IKeyRemapping[];
    normalModeKeyBindingsNonRecursive?: IKeyRemapping[];
    visualModeKeyBindings?: IKeyRemapping[];
  }) => {
    await setupWorkspace({
      config: {
        leader: leaderKey,
        insertModeKeyBindings: insertModeKeyBindings || [],
        normalModeKeyBindings: normalModeKeyBindings || [],
        normalModeKeyBindingsNonRecursive: normalModeKeyBindingsNonRecursive || [],
        visualModeKeyBindings: visualModeKeyBindings || [],
      },
    });
    modeHandler = (await getAndUpdateModeHandler())!;
    vimState = modeHandler.vimState;
  };

  test('getLongestedRemappedKeySequence', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
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
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
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
      const actual = testRemapper.findMatchingRemap(remappings, testCase.input.split(''));

      // assert
      if (testCase.expectedAfter) {
        assert(
          actual,
          `Expected remap for before=${testCase.before}. input=${testCase.input}. mode=${
            Mode[testCase.mode]
          }.`,
        );
        assert.deepStrictEqual(actual.after, testCase.expectedAfter.split(''));
      } else {
        assert.strictEqual(actual, undefined);
      }

      if (testCase.expectedAfterMode) {
        assert.strictEqual(modeHandler.vimState.currentMode, testCase.expectedAfterMode);
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
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();

    const edit = new vscode.WorkspaceEdit();
    edit.insert(
      vscode.window.activeTextEditor!.document.uri,
      new vscode.Position(0, 0),
      expectedDocumentContent,
    );
    await vscode.workspace.applyEdit(edit);

    await modeHandler.handleKeyEvent('i');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['j', 'j'], modeHandler);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assert.strictEqual(vscode.window.activeTextEditor!.document.getText(), expectedDocumentContent);
  });

  test('0 -> :wq through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['0'], modeHandler);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();

    const edit = new vscode.WorkspaceEdit();
    edit.insert(
      vscode.window.activeTextEditor!.document.uri,
      new vscode.Position(0, 0),
      expectedDocumentContent,
    );
    await vscode.workspace.applyEdit(edit);

    await modeHandler.handleKeyEvent('i');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['<C-e>'], modeHandler);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assert.strictEqual(vscode.window.activeTextEditor!.document.getText(), expectedDocumentContent);
  });

  test('leader, w -> closeActiveEditor in normal mode through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey([leaderKey, 'w'], modeHandler);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    const remapper = new Remappers();
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    await modeHandler.handleKeyEvent('v');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey([leaderKey, 'c'], modeHandler);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'line1', '<Esc>', '0']);

    const expected = 'text-to-put-on-register';
    let actual: IRegisterContent | undefined;
    Register.put(modeHandler.vimState, expected);
    actual = await Register.get(vimState.recordedState.registerName);
    assert.strictEqual(actual?.text, expected);

    // act
    await modeHandler.handleMultipleKeyEvents(['d', 'd']);

    // assert
    actual = await Register.get(vimState.recordedState.registerName);
    assert.strictEqual(actual?.text, expected);
  });

  test('d -> black hole register delete in normal mode through modehandler', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: defaultInsertModeKeyBindings,
      normalModeKeyBindings: defaultNormalModeKeyBindings,
      normalModeKeyBindingsNonRecursive: defaultNormalModeKeyBindingsNonRecursive,
      visualModeKeyBindings: defaultVisualModeKeyBindings,
    });

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'word1 word2', '<Esc>', '0']);

    const expected = 'text-to-put-on-register';
    let actual: IRegisterContent | undefined;
    Register.put(modeHandler.vimState, expected);
    actual = await Register.get(vimState.recordedState.registerName);
    assert.strictEqual(actual?.text, expected);

    // act
    await modeHandler.handleMultipleKeyEvents(['d', 'w']);

    // assert
    actual = await Register.get(vimState.recordedState.registerName);
    assert.strictEqual(actual?.text, expected);
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

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'word1 word2', '<Esc>', '0']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['c', 'i', 'w']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);

    // assert
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  test('jj -> <Esc> after using <Count>i=jj should insert ===', async () => {
    // setup
    await setupWithBindings({
      insertModeKeyBindings: [
        {
          before: ['j', 'j'],
          after: ['<Esc>'],
        },
      ],
    });

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'word1 word2', '<Esc>', 'b']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['3', 'i', '=']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);

    // assert
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assertEqualLines(['word1 ===word2']);
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

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'foo', '<Esc>']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['a', 'bar']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);
    assertEqualLines(['foobar']);

    // assert
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
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

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'foo', '<Esc>']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['a', 'bar']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);
    assertEqualLines(['foobar']);

    // assert
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    await modeHandler.handleMultipleKeyEvents(['u']);
    assertEqualLines(['foo']);
  });

  test('Recursive remap throws E223', async () => {
    // setup
    await setupWithBindings({
      normalModeKeyBindings: [
        {
          before: ['x'],
          after: ['y'],
        },
        {
          before: ['y'],
          after: ['x'],
        },
      ],
    });

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'foo', '<Esc>']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['x']);

    // assert
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assert.strictEqual(StatusBar.getText(), 'E223: Recursive mapping');
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
          after: ['d', 'd'],
        },
      ],
    });

    // Using the default timeout
    const timeout = new Configuration().timeout;
    // Offset because the timeout might not finish exactly on time.
    const timeoutOffset = 250;

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'foo', ' ', 'bar', ' ', 'biz', '<Esc>', '0']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assertEqualLines(['foo bar biz']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      0,
      'Cursor is not on the right position, should be at the start of line',
    );

    // act and assert

    // check that 'ww' -> 'dw' waits for timeout to finish and timeout isn't run twice
    const result1: string[] = await new Promise(async (r1Resolve, r1Reject) => {
      const p1: Promise<string> = new Promise((p1Resolve, p1Reject) => {
        setTimeout(() => {
          // get line after half timeout finishes
          const currentLine = modeHandler.vimState.document.lineAt(0).text;
          p1Resolve(currentLine);
        }, timeout / 2);
      });
      const p2: Promise<string> = new Promise((p2Resolve, p2Reject) => {
        setTimeout(() => {
          // get line after timeout + offset finishes
          const currentLine = modeHandler.vimState.document.lineAt(0).text;
          p2Resolve(currentLine);
        }, timeout + timeoutOffset);
      });
      const p3: Promise<string> = new Promise(async (p3Resolve, p3Reject) => {
        await modeHandler.handleMultipleKeyEvents(['w', 'w']);
        p3Resolve('modeHandler.handleMultipleKeyEvents finished');
      });
      await Promise.all([p1, p2, p3]).then((results) => {
        r1Resolve(results);
      });
    });

    // Before the timeout finishes it shouldn't have changed anything yet,
    // because it is still waiting for a key or timeout to finish.
    assert.strictEqual(result1[0], 'foo bar biz');

    // After the timeout finishes (plus an offset to be sure it finished)
    // it should have handled the remapping, if it wrongly ran the timeout
    // twice this should fail too.
    assert.strictEqual(result1[1], 'bar biz');

    // check that 'www' -> 'dw' and then 'w' waits for timeout to finish
    const result2: Array<{ line: string; position: number }> = await new Promise(
      async (r2Resolve, r2Reject) => {
        const p1: Promise<{ line: string; position: number }> = new Promise(
          (p1Resolve, p1Reject) => {
            setTimeout(() => {
              // get line and cursor character after half timeout finishes
              const currentLine = modeHandler.vimState.document.lineAt(0).text;
              const cursorCharacter = modeHandler.vimState.cursorStopPosition.character;
              p1Resolve({ line: currentLine, position: cursorCharacter });
            }, timeout / 2);
          },
        );
        const p2: Promise<{ line: string; position: number }> = new Promise(
          (p2Resolve, p2Reject) => {
            setTimeout(() => {
              // get line and cursor character after timeout + offset finishes
              const currentLine = modeHandler.vimState.document.lineAt(0).text;
              const cursorCharacter = modeHandler.vimState.cursorStopPosition.character;
              p2Resolve({ line: currentLine, position: cursorCharacter });
            }, timeout + timeoutOffset);
          },
        );
        const p3: Promise<{ line: string; position: number }> = new Promise(
          async (p3Resolve, p3Reject) => {
            await modeHandler.handleMultipleKeyEvents(['w', 'w', 'w']);
            p3Resolve({ line: 'modeHandler.handleMultipleKeyEvents finished', position: -1 });
          },
        );
        await Promise.all([p1, p2, p3]).then((results) => {
          r2Resolve(results);
        });
      },
    );

    // Before the timeout finishes it shouldn't have changed anything yet,
    // because it is still waiting for a key or timeout to finish.
    assert.strictEqual(result2[0].line, 'bar biz');
    assert.strictEqual(
      result2[0].position,
      0,
      'Cursor is not on the right position, should be at the start of line',
    );

    // After the timeout finishes (plus an offset to be sure it finished)
    // it should have handled the remapping, if it wrongly ran the timeout
    // twice this should fail too.
    assert.strictEqual(result2[1].line, 'biz');
    assert.strictEqual(
      result2[1].position,
      2,
      'Cursor is not on the right position, should be at the end of line',
    );

    // add new line
    await modeHandler.handleMultipleKeyEvents(['a', '\n', 'foo', '<Esc>']);
    assertEqualLines(['biz', 'foo']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      2,
      'Cursor is not on the right position, should be at the end of line',
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      1,
      'Cursor is not on the right position, should be on second line',
    );

    // check that 'wwww' -> 'dd' doesn't wait for timeout
    const result3 = await new Promise(async (r3Resolve, r3Reject) => {
      const start = Number(new Date());

      await modeHandler.handleMultipleKeyEvents(['w', 'w', 'w', 'w']).then(() => {
        const now = Number(new Date());
        const elapsed = now - start;

        assertEqualLines(['biz']);
        assert.strictEqual(
          modeHandler.vimState.cursorStopPosition.character,
          0,
          'Cursor is not on the right position, shoul be at the start of line',
        );
        assert.strictEqual(
          modeHandler.vimState.cursorStopPosition.line,
          0,
          'Cursor is not on the right position, should be on first line',
        );

        // We check if the elapsed time is less than half the timeout instead of
        // just a few miliseconds to prevent any performance issue marking the
        // test as failed when it would've succeeded. If it is less than half the
        // timeout we can be sure the setTimeout was never ran.
        assert.strictEqual(elapsed < timeout / 2, true);
        r3Resolve("wwww -> dd doesn't wait for timeout to finish");
      });
    });

    assert.strictEqual(result3, "wwww -> dd doesn't wait for timeout to finish");

    // add new line again
    await modeHandler.handleMultipleKeyEvents(['$', 'a', '\n', 'foo', '<Esc>']);
    assertEqualLines(['biz', 'foo']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      2,
      'Cursor is not on the right position, should be at the end of line',
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      1,
      'Cursor is not on the right position, should be on second line',
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
      'Cursor is not on the right position, should be at the end of line',
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      1,
      'Cursor is not on the right position, should be on second line',
    );

    // wait for 500 miliseconds (half of timeout) to simulate the time the user takes
    // between presses. Not using a fixed value here in case the default configuration
    // gets changed to use a lower value for timeout.
    const waited: boolean = await new Promise((wResolve, wReject) => {
      setTimeout(() => {
        wResolve(true);
      }, timeout / 2);
    });
    assert.strictEqual(waited, true);

    // send second 'b'
    await modeHandler.handleKeyEvent('b');

    // check result and time elapsed
    const elapsedTime = Number(new Date()) - startTime;

    assertEqualLines(['biz']);
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      0,
      'Cursor is not on the right position, shoul be at the start of line',
    );
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.line,
      0,
      'Cursor is not on the right position, should be on first line',
    );

    // We check if the elapsedTime is less than the timeout minus an offset just
    // to be sure that some performance issue doesn't make the test fail when it
    // would succeed but this might not be foolproof, since we are dealing with
    // times here.
    //
    // Note: I didn't want to use a Promise here again like previously, because I
    // wanted to have both methods of testing (with and without promises) and this
    // method should simulate better the real use from the user.
    assert.strictEqual(elapsedTime < timeout - timeoutOffset, true);
  });
});
