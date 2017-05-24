import * as assert from 'assert';
import * as vscode from 'vscode';
import { ModeName } from '../src/mode/mode';
import { HistoryTracker } from '../src/history/historyTracker';
import { Position } from '../src/common/motion/position';
import { ModeHandler } from '../src/mode/modeHandler';
import { TextEditor } from '../src/textEditor';
import { assertEqualLines } from './testUtils';
import { waitForCursorUpdatesToHappen } from '../src/util';
import { Globals } from '../src/globals';
import { getAndUpdateModeHandler } from "../extension";

export function getTestingFunctions() {
  const newTest = (testObj: ITestObject): void => {
    const stack = (new Error()).stack;
    let niceStack = stack ? stack.split('\n').splice(2, 1).join('\n') : "no stack available :(";

    test(testObj.title, async () => testIt.bind(null, await getAndUpdateModeHandler())(testObj)
      .catch((reason: Error) => {
        reason.stack = niceStack;
        throw reason;
      })
    );
  };

  const newTestOnly = (testObj: ITestObject): void => {
    console.log("!!! Running single test !!!");
    const stack = (new Error()).stack;
    let niceStack = stack ? stack.split('\n').splice(2, 1).join('\n') : "no stack available :(";

    test.only(testObj.title, async () => testIt.bind(null, await getAndUpdateModeHandler())(testObj)
      .catch((reason: Error) => {
        reason.stack = niceStack;
        throw reason;
      })
    );
  };

  return {
    newTest,
    newTestOnly,
  };
}

interface ITestObject {
  title: string;
  start: string[];
  keysPressed: string;
  end: string[];
  endMode?: ModeName;
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
    let result = this._getCursorPosition(lines);
    this.startPosition = result.position;
    return result.success;
  }

  private _setEndCursorPosition(lines: string[]): boolean {
    let result = this._getCursorPosition(lines);
    this.endPosition = result.position;
    return result.success;
  }

  private _getCursorPosition(lines: string[]): { success: boolean; position: Position} {
    let ret = { success: false, position: new Position(0, 0) };
    for (let i = 0; i < lines.length; i++) {
      let columnIdx = lines[i].indexOf('|');
      if (columnIdx >= 0) {
        ret.position = ret.position.setLocation(i, columnIdx);
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
    let ret = 'i' + this._testObject.start.join('\n').replace('|', '');
    return ret.split('');
  }

  public asVimOutputText(): string[] {
    let ret = this._testObject.end.slice(0);
    ret[this.endPosition.line] = ret[this.endPosition.line].replace('|', '');
    return ret;
  }

  /**
   * Returns a sequence of Vim movement characters 'hjkl' as a string array
   * which will move the cursor to the start position given in the test.
   */
  public getKeyPressesToMoveToStartPosition(): string[] {
    let ret = '';
    let linesToMove = this.startPosition.line;

    let cursorPosAfterEsc =
      this._testObject.start[this._testObject.start.length - 1].replace('|', '').length - 1;
    let numCharsInCursorStartLine =
      this._testObject.start[this.startPosition.line].replace('|', '').length - 1;
    let charactersToMove = this.startPosition.character;

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
  let key = "";
  let result: string[] = [];

  for (const char of sequence) {
    key += char;

    if (char === '<') {
      isBracketedKey = true;
    }

    if (char === '>') {
      isBracketedKey = false;
    }

    if (isBracketedKey) {
      continue;
    }

    result.push(key);
    key = "";
  }

  return result;
}

async function testIt(modeHandler: ModeHandler, testObj: ITestObject): Promise<void> {
  modeHandler.vimState.editor = vscode.window.activeTextEditor!;

  let helper = new TestObjectHelper(testObj);

  // Don't try this at home, kids.
  (modeHandler as any)._vimState.cursorPosition = new Position(0, 0);

  await modeHandler.handleKeyEvent('<Esc>');

  // Insert all the text as a single action.
  await modeHandler.vimState.editor.edit(builder => {
    builder.insert(new Position(0, 0), testObj.start.join("\n").replace("|", ""));
  });

  await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);

  await waitForCursorUpdatesToHappen();

  // Since we bypassed VSCodeVim to add text,
  // we need to tell the history tracker that we added it.
  modeHandler.vimState.historyTracker.addChange();
  modeHandler.vimState.historyTracker.finishCurrentStep();

  // move cursor to start position using 'hjkl'
  await modeHandler.handleMultipleKeyEvents(helper.getKeyPressesToMoveToStartPosition());

  await waitForCursorUpdatesToHappen();

  Globals.modeHandlerForTesting = modeHandler;

  // assumes key presses are single characters for now
  await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(testObj.keysPressed));

  // Check valid test object input
  assert(helper.isValid, "Missing '|' in test object.");

  // Check final cursor position
  //
  let actualPosition = Position.FromVSCodePosition(TextEditor.getSelection().start);
  let expectedPosition = helper.endPosition;
  assert.equal(actualPosition.line, expectedPosition.line, "Cursor LINE position is wrong.");
  assert.equal(actualPosition.character, expectedPosition.character, "Cursor CHARACTER position is wrong.");

  // end: check given end output is correct
  //
  assertEqualLines(helper.asVimOutputText());

  // endMode: check end mode is correct if given
  if (typeof testObj.endMode !== 'undefined') {
    let actualMode = ModeName[modeHandler.currentMode.name].toUpperCase();
    let expectedMode = ModeName[testObj.endMode].toUpperCase();
    assert.equal(actualMode, expectedMode, "Didn't enter correct mode.");
  }
}

export { ITestObject, testIt };