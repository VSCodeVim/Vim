import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../extension';
import { Position } from '../src/common/motion/position';
import { Globals } from '../src/globals';
import { Mode } from '../src/mode/mode';
import { ModeHandler } from '../src/mode/modeHandler';
import { TextEditor } from '../src/textEditor';
import { assertEqualLines, reloadConfiguration } from './testUtils';
import { globalState } from '../src/state/globalState';
import { IConfiguration } from '../src/configuration/iconfiguration';

export function getTestingFunctions() {
  function getNiceStack(stack: string | undefined): string {
    return stack ? stack.split('\n').splice(2, 1).join('\n') : 'no stack available :(';
  }

  function newTestGeneric(
    testObj: ITestObject,
    testFunc: Mocha.TestFunction | Mocha.ExclusiveTestFunction | Mocha.PendingTestFunction
  ): void {
    const stack = new Error().stack;
    const niceStack = getNiceStack(stack);

    testFunc(testObj.title, async () => {
      const prevConfig = { ...Globals.mockConfiguration };
      try {
        if (testObj.config) {
          for (const key in testObj.config) {
            if (testObj.config.hasOwnProperty(key)) {
              const value = testObj.config[key];
              Globals.mockConfiguration[key] = value;
            }
          }
          await reloadConfiguration();
        }
        const mh = await getAndUpdateModeHandler();
        await testIt(mh, testObj);
      } catch (reason) {
        reason.stack = niceStack;
        throw reason;
      } finally {
        if (testObj.config) {
          Globals.mockConfiguration = prevConfig;
          await reloadConfiguration();
        }
      }
    });
  }

  const newTest = (testObj: ITestObject) => newTestGeneric(testObj, test);

  const newTestOnly = (testObj: ITestObject) => {
    console.warn('!!! Running single test !!!');
    return newTestGeneric(testObj, test.only);
  };

  const newTestSkip = (testObj: ITestObject) => newTestGeneric(testObj, test.skip);

  return {
    newTest,
    newTestOnly,
    newTestSkip,
  };
}

interface ITestObject {
  title: string;
  config?: Partial<IConfiguration>;
  start: string[];
  keysPressed: string;
  end: string[];
  endMode?: Mode;
  jumps?: string[];
}

class TestObjectHelper {
  /**
   * Position that the test says that the cursor starts at.
   */
  startPosition = new Position(0, 0);

  /**
   * Position that the test says that the cursor ends at.
   */
  endPosition = new Position(0, 0);

  private _isValid = false;
  private _testObject: ITestObject;

  constructor(_testObject: ITestObject) {
    this._testObject = _testObject;

    this._parse(_testObject);
  }

  public get isValid(): boolean {
    return this._isValid;
  }

  private _setStartCursorPosition(lines: string[]): boolean {
    const result = this._getCursorPosition(lines);
    this.startPosition = result.position;
    return result.success;
  }

  private _setEndCursorPosition(lines: string[]): boolean {
    const result = this._getCursorPosition(lines);
    this.endPosition = result.position;
    return result.success;
  }

  private _getCursorPosition(lines: string[]): { success: boolean; position: Position } {
    const ret = { success: false, position: new Position(0, 0) };
    for (let i = 0; i < lines.length; i++) {
      const columnIdx = lines[i].indexOf('|');
      if (columnIdx >= 0) {
        ret.position = new Position(i, columnIdx);
        ret.success = true;
      }
    }

    return ret;
  }

  private _parse(t: ITestObject): void {
    this._isValid = this._setStartCursorPosition(t.start) && this._setEndCursorPosition(t.end);
  }

  public asVimInputText(): string[] {
    const ret = 'i' + this._testObject.start.join('\n').replace('|', '');
    return ret.split('');
  }

  public asVimOutputText(): string[] {
    const ret = this._testObject.end.slice(0);
    ret[this.endPosition.line] = ret[this.endPosition.line].replace('|', '');
    return ret;
  }

  /**
   * Returns a sequence of Vim movement characters 'hjkl' as a string array
   * which will move the cursor to the start position given in the test.
   */
  public getKeyPressesToMoveToStartPosition(): string[] {
    let ret = '';
    const linesToMove = this.startPosition.line;

    const cursorPosAfterEsc =
      this._testObject.start[this._testObject.start.length - 1].replace('|', '').length - 1;
    const numCharsInCursorStartLine =
      this._testObject.start[this.startPosition.line].replace('|', '').length - 1;
    const charactersToMove = this.startPosition.character;

    if (linesToMove > 0) {
      ret += Array(linesToMove + 1).join('j');
    } else if (linesToMove < 0) {
      ret += Array(Math.abs(linesToMove) + 1).join('k');
    }

    if (charactersToMove > 0) {
      ret += Array(charactersToMove + 1).join('l');
    } else if (charactersToMove < 0) {
      ret += Array(Math.abs(charactersToMove) + 1).join('h');
    }

    return ret.split('');
  }
}

/**
 * Tokenize a string like "abc<Esc>d<C-c>" into ["a", "b", "c", "<Esc>", "d", "<C-c>"]
 */
function tokenizeKeySequence(sequence: string): string[] {
  let isBracketedKey = false;
  let key = '';
  const result: string[] = [];

  // no close bracket, probably trying to do a left shift, take literal
  // char sequence
  function rawTokenize(characters: string): void {
    for (const char of characters) {
      result.push(char);
    }
  }

  for (const char of sequence) {
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

async function testIt(modeHandler: ModeHandler, testObj: ITestObject): Promise<void> {
  modeHandler.vimState.editor = vscode.window.activeTextEditor!;

  const helper = new TestObjectHelper(testObj);
  const jumpTracker = globalState.jumpTracker;

  // Don't try this at home, kids.
  (modeHandler as any).vimState.cursorPosition = new Position(0, 0);

  await modeHandler.handleKeyEvent('<Esc>');

  // Insert all the text as a single action.
  await modeHandler.vimState.editor.edit((builder) => {
    builder.insert(new Position(0, 0), testObj.start.join('\n').replace('|', ''));
  });

  await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);

  // Since we bypassed VSCodeVim to add text,
  // we need to tell the history tracker that we added it.
  modeHandler.vimState.historyTracker.addChange();
  modeHandler.vimState.historyTracker.finishCurrentStep();

  // move cursor to start position using 'hjkl'
  await modeHandler.handleMultipleKeyEvents(helper.getKeyPressesToMoveToStartPosition());

  Globals.mockModeHandler = modeHandler;

  let keysPressed = testObj.keysPressed;
  if (process.platform === 'win32') {
    keysPressed = keysPressed.replace(/\\n/g, '\\r\\n');
  }

  jumpTracker.clearJumps();

  // Assumes key presses are single characters for now
  await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(keysPressed));

  // Check valid test object input
  assert(helper.isValid, "Missing '|' in test object.");

  // Check given end output is correct
  const lines = helper.asVimOutputText();
  assertEqualLines(lines);

  // Check final cursor position
  const actualPosition = TextEditor.getSelection().start;
  const expectedPosition = helper.endPosition;
  assert.deepStrictEqual(
    { line: actualPosition.line, character: actualPosition.character },
    { line: expectedPosition.line, character: expectedPosition.character },
    'Cursor position is wrong.'
  );

  // endMode: check end mode is correct if given
  if (testObj.endMode !== undefined) {
    const actualMode = Mode[modeHandler.currentMode].toUpperCase();
    const expectedMode = Mode[testObj.endMode].toUpperCase();
    assert.strictEqual(actualMode, expectedMode, "Didn't enter correct mode.");
  }

  // jumps: check jumps are correct if given
  if (testObj.jumps !== undefined) {
    assert.deepEqual(
      jumpTracker.jumps.map((j) => lines[j.position.line] || '<MISSING>'),
      testObj.jumps.map((t) => t.replace('|', '')),
      'Incorrect jumps found'
    );

    const stripBar = (text: string | undefined) => (text ? text.replace('|', '') : text);
    const actualJumpPosition =
      (jumpTracker.currentJump && lines[jumpTracker.currentJump.position.line]) || '<FRONT>';
    const expectedJumpPosition = stripBar(testObj.jumps.find((t) => t.includes('|'))) || '<FRONT>';

    assert.deepEqual(
      actualJumpPosition.toString(),
      expectedJumpPosition.toString(),
      'Incorrect jump position found'
    );
  }
}

export { ITestObject, testIt };
