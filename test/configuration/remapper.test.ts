import * as assert from 'assert';
import * as vscode from 'vscode';

import { Remappers, Remapper } from '../../src/configuration/remapper';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { Configuration } from '../testConfiguration';
import { assertEqual, setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { IKeyRemapping } from '../../src/configuration/iconfiguration';
import { getAndUpdateModeHandler } from '../../extension';

/* tslint:disable:no-string-literal */

suite('Remapper', () => {
  let modeHandler: ModeHandler;
  const leaderKey = '\\';
  const insertModeKeyBindings: IKeyRemapping[] = [
    {
      before: ['j', 'j'],
      after: ['<Esc>'],
    },
  ];
  const normalModeKeyBindings: IKeyRemapping[] = [
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
  ];
  const visualModeKeyBindings: IKeyRemapping[] = [
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
      userDefinedRemappings: { [key: string]: IKeyRemapping },
      inputtedKeys: string[],
      currentMode: ModeName
    ) {
      return TestRemapper._findMatchingRemap(userDefinedRemappings, inputtedKeys, currentMode);
    }

    public getRemappedKeySequenceLengthRange(remappings: {
      [key: string]: IKeyRemapping;
    }): [number, number] {
      return TestRemapper._getRemappedKeysLengthRange(remappings);
    }
  }

  setup(async () => {
    let configuration = new Configuration();
    configuration.leader = leaderKey;
    configuration.insertModeKeyBindings = insertModeKeyBindings;
    configuration.normalModeKeyBindings = normalModeKeyBindings;
    configuration.visualModeKeyBindings = visualModeKeyBindings;

    await setupWorkspace(configuration);
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('getLongestedRemappedKeySequence', async () => {
    // setup
    let remappings: { [key: string]: IKeyRemapping } = {
      abc: { before: ['a', 'b', 'c'] },
      de: { before: ['d', 'e'] },
      f: { before: ['f'] },
    };

    // act
    const testRemapper = new TestRemapper();
    const actual = testRemapper.getRemappedKeySequenceLengthRange(remappings);

    // assert
    assert.equal(actual[0], 1);
    assert.equal(actual[1], 3);
  });

  test('getMatchingRemap', async () => {
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
      },
      {
        // able to match with preceding keystrokes in insert mode
        before: 'jj',
        after: '<Esc>',
        input: 'hello world jj',
        mode: ModeName.Insert,
        expectedAfter: '<Esc>',
      },
    ];

    for (const testCase of testCases) {
      // setup
      let remappings: { [key: string]: IKeyRemapping } = {};
      remappings[testCase.before] = {
        before: testCase.before.split(''),
        after: testCase.after.split(''),
      };

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
            testCase.mode
          }.`
        );
        assert.deepEqual(actual!.after, testCase.expectedAfter.split(''));
      } else {
        assert.equal(actual, undefined);
      }
    }
  });

  test('jj -> <Esc> through modehandler', async () => {
    const expectedDocumentContent = 'lorem ipsum';

    // setup
    let remapper = new Remappers();

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
    assert.equal(actual, true);
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
    assert.equal(vscode.window.activeTextEditor!.document.getText(), expectedDocumentContent);
  });

  test('0 -> :wq through modehandler', async () => {
    // setup
    let remapper = new Remappers();
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey(['0'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.equal(actual, true);
    assert.equal(vscode.window.visibleTextEditors.length, 0);
  });

  test('leader, w -> closeActiveEditor in normal mode through modehandler', async () => {
    // setup
    let remapper = new Remappers();
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);

    // act
    let actual = false;
    try {
      actual = await remapper.sendKey([leaderKey, 'w'], modeHandler, modeHandler.vimState);
    } catch (e) {
      assert.fail(e);
    }

    // assert
    assert.equal(actual, true);
    assert.equal(vscode.window.visibleTextEditors.length, 0);
  });

  test('leader, c -> closeActiveEditor in visual mode through modehandler', async () => {
    // setup
    let remapper = new Remappers();
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
    assert.equal(actual, true);
    assert.equal(vscode.window.visibleTextEditors.length, 0);
  });
});

/* tslint:enable:no-string-literal */
