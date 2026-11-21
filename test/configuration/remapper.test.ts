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
import { newTest } from '../testSimplifier';
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
      super('insertModeKeyBindingsMap', [Mode.Insert]);
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

  suite('jj -> <Esc> through modehandler', () => {
    setup(async () => {
      await setupWorkspace();
    });

    const jjToEsc = { insertModeKeyBindings: [{ before: ['j', 'j'], after: ['<Esc>'] }] };

    newTest({
      title: 'after ciw operator',
      config: jjToEsc,
      start: ['|word1 word2'],
      steps: [
        { keysPressed: 'ciw', end: ['| word2'], endMode: Mode.Insert },
        { keysPressed: 'jj', endMode: Mode.Normal },
      ],
    });

    newTest({
      title: 'after using <Count>i=jj should insert ===',
      config: jjToEsc,
      start: ['word1 |word2'],
      steps: [
        { keysPressed: '3i=', end: ['word1 =|word2'], endMode: Mode.Insert },
        { keysPressed: 'jj', end: ['word1 ==|=word2'], endMode: Mode.Normal },
      ],
    });

    newTest({
      title: 'does not leave behind a j, and does not modify the undo stack',
      config: jjToEsc,
      start: ['fo|o'],
      steps: [
        { keysPressed: 'abar', end: ['foobar|'], endMode: Mode.Insert },
        {
          title: 'does not leave behind a j',
          keysPressed: 'jj',
          end: ['fooba|r'],
          endMode: Mode.Normal,
        },
        { title: 'does not modify the undo stack', keysPressed: 'u', end: ['fo|o'] },
      ],
    });
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

  newTest({
    title: 'ambiguous and potential remaps and timeouts',
    start: ['|foo bar biz'],
    config: {
      normalModeKeyBindings: [
        { before: ['w', 'w'], after: ['d', 'w'] },
        { before: ['w', 'w', 'w', 'w'], after: ['d', 'd'] },
        { before: ['b', 'b'], after: ['d', 'd'] },
      ],
    },
    steps: [
      {
        title: "'ww' waits for the timeout, since it could become 'wwww', then runs 'dw' once",
        keysPressed: 'ww',
        afterTimeout: { end: ['|bar biz'] },
      },
      {
        title: "'www' waits for the timeout, then runs 'dw' and 'w'",
        keysPressed: 'www',
        afterTimeout: { end: ['bi|z'] },
      },
      { keysPressed: 'a\nfoo<Esc>', end: ['biz', 'fo|o'] },
      { title: "'wwww' runs 'dd' without waiting", keysPressed: 'wwww', end: ['|biz'] },
      { keysPressed: '$a\nfoo<Esc>', end: ['biz', 'fo|o'] },
      { title: "'b' waits for another key", keysPressed: 'b' },
      { title: "'bb' runs 'dd' without waiting", keysPressed: 'b', end: ['|biz'] },
    ],
  });
});
