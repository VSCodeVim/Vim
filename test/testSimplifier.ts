import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../extension';
import { Position } from '../src/common/motion/position';
import { Globals } from '../src/globals';
import { ModeName } from '../src/mode/mode';
import { ModeHandler } from '../src/mode/modeHandler';
import { TextEditor } from '../src/textEditor';
import { waitForCursorSync } from '../src/util/util';
import { assertEqualLines } from './testUtils';
import { globalState } from '../src/state/globalState';

export function getTestingFunctions() {
  const getNiceStack = (stack: string | undefined): string => {
    return stack
      ? stack
          .split('\n')
          .splice(2, 1)
          .join('\n')
      : 'no stack available :(';
  };

  const newTest = (testObj: ITestObject): void => {
    const stack = new Error().stack;
    const niceStack = getNiceStack(stack);

    test(testObj.title, async () =>
      testIt
        .bind(null, await getAndUpdateModeHandler())(testObj)
        .catch((reason: Error) => {
          reason.stack = niceStack;
          throw reason;
        })
    );
  };

  const newTestOnly = (testObj: ITestObject): void => {
    console.log('!!! Running single test !!!');
    const stack = new Error().stack;
    const niceStack = getNiceStack(stack);

    test.only(testObj.title, async () =>
      testIt
        .bind(null, await getAndUpdateModeHandler())(testObj)
        .catch((reason: Error) => {
          reason.stack = niceStack;
          throw reason;
        })
    );
  };

  const newTestSkip = (testObj: ITestObject): void => {
    const stack = new Error().stack;
    const niceStack = getNiceStack(stack);

    test.skip(testObj.title, async () =>
      testIt
        .bind(null, await getAndUpdateModeHandler())(testObj)
        .catch((reason: Error) => {
          reason.stack = niceStack;
          throw reason;
        })
    );
  };

  return {
    newTest,
    newTestOnly,
    newTestSkip,
  };
}

interface ITestObject {
  title: string;
  start: string[];
  keysPressed: string;
  end: string[];
  endMode?: ModeName;
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
        ret.position = ret.position.withLine(i).withColumn(columnIdx);
        ret.success = true;
      }
    }

    return ret;
  }

  private _parse(t: ITestObject): void {
    this._isValid = true;
    if (!this._setStartCursorPosition(t.start)) {
      this._isValid = false;
    }
    if (!this._setEndCursorPosition(t.end)) {
      this._isValid = false;
    }
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
  await modeHandler.vimState.editor.edit(builder => {
    builder.insert(new Position(0, 0), testObj.start.join('\n').replace('|', ''));
  });

  await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);

  await waitForCursorSync();

  // Since we bypassed VSCodeVim to add text,
  // we need to tell the history tracker that we added it.
  modeHandler.vimState.historyTracker.addChange();
  modeHandler.vimState.historyTracker.finishCurrentStep();

  // move cursor to start position using 'hjkl'
  await modeHandler.handleMultipleKeyEvents(helper.getKeyPressesToMoveToStartPosition());

  await waitForCursorSync();

  Globals.mockModeHandler = modeHandler;

  let keysPressed = testObj.keysPressed;
  if (process.platform === 'win32') {
    keysPressed = keysPressed.replace(/\\n/g, '\\r\\n');
  }

  jumpTracker.clearJumps();

  // assumes key presses are single characters for nowkA
  await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(keysPressed));

  // Check valid test object input
  assert(helper.isValid, "Missing '|' in test object.");

  // end: check given end output is correct
  //
  const lines = helper.asVimOutputText();
  assertEqualLines(lines);
  // Check final cursor position
  //
  const actualPosition = Position.FromVSCodePosition(TextEditor.getSelection().start);
  const expectedPosition = helper.endPosition;
  assert.strictEqual(actualPosition.line, expectedPosition.line, 'Cursor LINE position is wrong.');
  assert.strictEqual(
    actualPosition.character,
    expectedPosition.character,
    'Cursor CHARACTER position is wrong.'
  );

  // endMode: check end mode is correct if given
  if (typeof testObj.endMode !== 'undefined') {
    const actualMode = ModeName[modeHandler.currentMode.name].toUpperCase();
    const expectedMode = ModeName[testObj.endMode].toUpperCase();
    assert.strictEqual(actualMode, expectedMode, "Didn't enter correct mode.");
  }

  // jumps: check jumps are correct if given
  if (typeof testObj.jumps !== 'undefined') {
    assert.deepEqual(
      jumpTracker.jumps.map(j => lines[j.position.line] || '<MISSING>'),
      testObj.jumps.map(t => t.replace('|', '')),
      'Incorrect jumps found'
    );

    const stripBar = text => (text ? text.replace('|', '') : text);
    const actualJumpPosition =
      (jumpTracker.currentJump && lines[jumpTracker.currentJump.position.line]) || '<FRONT>';
    const expectedJumpPosition = stripBar(testObj.jumps.find(t => t.includes('|'))) || '<FRONT>';

    assert.deepEqual(
      actualJumpPosition.toString(),
      expectedJumpPosition.toString(),
      'Incorrect jump position found'
    );
  }
}

export { ITestObject, testIt };
