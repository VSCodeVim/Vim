import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import * as os from 'os';
import { isDeepStrictEqual } from 'util';
import { Position } from 'vscode';
import { Cursor } from '../src/common/motion/cursor';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { VimrcImpl } from '../src/configuration/vimrc';
import { vimrcKeyRemappingBuilder } from '../src/configuration/vimrcKeyRemappingBuilder';
import { Globals } from '../src/globals';
import { isVisualMode, Mode } from '../src/mode/mode';
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
  /**
   * The document after the keys; `|` marks each cursor. If `endMode` is a Visual mode, `[` and `]`
   * surround each selection's characters from anchor to cursor, with `|` just before the cursor's
   * character as usual (`a[b|c]d` or `a[|bc]d`); see `VisualDocState`. In a multi-step test,
   * it defaults to the previous step's `end` (or `start`), and in `afterTimeout` to the step's own
   * `end`, meaning nothing changed.
   */
  end?: string[];
  /** The mode after the keys; defaults to Normal */
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
export type ITestObject = TestBase & StepBody & { end: string[]; steps?: never };

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

/** The character just before `pos` in `lines`, which is the line break if `pos` starts a line */
function charBefore(lines: string[], pos: Position): Position {
  return pos.character > 0 ? pos.getLeft() : new Position(pos.line - 1, lines[pos.line - 1].length);
}

/** The position after the character at `pos`; there's nothing after the end of the last line */
function charAfter(lines: string[], pos: Position): Position {
  if (pos.character < lines[pos.line].length) {
    return pos.getRight();
  }
  return pos.line + 1 < lines.length ? new Position(pos.line + 1, 0) : pos;
}

/**
 * The expected state at the end of a step that ends in a Visual mode, written with `[` and `]`
 * around the characters from the anchor to the cursor. As in Normal mode, `|` goes just before the
 * character the cursor is on, which must be the first or last character in the brackets:
 * `ab[cd|e]f` (anchor on `c`, cursor on `e`) or `ab[|cde]f` (anchor on `e`, cursor on `c`).
 * A one-character selection is `ab[|c]d`. A selection that includes a line break spans lines, and
 * a cursor on a line break goes at the end of its line: `['ab[cd|', ']ef']`. `[|]` marks a cursor
 * on an empty line in Visual Line or Visual Block mode, or where there's no character at all (an
 * empty document). A `|` outside brackets isn't allowed.
 *
 * The anchor and cursor determine both `vimState.cursors` and the editor's selections, which
 * depend on the mode (e.g. whole lines in Visual Line mode).
 */
class VisualDocState {
  public static parse(lines: string[], mode: Mode): VisualDocState {
    function fail(message: string): never {
      throw new Error(`${message} in Visual mode test document ${JSON.stringify(lines)}`);
    }

    const outLines: string[] = [];
    const ranges: Array<{ lo: Position; hi: Position; bar: Position }> = [];
    let open: { lo: Position; bar?: Position } | undefined;
    for (const [lineIdx, line] of lines.entries()) {
      let out = '';
      for (const char of line) {
        if (char === '[') {
          if (open) fail("Nested '['");
          open = { lo: new Position(lineIdx, out.length) };
        } else if (char === '|') {
          if (!open) fail("'|' outside '[' ']'");
          if (open.bar) fail("More than one '|' in a selection");
          open.bar = new Position(lineIdx, out.length);
        } else if (char === ']') {
          if (!open) fail("']' without '['");
          if (!open.bar) fail("Missing '|' in a selection");
          ranges.push({ lo: open.lo, hi: new Position(lineIdx, out.length), bar: open.bar });
          open = undefined;
        } else {
          out += char;
        }
      }
      outLines.push(out);
    }
    if (open) fail("Unclosed '['");
    if (ranges.length === 0) fail("Missing '[' ']'");

    const cursors: Cursor[] = [];
    const selections: vscode.Selection[] = [];
    for (const { lo, hi, bar } of ranges) {
      // `last` is the last character in the brackets (`lo` itself if there are none)
      const last = lo.isEqual(hi) ? lo : charBefore(outLines, hi);
      if (!bar.isEqual(lo) && !bar.isEqual(last)) {
        fail("'|' must be just before the first or last character in a selection");
      }
      // A one-character selection is forward
      const [anchor, active] = bar.isEqual(lo) && !lo.isEqual(last) ? [last, lo] : [lo, last];
      cursors.push(VisualDocState.toCursor(outLines, anchor, active, mode));
      selections.push(...VisualDocState.toSelections(outLines, anchor, active, mode));
    }

    return new VisualDocState(outLines, cursors, selections);
  }

  /**
   * Writes `cursors` into `lines` in the notation `parse` reads, for failure messages. A selection
   * the notation can't express (e.g. a one-character Visual mode selection stored as backward)
   * gets a `?` after it.
   */
  public static render(lines: string[], cursors: readonly Cursor[], mode: Mode): string[] {
    // `order` puts inserts at the same position in the right order: a selection's `]` before the
    // next one's `[`, and `[` before `|`
    const inserts: Array<{ pos: Position; text: string; order: number }> = [];
    for (const cursor of cursors) {
      const { anchor, active } = VisualDocState.fromCursor(lines, cursor, mode);
      const [first, last] = active.isBefore(anchor) ? [active, anchor] : [anchor, active];
      const end = charAfter(lines, last);
      const mark = VisualDocState.toCursor(lines, anchor, active, mode).equals(cursor) ? '' : '?';
      if (
        anchor.isEqual(active) &&
        (end.isEqual(last) || (mode !== Mode.Visual && lines[anchor.line] === ''))
      ) {
        inserts.push({ pos: first, text: `[|]${mark}`, order: 1 });
      } else {
        inserts.push(
          { pos: first, text: '[', order: 1 },
          { pos: active, text: '|', order: 2 },
          { pos: end, text: `]${mark}`, order: 0 },
        );
      }
    }

    const out = [...lines];
    // Insert from the end so earlier positions stay valid, and at the same position, insert what
    // should come last first
    inserts.sort((a, b) => b.pos.compareTo(a.pos) || b.order - a.order);
    for (const { pos, text } of inserts) {
      out[pos.line] =
        out[pos.line].slice(0, pos.character) + text + out[pos.line].slice(pos.character);
    }
    return out;
  }

  /** The cursor VSCodeVim stores for a selection from the `anchor` character to `active` */
  private static toCursor(lines: string[], anchor: Position, active: Position, mode: Mode): Cursor {
    // In Visual mode, a forward selection's `stop` is after the cursor's character
    return mode === Mode.Visual && !active.isBefore(anchor)
      ? new Cursor(anchor, charAfter(lines, active))
      : new Cursor(anchor, active);
  }

  /** The inverse of `toCursor` */
  private static fromCursor(
    lines: string[],
    { start, stop }: Cursor,
    mode: Mode,
  ): { anchor: Position; active: Position } {
    return {
      anchor: start,
      active: mode === Mode.Visual && start.isBefore(stop) ? charBefore(lines, stop) : stop,
    };
  }

  /** The editor selections VSCodeVim draws for a selection from `anchor` to `active` */
  private static toSelections(
    lines: string[],
    anchor: Position,
    active: Position,
    mode: Mode,
  ): vscode.Selection[] {
    const [first, last] = active.isBefore(anchor) ? [active, anchor] : [anchor, active];
    if (mode === Mode.Visual) {
      // Half-open, so the selection ends after the last character
      return [
        active.isBefore(anchor)
          ? new vscode.Selection(charAfter(lines, anchor), active)
          : new vscode.Selection(anchor, charAfter(lines, active)),
      ];
    } else if (mode === Mode.VisualLine) {
      return [new vscode.Selection(first.line, 0, last.line, lines[last.line].length)];
    } else {
      const left = Math.min(anchor.character, active.character);
      const right = Math.max(anchor.character, active.character) + 1;
      const selections: vscode.Selection[] = [];
      for (let l = first.line; l <= last.line; l++) {
        const length = lines[l].length;
        selections.push(
          new vscode.Selection(l, Math.min(left, length), l, Math.min(right, length)),
        );
      }
      return selections;
    }
  }

  private constructor(lines: string[], cursors: Cursor[], selections: vscode.Selection[]) {
    this.lines = lines;
    this.cursors = cursors;
    this.selections = selections;
  }

  public readonly lines: string[];
  public readonly cursors: Cursor[];
  public readonly selections: vscode.Selection[];
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

/** Like `assert.deepEqual`, but only builds the end of the message (`details`) if the check fails */
function assertEqual<T>(actual: T, expected: T, message: string, details = () => ''): void {
  if (!isDeepStrictEqual(actual, expected)) {
    assert.deepEqual(actual, expected, message + details());
  }
}

function assertDocText(lines: string[], label: string, details?: () => string): void {
  assertEqual(
    vscode.window.activeTextEditor?.document.getText(),
    lines.join(os.EOL),
    `${label}Document content does not match.`,
    details,
  );
}

/** Checks the document and cursors against `expectedEnd`, returning its lines without the `|`s */
function assertDocState(modeHandler: ModeHandler, expectedEnd: string[], label: string): string[] {
  const end = DocState.parse(expectedEnd);
  assertDocText(end.lines, label);
  // TODO: Assert selections match vimState.cursors
  assert.deepEqual(
    modeHandler.vimState.cursors.map((cursor) => cursor.stop.toString()).sort(),
    end.cursors.map(String).sort(),
    `${label}Cursors are wrong.`,
  );
  return end.lines;
}

/**
 * Checks the document, `vimState.cursors`, and the editor's selections against `expectedEnd`,
 * written in `VisualDocState` notation, returning its lines without the markers
 */
function assertVisualDocState(
  modeHandler: ModeHandler,
  expectedEnd: string[],
  mode: Mode,
  label: string,
): string[] {
  const { vimState } = modeHandler;
  const actual = () =>
    '\nActual: ' +
    (isVisualMode(vimState.currentMode)
      ? JSON.stringify(
          VisualDocState.render(
            vimState.document.getText().split(/\r?\n/),
            vimState.cursors,
            vimState.currentMode,
          ),
        )
      : `(not in a Visual mode: ${Mode[vimState.currentMode]})`);

  let end: VisualDocState;
  try {
    end = VisualDocState.parse(expectedEnd, mode);
  } catch (e) {
    throw new Error(`${label}${e instanceof Error ? e.message : String(e)}${actual()}`);
  }
  assertDocText(end.lines, label, actual);
  const show = (cursors: readonly Cursor[]) => cursors.map(String).sort();
  assertEqual(
    show(vimState.cursors),
    show(end.cursors),
    `${label}vimState.cursors ([start | stop]) are wrong.`,
    actual,
  );
  assertEqual(
    show(vimState.editor.selections.map((s) => Cursor.fromSelection(s))),
    show(end.selections.map((s) => Cursor.fromSelection(s))),
    `${label}Editor selections ([anchor | active]) are wrong.`,
    actual,
  );
  return end.lines;
}

async function assertExpectation(
  modeHandler: ModeHandler,
  expectation: Expectation,
  expectedEnd: string[],
  label: string,
): Promise<void> {
  const endMode = expectation.endMode ?? Mode.Normal;
  const endLines = isVisualMode(endMode)
    ? assertVisualDocState(modeHandler, expectedEnd, endMode, label)
    : assertDocState(modeHandler, expectedEnd, label);

  assert.equal(
    Mode[modeHandler.vimState.currentMode],
    Mode[endMode],
    `${label}Didn't enter correct mode.`,
  );

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
      globalState.jumpTracker.jumps.map((j) => endLines[j.position.line] || '<MISSING>'),
      expectation.jumps.map((t) => t.replace('|', '')),
      `${label}Incorrect jumps found`,
    );

    const stripBar = (text: string | undefined) => (text ? text.replace('|', '') : text);
    const actualJumpPosition =
      (globalState.jumpTracker.currentJump &&
        endLines[globalState.jumpTracker.currentJump.position.line]) ||
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
  const prevConfig = structuredClone(Globals.mockConfiguration);
  const config = Globals.mockConfiguration;
  if (testObj.config) {
    Object.assign(config, structuredClone(testObj.config));
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

  assertDocState(modeHandler, testObj.start, 'Before keys are pressed: ');

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
    let previousEnd = testObj.start;
    for (const [index, step] of steps.entries()) {
      const label =
        steps.length === 1 ? '' : `Step ${index}${step.title ? ` "${step.title}"` : ''}: `;

      await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(step.keysPressed), false);
      // Let calls made without awaiting finish; keys buffered waiting for the timeout stay buffered
      while (keyEventsInFlight.size > 0) {
        await Promise.allSettled([...keyEventsInFlight]);
      }

      const end = step.end ?? previousEnd;
      await assertExpectation(modeHandler, step, end, label);
      previousEnd = end;

      if (step.afterTimeout) {
        // The timeout started when the keys were handled, so it has fired by the end of this wait.
        // Its handling (and any remap it starts) may still be running, or the timer may be late.
        await wait(Globals.mockConfiguration.timeout);
        await settle();
        const endAfterTimeout = step.afterTimeout.end ?? end;
        await assertExpectation(
          modeHandler,
          step.afterTimeout,
          endAfterTimeout,
          `${label}After timeout: `,
        );
        previousEnd = endAfterTimeout;
      }
    }
  } finally {
    stub?.restore();
  }

  return modeHandler;
}
