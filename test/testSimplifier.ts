import { strict as assert } from 'assert';
import _ from 'lodash';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import * as os from 'os';
import { Position } from 'vscode';
import { IConfiguration } from '../src/configuration/iconfiguration';
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
import { reloadConfiguration, setupWorkspace } from './testUtils';

/**
 * What to check after a step's keys are handled.
 */
type Expectation = {
  /** The document after the keys; `|` marks each cursor */
  end: string[];
  endMode?: Mode;
  endFsPath?: string | (() => string);
  registers?: { [name: string]: string | undefined };
  statusBar?: string;
  /**
   * Lines of the jump list, with `|` marking the current jump. The jump list carries over from
   * earlier steps.
   */
  jumps?: string[];
};

type StepBody = Expectation & {
  keysPressed: string;
  /** What to check once the remap timeout has fired and anything it started has finished */
  afterTimeout?: Expectation;
};

type Step = StepBody & {
  title?: string;
};

type TestBase = {
  title: string;
  config?: Partial<IConfiguration>;
  /** Remaps in .vimrc syntax, e.g. `nmap J jj`; applied on top of `config` */
  remaps?: string[];
  editorOptions?: vscode.TextEditorOptions;
  start: string[];
  stub?: {
    stubClass: any;
    methodName: string;
    returnValue: any;
  };
  saveDocBeforeTest?: boolean;
};

/** A test that presses one sequence of keys */
export type ITestObject = TestBase & StepBody & { steps?: never };

/** A test with several steps, each starting where the previous one ended */
export type IMultiStepTestObject = TestBase & {
  steps: Step[];
  keysPressed?: never;
  end?: never;
};

export type TestObject = ITestObject | IMultiStepTestObject;

function newTestGeneric(
  testObj: TestObject,
  testFunc: Mocha.TestFunction | Mocha.ExclusiveTestFunction | Mocha.PendingTestFunction,
): void {
  const stack = ((s) => (s ? s.split('\n').splice(2, 1).join('\n') : 'no stack available :('))(
    new Error().stack,
  );

  testFunc(testObj.title, async () => {
    try {
      await testIt(testObj);
    } catch (reason) {
      if (reason instanceof Error) {
        // Keep the original stack (useful when the extension itself throws) and point at the test
        reason.stack = `${reason.stack}\n  --- test defined at:\n${stack}`;
      }
      throw reason;
    }
  });
}

export const newTest = (testObj: TestObject) => newTestGeneric(testObj, test);

export const newTestOnly = (testObj: TestObject) => {
  console.warn('!!! Running single test !!!');
  return newTestGeneric(testObj, test.only);
};

export const newTestSkip = (testObj: TestObject, skipCondition: boolean = true) =>
  newTestGeneric(testObj, skipCondition ? test.skip : test);

class DocState {
  public static parse(lines: string[]): DocState {
    lines = [...lines];

    const cursors: Position[] = [];
    for (let i = 0; i < lines.length;) {
      const columnIdx = lines[i].indexOf('|');
      if (columnIdx >= 0) {
        lines[i] = lines[i].replace('|', '');
        cursors.push(new Position(i, columnIdx));
      } else {
        i++;
      }
    }
    if (cursors.length === 0) {
      throw new Error("Missing '|' in test object");
    }

    return new DocState(cursors, lines);
  }

  constructor(cursors: Position[], lines: string[]) {
    this.cursors = cursors;
    this.lines = lines;
  }

  public readonly cursors: Position[];
  public readonly lines: string[];
}

const namedKeyRegex =
  /^<(esc|bs|del|cr|enter|return|tab|space|up|down|left|right|home|end|insert|pageup|pagedown|leader|bar|f\d{1,2})>$/i;
const modifiedKeyRegex = /^<((c|s|a|d|m|ctrl|alt|shift|cmd)[-+])+[^<>]+>$/i;

/**
 * Throws if `key` looks like `<...>` but isn't a key we know about.
 * This catches sequences like `'m<' + 'j' + 'm>'`, which would otherwise be tokenized as `<jm>`.
 */
function assertValidBracketedKey(key: string, sequence: string): void {
  if (!namedKeyRegex.test(key) && !modifiedKeyRegex.test(key)) {
    throw new Error(
      `Unrecognized key '${key}' in keysPressed '${sequence}'. ` +
        `If '<' and '>' are meant literally, separate them (e.g. with '<Esc>').`,
    );
  }
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
    for (const c of characters) {
      result.push(c);
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
      if (isBracketedKey && key !== '<>') {
        assertValidBracketedKey(key, sequence);
      }
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

async function applyDocState(editor: vscode.TextEditor, docState: DocState): Promise<void> {
  assert.ok(
    await editor.edit((builder) => {
      builder.replace(TextEditor.getDocumentRange(editor.document), docState.lines.join('\n'));
    }),
    'Edit failed',
  );
  editor.selections = docState.cursors.map((cursor) => new vscode.Selection(cursor, cursor));
}

function assertDocState(modeHandler: ModeHandler, docState: DocState, label: string): void {
  assert.equal(
    vscode.window.activeTextEditor?.document.getText(),
    docState.lines.join(os.EOL),
    `${label}Document content does not match.`,
  );

  const simplify = (position: Position) => ({ line: position.line, character: position.character });
  const compare = (
    a: { line: number; character: number },
    b: { line: number; character: number },
  ) => {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return a.character - b.character;
  };
  // TODO: Assert selections match vimState.cursors
  assert.deepEqual(
    modeHandler.vimState.cursors.map((cursor) => simplify(cursor.stop)).sort(compare),
    docState.cursors.map(simplify).sort(compare),
    `${label}Cursors are wrong.`,
  );
}

async function assertExpectation(
  modeHandler: ModeHandler,
  expectation: Expectation,
  label: string,
): Promise<void> {
  const end = DocState.parse(expectation.end);
  assertDocState(modeHandler, end, label);

  if (expectation.endMode !== undefined) {
    assert.equal(
      Mode[modeHandler.vimState.currentMode],
      Mode[expectation.endMode],
      `${label}Didn't enter correct mode.`,
    );
  }

  if (expectation.endFsPath !== undefined) {
    assert.equal(
      vscode.window.activeTextEditor?.document.uri.fsPath,
      typeof expectation.endFsPath === 'string' ? expectation.endFsPath : expectation.endFsPath(),
      `${label}Active document is wrong.`,
    );
  }

  if (expectation.registers !== undefined) {
    for (const reg in expectation.registers) {
      if (expectation.registers[reg] !== undefined) {
        assert.equal(
          (await Register.get(reg))?.text,
          expectation.registers[reg],
          `${label}Register '${reg}' is wrong.`,
        );
      } else {
        assert.equal(await Register.get(reg), undefined, `${label}Register '${reg}' is wrong.`);
      }
    }
  }

  if (expectation.statusBar !== undefined) {
    assert.equal(
      StatusBar.getText(),
      expectation.statusBar.replace('{FILENAME}', modeHandler.vimState.document.fileName),
      `${label}Status bar text is wrong.`,
    );
  }

  if (expectation.jumps !== undefined) {
    // TODO: Jumps should be specified by Positions, not line contents
    assert.deepEqual(
      globalState.jumpTracker.jumps.map((j) => end.lines[j.position.line] || '<MISSING>'),
      expectation.jumps.map((t) => t.replace('|', '')),
      `${label}Incorrect jumps found`,
    );

    const stripBar = (text: string | undefined) => (text ? text.replace('|', '') : text);
    const actualJumpPosition =
      (globalState.jumpTracker.currentJump &&
        end.lines[globalState.jumpTracker.currentJump.position.line]) ||
      '<FRONT>';
    const expectedJumpPosition =
      stripBar(expectation.jumps.find((t) => t.includes('|'))) || '<FRONT>';

    assert.deepEqual(
      actualJumpPosition,
      expectedJumpPosition,
      `${label}Incorrect jump position found`,
    );
  }
}

/**
 * Applies the test's `config` and `remaps`, returning a function that restores the previous config.
 */
async function applyConfig(testObj: TestObject): Promise<() => Promise<void>> {
  if (testObj.config === undefined && testObj.remaps === undefined) {
    return async () => undefined;
  }

  // Remaps are mutated in place when the config is validated, so snapshot deeply
  const prevConfig = _.cloneDeep(Globals.mockConfiguration);
  const config = Globals.mockConfiguration;
  if (testObj.config) {
    Object.assign(config, _.cloneDeep(testObj.config));
  }
  if (testObj.remaps) {
    await addVimrcRemaps(config, testObj.remaps);
  }
  await reloadConfiguration(config);

  return async () => reloadConfiguration(prevConfig);
}

async function addVimrcRemaps(config: IConfiguration, lines: string[]): Promise<void> {
  // Remove all the old remappings from the .vimrc file
  VimrcImpl.removeAllRemapsFromConfig(config);

  const vscodeCommands = await vscode.commands.getCommands();
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

const wait = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs a test: sets up the document, then for each step presses its keys and checks the result.
 *
 * @returns the ModeHandler the keys were sent to, for checks the test object can't express. By then,
 *   the test's `config` and `remaps` have been undone.
 */
export async function testIt(testObj: TestObject): Promise<ModeHandler> {
  // Do this first: setupWorkspace replaces the whole config
  if (vscode.window.activeTextEditor === undefined) {
    await setupWorkspace();
  }

  const restoreConfig = await applyConfig(testObj);
  try {
    return await runSteps(testObj);
  } finally {
    await restoreConfig();
  }
}

async function runSteps(testObj: TestObject): Promise<ModeHandler> {
  const editor = vscode.window.activeTextEditor;
  assert(editor, 'Expected an active editor');

  const start = DocState.parse(testObj.start);

  if (testObj.editorOptions) {
    editor.options = testObj.editorOptions;
  }

  await applyDocState(editor, start);

  if (testObj.saveDocBeforeTest) {
    assert.ok(await editor.document.save(), 'Save failed');
  }

  // Generate a brand new ModeHandler for this editor
  ModeHandlerMap.clear();
  const [modeHandler] = await ModeHandlerMap.getOrCreate(editor);

  assertDocState(modeHandler, start, 'Before keys are pressed: ');

  // When the remap timeout fires, the remapper calls handleKeyEvent(<TimeoutFinished>) without
  // awaiting it. Track those calls so the checks below can wait for them to finish instead of
  // assuming they finish within a fixed time, which isn't true on slow CI runners.
  const keyEventsInFlight = new Set<Promise<void>>();
  const handleKeyEvent = modeHandler.handleKeyEvent.bind(modeHandler);
  modeHandler.handleKeyEvent = (key: string) => {
    const promise = handleKeyEvent(key);
    keyEventsInFlight.add(promise);
    void promise.finally(() => keyEventsInFlight.delete(promise)).catch(() => undefined);
    return promise;
  };
  const settle = async () => {
    while (
      keyEventsInFlight.size > 0 ||
      modeHandler.vimState.recordedState.bufferedKeysTimeoutObj !== undefined ||
      modeHandler.remapState.isCurrentlyPerformingRemapping
    ) {
      await wait(10);
    }
  };

  const steps: Step[] = testObj.steps ?? [testObj];

  const stub = testObj.stub
    ? sinon
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .stub(testObj.stub.stubClass.prototype, testObj.stub.methodName)
        .resolves(testObj.stub.returnValue)
    : undefined;
  try {
    for (const [index, step] of steps.entries()) {
      const label =
        steps.length === 1 ? '' : `Step ${index}${step.title ? ` "${step.title}"` : ''}: `;

      await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(step.keysPressed), false);
      // Let calls made without awaiting finish; keys buffered waiting for the timeout stay buffered
      while (keyEventsInFlight.size > 0) {
        await Promise.allSettled([...keyEventsInFlight]);
      }

      await assertExpectation(modeHandler, step, label);

      if (step.afterTimeout) {
        // The timeout started when the keys were handled, so it has fired by the end of this wait.
        // Its handling (and any remap it starts) may still be running, or the timer may be late.
        await wait(Globals.mockConfiguration.timeout);
        await settle();
        await assertExpectation(modeHandler, step.afterTimeout, `${label}After timeout: `);
      }
    }
  } finally {
    stub?.restore();
  }

  return modeHandler;
}
