import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import * as os from 'os';
import { Position } from 'vscode';
import { IConfiguration, IKeyRemapping } from '../src/configuration/iconfiguration';
import { VimrcImpl } from '../src/configuration/vimrc';
import { vimrcKeyRemappingBuilder } from '../src/configuration/vimrcKeyRemappingBuilder';
import { Globals } from '../src/globals';
import { Mode } from '../src/mode/mode';
import { ModeHandler } from '../src/mode/modeHandler';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { Register } from '../src/register/register';
import { globalState } from '../src/state/globalState';
import { StatusBar } from '../src/statusBar';
import { TextEditor } from '../src/textEditor';
import { assertEqualLines, reloadConfiguration, setupWorkspace } from './testUtils';

function newTestGeneric<T extends ITestObject | ITestWithRemapsObject>(
  testObj: T,
  testFunc: Mocha.TestFunction | Mocha.ExclusiveTestFunction | Mocha.PendingTestFunction,
  innerTest: (testObj: T) => Promise<ModeHandler>,
): void {
  const stack = ((s) => (s ? s.split('\n').splice(2, 1).join('\n') : 'no stack available :('))(
    new Error().stack,
  );

  testFunc(testObj.title, async () => {
    const prevConfig = { ...Globals.mockConfiguration };
    try {
      if (testObj.config) {
        Object.assign(Globals.mockConfiguration, testObj.config);
        await reloadConfiguration();
      }
      await innerTest(testObj);
    } catch (reason) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      reason.stack = stack;
      throw reason;
    } finally {
      if (testObj.config) {
        Globals.mockConfiguration = prevConfig;
        await reloadConfiguration();
      }
    }
  });
}

export const newTest = (testObj: ITestObject) => newTestGeneric(testObj, test, testIt);

export const newTestOnly = (testObj: ITestObject) => {
  console.warn('!!! Running single test !!!');
  return newTestGeneric(testObj, test.only, testIt);
};

export const newTestSkip = (testObj: ITestObject, skipCondition: boolean = true) =>
  newTestGeneric(testObj, skipCondition ? test.skip : test, testIt);

export const newTestWithRemaps = (testObj: ITestWithRemapsObject) =>
  newTestGeneric(testObj, test, testItWithRemaps);
export const newTestWithRemapsOnly = (testObj: ITestWithRemapsObject) => {
  console.warn('!!! Running single test !!!');
  return newTestGeneric(testObj, test.only, testItWithRemaps);
};
export const newTestWithRemapsSkip = (testObj: ITestWithRemapsObject) =>
  newTestGeneric(testObj, test.skip, testItWithRemaps);

interface ITestObject {
  title: string;
  config?: Partial<IConfiguration>;
  editorOptions?: vscode.TextEditorOptions;
  start: string[];
  keysPressed: string;
  end: string[];
  endMode?: Mode;
  registers?: { [name: string]: string | undefined };
  statusBar?: string;
  jumps?: string[];
  stub?: {
    stubClass: any;
    methodName: string;
    returnValue: any;
  };
  saveDocBeforeTest?: boolean;
}

type Step = {
  title?: string;
  keysPressed: string;
  stepResult: {
    end: string[];
    endAfterTimeout?: string[];
    endMode?: Mode;
    endModeAfterTimeout?: Mode;
  };
};

interface ITestWithRemapsObject {
  title: string;
  config?: Partial<IConfiguration>;
  start: string[];
  remaps?:
    | {
        normalModeKeyBindings?: IKeyRemapping[];
        normalModeKeyBindingsNonRecursive?: IKeyRemapping[];
        insertModeKeyBindings?: IKeyRemapping[];
        insertModeKeyBindingsNonRecursive?: IKeyRemapping[];
        visualModeKeyBindings?: IKeyRemapping[];
        visualModeKeyBindingsNonRecursive?: IKeyRemapping[];
        operatorPendingModeKeyBindings?: IKeyRemapping[];
        operatorPendingModeKeyBindingsNonRecursive?: IKeyRemapping[];
      }
    | string[];
  steps: Step[];
}

class DocState {
  public static parse(lines: string[]): DocState {
    lines = [...lines];
    const cursor = (() => {
      for (let i = 0; i < lines.length; i++) {
        const columnIdx = lines[i].indexOf('|');
        if (columnIdx >= 0) {
          lines[i] = lines[i].replace('|', '');
          return new Position(i, columnIdx);
        }
      }

      throw new Error("Missing '|' in test object");
    })();
    return new DocState(cursor, lines);
  }

  constructor(cursor: Position, lines: string[]) {
    this.cursor = cursor;
    this.lines = lines;
  }

  public readonly cursor: Position; // TODO(#4582): support multiple cursors
  public readonly lines: string[];
}

/**
 * Tokenize a string like `"abc<Esc>d<C-c>"` into `["a", "b", "c", "<Esc>", "d", "<C-c>"]`
 */
function tokenizeKeySequence(sequence: string): string[] {
  let isBracketedKey = false;
  let key = '';
  const result: string[] = [];

  // no close bracket, probably trying to do a left shift, take literal
  // char sequence
  const rawTokenize = (characters: string): void => {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < characters.length; i++) {
      result.push(characters[i]);
    }
  };

  // don't use a for of here, since the iterator doesn't split surrogate pairs
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < sequence.length; i++) {
    const char = sequence[i];

    key += char;

    if (char === '<') {
      if (isBracketedKey) {
        rawTokenize(key.slice(0, key.length - 1));
        key = '<';
      } else {
        isBracketedKey = true;
      }
    }

    if (char === '>') {
      isBracketedKey = false;
    }

    if (isBracketedKey) {
      continue;
    }

    result.push(key);
    key = '';
  }

  if (isBracketedKey) {
    rawTokenize(key);
  }

  return result;
}

async function testIt(testObj: ITestObject): Promise<ModeHandler> {
  if (vscode.window.activeTextEditor === undefined) {
    await setupWorkspace({
      config: testObj.config,
    });
  }

  const editor = vscode.window.activeTextEditor;
  assert(editor, 'Expected an active editor');

  const start = DocState.parse(testObj.start);
  const end = DocState.parse(testObj.end);

  if (testObj.editorOptions) {
    editor.options = testObj.editorOptions;
  }

  // Initialize the editor with the starting text and cursor selection
  assert.ok(
    await editor.edit((builder) => {
      builder.replace(
        new vscode.Range(new Position(0, 0), TextEditor.getDocumentEnd(editor.document)),
        start.lines.join('\n'),
      );
    }),
    'Edit failed',
  );
  if (testObj.saveDocBeforeTest) {
    assert.ok(await editor.document.save(), 'Save failed');
  }
  editor.selections = [new vscode.Selection(start.cursor, start.cursor)];

  // Generate a brand new ModeHandler for this editor
  ModeHandlerMap.clear();
  const [modeHandler, _] = await ModeHandlerMap.getOrCreate(editor);

  globalState.lastInvokedMacro = undefined;
  globalState.jumpTracker.clearJumps();

  Register.clearAllRegisters();

  if (testObj.stub) {
    const confirmStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(testObj.stub.stubClass.prototype, testObj.stub.methodName)
      .resolves(testObj.stub.returnValue);
    await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(testObj.keysPressed), false);
    confirmStub.restore();
  } else {
    // Assumes key presses are single characters for now
    await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(testObj.keysPressed), false);
  }

  // Check given end output is correct
  assertEqualLines(end.lines);

  // Check final cursor position
  const actualPosition = modeHandler.vimState.editor.selection.start;
  const expectedPosition = end.cursor;
  assert.deepStrictEqual(
    { line: actualPosition.line, character: actualPosition.character },
    { line: expectedPosition.line, character: expectedPosition.character },
    'Cursor position is wrong.',
  );

  if (testObj.endMode !== undefined) {
    assert.strictEqual(
      Mode[modeHandler.vimState.currentMode],
      Mode[testObj.endMode],
      "Didn't enter correct mode.",
    );
  }

  if (testObj.registers !== undefined) {
    for (const reg in testObj.registers) {
      if (testObj.registers[reg] !== undefined) {
        assert.strictEqual((await Register.get(reg))?.text, testObj.registers[reg]);
      } else {
        assert.strictEqual(await Register.get(reg), undefined);
      }
    }
  }

  if (testObj.statusBar !== undefined) {
    assert.strictEqual(
      StatusBar.getText(),
      testObj.statusBar.replace('{FILENAME}', modeHandler.vimState.document.fileName),
      'Status bar text is wrong.',
    );
  }

  // jumps: check jumps are correct if given
  if (testObj.jumps !== undefined) {
    // TODO: Jumps should be specified by Positions, not line contents
    assert.deepStrictEqual(
      globalState.jumpTracker.jumps.map((j) => end.lines[j.position.line] || '<MISSING>'),
      testObj.jumps.map((t) => t.replace('|', '')),
      'Incorrect jumps found',
    );

    const stripBar = (text: string | undefined) => (text ? text.replace('|', '') : text);
    const actualJumpPosition =
      (globalState.jumpTracker.currentJump &&
        end.lines[globalState.jumpTracker.currentJump.position.line]) ||
      '<FRONT>';
    const expectedJumpPosition = stripBar(testObj.jumps.find((t) => t.includes('|'))) || '<FRONT>';

    assert.deepStrictEqual(
      actualJumpPosition,
      expectedJumpPosition,
      'Incorrect jump position found',
    );
  }

  return modeHandler;
}

async function testItWithRemaps(testObj: ITestWithRemapsObject): Promise<ModeHandler> {
  const editor = vscode.window.activeTextEditor;
  assert(editor, 'Expected an active editor');

  // Initialize the editor with the starting text and cursor selection
  await editor.edit((builder) => {
    builder.insert(new Position(0, 0), testObj.start.join('\n').replace('|', ''));
  });
  {
    const start = DocState.parse(testObj.start);
    editor.selections = [new vscode.Selection(start.cursor, start.cursor)];
  }

  // Generate a brand new ModeHandler for this editor
  ModeHandlerMap.clear();
  const [modeHandler, _] = await ModeHandlerMap.getOrCreate(editor);

  // Change remappings
  if (testObj.remaps) {
    if (!(testObj.remaps instanceof Array)) {
      Globals.mockConfiguration.normalModeKeyBindings = testObj.remaps?.normalModeKeyBindings ?? [];
      Globals.mockConfiguration.normalModeKeyBindingsNonRecursive =
        testObj.remaps?.normalModeKeyBindingsNonRecursive ?? [];
      Globals.mockConfiguration.insertModeKeyBindings = testObj.remaps?.insertModeKeyBindings ?? [];
      Globals.mockConfiguration.insertModeKeyBindingsNonRecursive =
        testObj.remaps?.insertModeKeyBindingsNonRecursive ?? [];
      Globals.mockConfiguration.visualModeKeyBindings = testObj.remaps?.visualModeKeyBindings ?? [];
      Globals.mockConfiguration.visualModeKeyBindingsNonRecursive =
        testObj.remaps?.visualModeKeyBindingsNonRecursive ?? [];
      Globals.mockConfiguration.operatorPendingModeKeyBindings =
        testObj.remaps?.operatorPendingModeKeyBindings ?? [];
      Globals.mockConfiguration.operatorPendingModeKeyBindingsNonRecursive =
        testObj.remaps?.operatorPendingModeKeyBindingsNonRecursive ?? [];
    } else {
      await parseVimRCMappings(testObj.remaps);
    }
  }

  const timeout = Globals.mockConfiguration.timeout;
  const timeoutOffset = timeout / 2;
  // Globals.mockConfiguration.timeout = timeout;

  await reloadConfiguration();

  for (const { step, index } of testObj.steps.map((value, i) => ({ step: value, index: i }))) {
    const resolvedStep = (() => {
      let start: DocState;
      if (index === 0) {
        start = DocState.parse(testObj.start);
      } else {
        const prevStepResult = testObj.steps[index - 1].stepResult;
        start = DocState.parse(prevStepResult.endAfterTimeout ?? prevStepResult.end);
      }

      const stepResult = testObj.steps[index].stepResult;
      return {
        start,
        end: DocState.parse(stepResult.end),
        endAfterTimeout: stepResult.endAfterTimeout
          ? DocState.parse(stepResult.endAfterTimeout)
          : undefined,
      };
    })();

    const stepTitleOrIndex = step.title ? `nr. ${index} - "${step.title}"` : index;

    const jumpTracker = globalState.jumpTracker;
    jumpTracker.clearJumps();

    // Checks if this step should wait for timeout or not
    const waitsForTimeout = step.stepResult.endAfterTimeout !== undefined;

    type ResultType = {
      lines: string;
      position: vscode.Position;
      endMode: Mode;
    };

    const p1 = () => {
      return new Promise<ResultType>((p1Resolve, p1Reject) => {
        setTimeout(() => {
          // Get lines, position and mode after half timeout finishes
          p1Resolve({
            lines: modeHandler.vimState.document.getText(),
            position: modeHandler.vimState.editor.selection.start,
            endMode: modeHandler.vimState.currentMode,
          });
        }, timeoutOffset);
      });
    };

    const p2 = () => {
      return new Promise<ResultType | undefined>((p2Resolve, p2Reject) => {
        if (waitsForTimeout) {
          setTimeout(async () => {
            if (modeHandler.remapState.isCurrentlyPerformingRemapping) {
              // Performing a remapping, which means it started at the right time but it has not
              // finished yet (maybe the remapping has a lot of keys to handle) so we wait for the
              // remapping to finish
              const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
              while (modeHandler.remapState.isCurrentlyPerformingRemapping) {
                // Wait a little bit longer here because the currently performing remap might have
                // some remaining keys to handle after it finishes performing the remap and there
                // might even be there some keys still to be sent that might create another remap.
                // Example: if you have and ambiguous remap like 'ab -> abcd' and 'abc -> abcdef'
                // and an insert remap like 'jj -> <Esc>' and you press 'abjj' the first 'j' breaks
                // the ambiguity and makes the remap start performing, but when the remap finishes
                // performing there is still the 'jj' to be handled and remapped.
                await wait(10);
              }
            }
            // Get lines, position and mode after timeout + offset finishes
            p2Resolve({
              lines: modeHandler.vimState.document.getText(),
              position: modeHandler.vimState.editor.selection.start,
              endMode: modeHandler.vimState.currentMode,
            });
          }, timeout + timeoutOffset);
        } else {
          p2Resolve(undefined);
        }
      });
    };

    // Assumes key presses are single characters for now
    await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(step.keysPressed), false);

    // Only start the end check promises after the keys were handled to make sure they don't
    // finish before all the keys are pressed. The keys handler above will resolve when the
    // keys are handled even if it buffered some keys to wait for a timeout.
    const [result1, result2] = await Promise.all([p1(), p2()]);

    // Lines after keys pressed but before any timeout

    // Check given end output is correct
    assert.strictEqual(
      result1.lines,
      resolvedStep.end.lines.join(os.EOL),
      `Document content does not match on step ${stepTitleOrIndex}.`,
    );

    // Check end cursor position
    const actualEndPosition = result1.position;
    const expectedEndPosition = resolvedStep.end.cursor;
    assert.deepStrictEqual(
      { line: actualEndPosition.line, character: actualEndPosition.character },
      { line: expectedEndPosition.line, character: expectedEndPosition.character },
      `Cursor position is wrong on step ${stepTitleOrIndex}.`,
    );

    // endMode: check end mode is correct if given
    const expectedEndMode = step.stepResult.endMode;
    if (expectedEndMode !== undefined) {
      assert.strictEqual(
        Mode[result1.endMode],
        Mode[expectedEndMode],
        `Didn't enter correct mode on step ${stepTitleOrIndex}.`,
      );
    }

    if (result2) {
      // After the timeout finishes (plus an offset to be sure it finished)
      assert.notStrictEqual(result2, undefined);

      // Check given endAfterTimeout output is correct
      assert.strictEqual(
        result2.lines,
        resolvedStep.endAfterTimeout?.lines.join(os.EOL),
        `Document content does not match on step ${stepTitleOrIndex} after timeout.`,
      );

      // Check endAfterTimeout cursor position
      const actualEndAfterTimeoutPosition = result2.position;
      const expectedEndAfterTimeoutPosition = resolvedStep.endAfterTimeout!.cursor;
      assert.deepStrictEqual(
        {
          line: actualEndAfterTimeoutPosition.line,
          character: actualEndAfterTimeoutPosition.character,
        },
        {
          line: expectedEndAfterTimeoutPosition.line,
          character: expectedEndAfterTimeoutPosition.character,
        },
        `Cursor position is wrong on step ${stepTitleOrIndex} after Timeout.`,
      );

      // endMode: check end mode is correct if given
      const expectedEndAfterTimeoutMode = step.stepResult.endModeAfterTimeout;
      if (expectedEndAfterTimeoutMode !== undefined) {
        assert.strictEqual(
          Mode[result2.endMode],
          Mode[expectedEndAfterTimeoutMode],
          `Didn't enter correct mode on step ${stepTitleOrIndex} after Timeout.`,
        );
      }
    }
  }
  return modeHandler;
}

async function parseVimRCMappings(lines: string[]): Promise<void> {
  const config = Globals.mockConfiguration;

  // Remove all the old remappings from the .vimrc file
  VimrcImpl.removeAllRemapsFromConfig(config);

  const vscodeCommands = await vscode.commands.getCommands();
  // Add the new remappings
  for (const line of lines) {
    const remap = await vimrcKeyRemappingBuilder.build(line, vscodeCommands);
    if (remap) {
      VimrcImpl.addRemapToConfig(config, remap);
      continue;
    }
    const unremap = await vimrcKeyRemappingBuilder.buildUnmapping(line);
    if (unremap) {
      VimrcImpl.removeRemapFromConfig(config, unremap);
      continue;
    }
    const clearRemap = await vimrcKeyRemappingBuilder.buildClearMapping(line);
    if (clearRemap) {
      VimrcImpl.clearRemapsFromConfig(config, clearRemap);
      continue;
    }
  }
}

export { testIt };
export type { ITestObject };
