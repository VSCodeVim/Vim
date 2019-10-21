import * as assert from 'assert';
import * as vscode from 'vscode';

import { Remappers, Remapper } from '../../src/configuration/remapper';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { Configuration } from '../testConfiguration';
import { assertEqual, setupWorkspace, cleanUpWorkspace } from '../testUtils';
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
      super('configKey', [ModeName.Insert], false);
    }

    public findMatchingRemap(
      userDefinedRemappings: Map<string, IKeyRemapping>,
      inputtedKeys: string[],
      currentMode: ModeName
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
        mode: ModeName.Normal,
        expectedAfter: ':wq',
      },
      {
        // able to match characters in normal mode
        before: 'abc',
        after: ':wq',
        input: 'abc',
        mode: ModeName.Normal,
        expectedAfter: ':wq',
      },
      {
        // able to match with preceding count in normal mode
        before: 'abc',
        after: ':wq',
        input: '0abc',
        mode: ModeName.Normal,
        expectedAfter: ':wq',
      },
      {
        // must match exactly in normal mode
        before: 'abc',
        after: ':wq',
        input: 'defabc',
        mode: ModeName.Normal,
      },
      {
        // able to match in insert mode
        before: 'jj',
        after: '<Esc>',
        input: 'jj',
        mode: ModeName.Insert,
        expectedAfter: '<Esc>',
        expectedAfterMode: ModeName.Normal,
      },
      {
        // able to match with preceding keystrokes in insert mode
        before: 'jj',
        after: '<Esc>',
        input: 'hello world jj',
        mode: ModeName.Insert,
        expectedAfter: '<Esc>',
        expectedAfterMode: ModeName.Normal,
      },
      {
        // able to match with preceding keystrokes in insert mode
        before: 'jj',
        after: '<Esc>',
        input: 'ifoo<Esc>ciwjj',
        mode: ModeName.Insert,
        expectedAfter: '<Esc>',
        expectedAfterMode: ModeName.Normal,
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
            ModeName[testCase.mode]
          }.`
        );
        assert.deepStrictEqual(actual!.after, testCase.expectedAfter.split(''));
      } else {
        assert.strictEqual(actual, undefined);
      }

      if (testCase.expectedAfterMode) {
        assertEqual(modeHandler.currentMode.name, testCase.expectedAfterMode);
        assertEqual(modeHandler.vimState.currentMode, testCase.expectedAfterMode);
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
    vscode.workspace.applyEdit(edit);

    await modeHandler.handleKeyEvent('i');
    assertEqual(modeHandler.currentMode.name, ModeName.Insert);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['j', 'j'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
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
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);

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
    assertEqual(modeHandler.currentMode.name, ModeName.Insert);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['<C-e>'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.strictEqual(actual, true);
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
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
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);

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
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);

    await modeHandler.handleKeyEvent('v');
    assertEqual(modeHandler.currentMode.name, ModeName.Visual);

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

    assert.strictEqual(modeHandler.currentMode.name, ModeName.Normal);

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

    assert.strictEqual(modeHandler.currentMode.name, ModeName.Normal);

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

    assert.strictEqual(modeHandler.currentMode.name, ModeName.Normal);
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    await modeHandler.handleMultipleKeyEvents(['i', 'word1 word2', '<Esc>', '0']);
    assert.strictEqual(modeHandler.currentMode.name, ModeName.Normal);

    // act
    await modeHandler.handleMultipleKeyEvents(['c', 'i', 'w']);
    assert.strictEqual(modeHandler.currentMode.name, ModeName.Insert);
    await modeHandler.handleMultipleKeyEvents(['j', 'j']);

    // assert
    assert.strictEqual(modeHandler.currentMode.name, ModeName.Normal);
  });
});

/* tslint:enable:no-string-literal */
