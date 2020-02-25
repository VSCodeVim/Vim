import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../extension';
import { Position } from '../src/common/motion/position';
import { Globals } from '../src/globals';
import { Mode } from '../src/mode/mode';
import { ModeHandler } from '../src/mode/modeHandler';
import { TextEditor } from '../src/textEditor';
import { assertEqualLines } from './testUtils';
import { globalState } from '../src/state/globalState';
import { Range } from '../src/common/motion/range';
import { RecordedState } from '../src/state/recordedState';

export function getTestingFunctions() {
  const getNiceStack = (stack: string | undefined): string => {
    return stack ? stack.split('\n').splice(2, 1).join('\n') : 'no stack available :(';
  };

  const newTest = (testObj: ITestParams): void => {
    const stack = new Error().stack;
    const niceStack = getNiceStack(stack);

    test(testObj.title, async () =>
      testIt
        .bind(
          null,
          await getAndUpdateModeHandler()
        )(testObj)
        .catch((reason: Error) => {
          reason.stack = niceStack;
          throw reason;
        })
    );
  };

  const newTestOnly = (testObj: ITestParams): void => {
    console.log('!!! Running single test !!!');
    const stack = new Error().stack;
    const niceStack = getNiceStack(stack);

    test.only(testObj.title, async () =>
      testIt
        .bind(
          null,
          await getAndUpdateModeHandler()
        )(testObj)
        .catch((reason: Error) => {
          reason.stack = niceStack;
          throw reason;
        })
    );
  };

  const newTestSkip = (testObj: ITestParams): void => {
    const stack = new Error().stack;
    const niceStack = getNiceStack(stack);

    test.skip(testObj.title, async () =>
      testIt
        .bind(
          null,
          await getAndUpdateModeHandler()
        )(testObj)
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

// TODO: add start mode, start/end registers, end status bar
interface ITestParams {
  /** What behavior does this test enforce? */
  title: string;
  /** Lines in the document at the test's start */
  start: string[];
  /** Simulated user input; control characters like <Esc> will be parsed */
  keysPressed: string;
  /** Expected lines in the document when the test ends */
  end: string[];
  /** Expected mode when the test ends */
  endMode?: Mode;
  /** Expected jumps */
  jumps?: string[];
}

function parseCursors(lines: string[]): Position[] {
  let cursors = [] as Position[];
  for (let line = 0; line < lines.length; line++) {
    let cursorsOnLine = 0;
    for (let column = 0; column < lines[line].length; column++) {
      if (lines[line][column] === '|') {
        cursors.push(new Position(line, column - cursorsOnLine));
        cursorsOnLine++;
      }
    }
  }

  return cursors;
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

async function testIt(modeHandler: ModeHandler, testParams: ITestParams): Promise<void> {
  modeHandler.vimState.editor = vscode.window.activeTextEditor!;

  // Find the cursors in the start/end strings
  const cursorStartPositions = parseCursors(testParams.start);
  const expectedCursorPositions = parseCursors(testParams.end);
  assert(cursorStartPositions.length > 0, "Missing '|' in test object's start.");
  assert(expectedCursorPositions.length > 0, "Missing '|' in test object's end.");

  // Take the cursor characters out of the start/end strings
  testParams.start = testParams.start.map((line) => line.replace('|', ''));
  testParams.end = testParams.end.map((line) => line.replace('|', ''));

  // Insert all the text as a single action.
  await modeHandler.vimState.editor.edit((builder) => {
    builder.insert(new Position(0, 0), testParams.start.join('\n'));
  });

  // Since we bypassed VSCodeVim to add text,
  // we need to tell the history tracker that we added it.
  modeHandler.vimState.historyTracker.addChange();
  modeHandler.vimState.historyTracker.finishCurrentStep();

  modeHandler.handleMultipleKeyEvents(['<Esc>', '<Esc>']);

  // Move cursors to starting positions
  modeHandler.vimState.recordedState = new RecordedState();
  modeHandler.vimState.cursors = cursorStartPositions.map((pos) => new Range(pos, pos));
  modeHandler.updateView(modeHandler.vimState);

  Globals.mockModeHandler = modeHandler;

  let keysPressed = testParams.keysPressed;
  if (process.platform === 'win32') {
    keysPressed = keysPressed.replace(/\\n/g, '\\r\\n');
  }

  const jumpTracker = globalState.jumpTracker;
  jumpTracker.clearJumps();

  // Assumes key presses are single characters for now
  await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(keysPressed));

  // Check given end output is correct
  assertEqualLines(testParams.end);

  // Check final positions of all cursors
  const actualCursorPositions = TextEditor.getSelections().map((sel) =>
    Position.FromVSCodePosition(sel.start)
  );
  assert.strictEqual(
    actualCursorPositions.length,
    expectedCursorPositions.length,
    'Wrong number of cursors'
  );
  for (let i = 0; i < actualCursorPositions.length; i++) {
    const actual = actualCursorPositions[i];
    const expected = expectedCursorPositions[i];
    assert.deepStrictEqual(
      {
        line: actual.line,
        character: actual.character,
      },
      {
        line: expected.line,
        character: expected.character,
      },
      `Cursor #${i + 1}'s position is wrong.`
    );
  }

  // endMode: check end mode is correct if given
  if (testParams.endMode !== undefined) {
    const actualMode = Mode[modeHandler.currentMode].toUpperCase();
    const expectedMode = Mode[testParams.endMode].toUpperCase();
    assert.strictEqual(actualMode, expectedMode, "Didn't enter correct mode.");
  }

  // jumps: check jumps are correct if given
  if (testParams.jumps !== undefined) {
    assert.deepEqual(
      jumpTracker.jumps.map((j) => testParams.end[j.position.line] || '<MISSING>'),
      testParams.jumps.map((t) => t.replace('|', '')),
      'Incorrect jumps found'
    );

    const stripBar = (text: string | undefined) => (text ? text.replace('|', '') : text);
    const actualJumpPosition =
      (jumpTracker.currentJump && testParams.end[jumpTracker.currentJump.position.line]) ||
      '<FRONT>';
    const expectedJumpPosition =
      stripBar(testParams.jumps.find((t) => t.includes('|'))) || '<FRONT>';

    assert.deepEqual(
      actualJumpPosition.toString(),
      expectedJumpPosition.toString(),
      'Incorrect jump position found'
    );
  }
}

export { ITestParams as ITestObject, testIt };
