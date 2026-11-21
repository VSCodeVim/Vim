import FakeTimers from '@sinonjs/fake-timers';
import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

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
import { timers } from '../src/util/timers';
import { openNewFile, reloadConfiguration, saveConfig, testEol } from './testUtils';

/**
 * What to check after a step's keys are handled.
 */
type Expectation = {
  /**
   * The document after the keys; `|` marks each cursor. If `endMode` is a Visual mode, `[` and `]`
   * surround each selection's characters from anchor to cursor, with `|` just before the cursor's
   * character as usual (`a[b|c]d` or `a[|bc]d`); see `DocState`. In a multi-step test,
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
  /** What to enter in the input boxes the keys open (e.g. surround's tag prompt); one must open */
  inputBox?: string;
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

/** A selection from the `anchor` character to the `active` one, where the cursor is */
type Ends = { anchor: Position; active: Position };

/**
 * A document and its cursors, written as test lines. `|` goes just before the character each
 * cursor is on.
 *
 * In a Visual mode, `[` and `]` also surround each selection's characters from the anchor to the
 * cursor, and `|` must be just before the first or last character in the brackets: `ab[cd|e]f`
 * (anchor on `c`, cursor on `e`) or `ab[|cde]f` (anchor on `e`, cursor on `c`). A one-character
 * selection is `ab[|c]d`. A selection that includes a line break spans lines, and a cursor on a
 * line break goes at the end of its line: `['ab[cd|', ']ef']`. `[|]` marks a cursor on an empty
 * line in Visual Line or Visual Block mode, or where there's no character at all (an empty
 * document). A `|` outside brackets isn't allowed. Outside Visual modes, `[` and `]` are text.
 *
 * Each cursor is a selection's anchor and active ends, which are the same outside Visual modes.
 * With the mode, they determine both `vimState.cursors` and the editor's selections (e.g. whole
 * lines in Visual Line mode).
 */
class DocState {
  public static parse(lines: string[], mode: Mode): DocState {
    const fail = (message: string): never => {
      throw new Error(`${message} in test document ${JSON.stringify(lines)}`);
    };
    const parsed = isVisualMode(mode)
      ? DocState.parseSelections(lines, fail)
      : DocState.parseCursors(lines, fail);
    return new DocState(
      parsed.lines,
      parsed.ends.map(({ anchor, active }) =>
        DocState.toCursor(parsed.lines, anchor, active, mode),
      ),
      mode,
    );
  }

  private static parseCursors(
    lines: string[],
    fail: (message: string) => never,
  ): { lines: string[]; ends: Ends[] } {
    const ends: Ends[] = [];
    const outLines = lines.map((line, lineIdx) => {
      let out = '';
      for (const char of line) {
        if (char === '|') {
          const pos = new Position(lineIdx, out.length);
          ends.push({ anchor: pos, active: pos });
        } else {
          out += char;
        }
      }
      return out;
    });
    if (ends.length === 0) fail("Missing '|'");
    return { lines: outLines, ends };
  }

  private static parseSelections(
    lines: string[],
    fail: (message: string) => never,
  ): { lines: string[]; ends: Ends[] } {
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

    const ends = ranges.map(({ lo, hi, bar }) => {
      // `last` is the last character in the brackets (`lo` itself if there are none)
      const last = lo.isEqual(hi) ? lo : charBefore(outLines, hi);
      if (!bar.isEqual(lo) && !bar.isEqual(last)) {
        fail("'|' must be just before the first or last character in a selection");
      }
      // A one-character selection is forward
      return bar.isEqual(lo) && !lo.isEqual(last)
        ? { anchor: last, active: lo }
        : { anchor: lo, active: last };
    });
    return { lines: outLines, ends };
  }

  /**
   * Writes `cursors` into `lines` in the notation `parse` reads, for failure messages. A cursor
   * the notation can't express (e.g. one with a selection outside Visual modes) gets a `?` after it.
   */
  public static render(lines: string[], cursors: readonly Cursor[], mode: Mode): string[] {
    // `order` puts inserts at the same position in the right order: a selection's `]` before the
    // next one's `[`, and `[` before `|`
    const inserts: Array<{ pos: Position; text: string; order: number }> = [];
    for (const cursor of cursors) {
      const { anchor, active } = DocState.fromCursor(lines, cursor, mode);
      const mark = DocState.toCursor(lines, anchor, active, mode).equals(cursor) ? '' : '?';
      if (!isVisualMode(mode)) {
        inserts.push({ pos: active, text: `|${mark}`, order: 2 });
        continue;
      }
      const [first, last] = active.isBefore(anchor) ? [active, anchor] : [anchor, active];
      const end = charAfter(lines, last);
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
    if (!isVisualMode(mode)) {
      return Cursor.atPosition(active);
    }
    // In Visual mode, a forward selection's `stop` is after the cursor's character
    return mode === Mode.Visual && !active.isBefore(anchor)
      ? new Cursor(anchor, charAfter(lines, active))
      : new Cursor(anchor, active);
  }

  /** The inverse of `toCursor`, as far as it has one */
  private static fromCursor(lines: string[], { start, stop }: Cursor, mode: Mode): Ends {
    if (!isVisualMode(mode)) {
      return { anchor: stop, active: stop };
    }
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
    } else if (mode === Mode.VisualBlock) {
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
    } else {
      return [new vscode.Selection(active, active)];
    }
  }

  private constructor(lines: string[], cursors: Cursor[], mode: Mode) {
    this.lines = lines;
    this.cursors = cursors;
    this.mode = mode;
  }

  public readonly lines: string[];
  public readonly cursors: Cursor[];
  public readonly mode: Mode;

  /** The editor selections VSCodeVim draws for `cursors` */
  public get selections(): vscode.Selection[] {
    return this.cursors.flatMap((cursor) => {
      const { anchor, active } = DocState.fromCursor(this.lines, cursor, this.mode);
      return DocState.toSelections(this.lines, anchor, active, this.mode);
    });
  }
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
 * Tokenize a string like `"abc<Esc>d<C-c>"` into `["a", "b", "c", "<Esc>", "d", "<C-c>"]`. A `<`
 * that doesn't start a `<...>` key is a literal `<`. Each other key is one character; a character
 * outside the BMP (e.g. an emoji) is one key, as when it's typed.
 */
function tokenizeKeySequence(sequence: string): string[] {
  const keys = sequence.match(/<[^<>]+>|./gsu) ?? [];
  for (const key of keys) {
    if (key.length > 1 && key.startsWith('<')) {
      assertValidBracketedKey(key, sequence);
    }
  }
  return keys;
}

async function applyDocState(editor: vscode.TextEditor, docState: DocState): Promise<void> {
  assert.ok(
    await editor.edit((builder) => {
      builder.replace(TextEditor.getDocumentRange(editor.document), docState.lines.join('\n'));
    }),
    'Edit failed',
  );
  editor.selections = docState.selections;
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
    lines.join(testEol),
    `${label}Document content does not match.`,
    details,
  );
}

const showCursors = (cursors: readonly Cursor[]) => cursors.map(String).sort();
const showSelections = (selections: readonly vscode.Selection[]) =>
  showCursors(selections.map((s) => Cursor.fromSelection(s)));

/**
 * Checks the editor's selections. The extension host learns about selection changes from VS Code
 * asynchronously, and an older update can briefly replace the newest one, so this retries briefly.
 */
async function assertEditorSelections(
  editor: vscode.TextEditor,
  expected: readonly vscode.Selection[],
  label: string,
  details?: () => string,
): Promise<void> {
  const want = showSelections(expected);
  const deadline = Date.now() + 500;
  while (!isDeepStrictEqual(showSelections(editor.selections), want) && Date.now() < deadline) {
    await wait(10);
  }
  assertEqual(
    showSelections(editor.selections),
    want,
    `${label}Editor selections ([anchor | active]) are wrong.`,
    details,
  );
}

/**
 * Checks the document, `vimState.cursors`, and the editor's selections against `expected`, written
 * in `DocState` notation for `mode`, returning its lines without the markers
 */
async function assertDocState(
  modeHandler: ModeHandler,
  expected: string[],
  mode: Mode,
  label: string,
): Promise<string[]> {
  const { vimState } = modeHandler;
  const actual = () => {
    const actualMode = vimState.currentMode;
    const { document } = vimState;
    const lines = DocState.render(
      Array.from({ length: document.lineCount }, (_, i) => document.lineAt(i).text),
      vimState.cursors,
      actualMode,
    );
    const inMode = actualMode === mode ? '' : ` (in ${Mode[actualMode]} mode)`;
    return `\nActual${inMode}: ${JSON.stringify(lines)}`;
  };

  let end: DocState;
  try {
    end = DocState.parse(expected, mode);
  } catch (e) {
    throw new Error(`${label}${e instanceof Error ? e.message : String(e)}${actual()}`);
  }
  assertDocText(end.lines, label, actual);
  const showStops = (cursors: readonly Cursor[]) => cursors.map((c) => c.stop.toString()).sort();
  assertEqual(
    showStops(vimState.cursors),
    showStops(end.cursors),
    `${label}Cursors are wrong.`,
    actual,
  );
  assertEqual(
    showCursors(vimState.cursors),
    showCursors(end.cursors),
    isVisualMode(mode)
      ? `${label}vimState.cursors ([start | stop]) are wrong.`
      : `${label}vimState.cursors ([start | stop]) should have nothing selected.`,
    actual,
  );
  await assertEditorSelections(vimState.editor, end.selections, label, actual);
  return end.lines;
}

async function assertExpectation(
  modeHandler: ModeHandler,
  expectation: Expectation,
  expectedEnd: string[],
  label: string,
): Promise<void> {
  const endMode = expectation.endMode ?? Mode.Normal;
  const endLines = await assertDocState(modeHandler, expectedEnd, endMode, label);

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

  const restoreConfig = await saveConfig();
  const config = Globals.mockConfiguration;
  if (testObj.config) {
    Object.assign(config, structuredClone(testObj.config));
  }
  if (testObj.remaps) {
    await addVimrcRemaps(config, testObj.remaps);
  }
  await reloadConfiguration(config);

  return restoreConfig;
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
  if (vscode.window.activeTextEditor === undefined) {
    await openNewFile();
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

  const start = DocState.parse(testObj.start, Mode.Normal);

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

  await assertDocState(modeHandler, testObj.start, Mode.Normal, 'Before keys are pressed: ');

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
  const finishKeyEvents = async () => {
    while (keyEventsInFlight.size > 0) {
      await Promise.allSettled([...keyEventsInFlight]);
    }
  };

  const sandbox = sinon.createSandbox();

  // The remap timeout fires only when a step's `afterTimeout` says so, however long the steps take,
  // and a timeout still pending at the end of the test never fires
  const clock = FakeTimers.createClock();
  // The fake clock's timer IDs have a different type, but the code only passes them back to
  // `clearTimeout`
  sandbox.replace(timers, 'setTimeout', (callback, ms) => clock.setTimeout(callback, ms) as never);
  sandbox.replace(timers, 'clearTimeout', (handle) => clock.clearTimeout(handle as never));
  /** Fires the pending remap timeout, and any it leads to, and waits for what they start */
  const fireTimeouts = async () => {
    do {
      await clock.runAllAsync();
      await finishKeyEvents();
    } while (modeHandler.vimState.recordedState.bufferedKeysTimeoutObj !== undefined);
  };

  const steps: Step[] = testObj.steps ?? [testObj];

  const inputBox =
    testObj.inputBox !== undefined
      ? sandbox.stub(vscode.window, 'showInputBox').resolves(testObj.inputBox)
      : undefined;
  try {
    let previousEnd = testObj.start;
    for (const [index, step] of steps.entries()) {
      const label =
        steps.length === 1 ? '' : `Step ${index}${step.title ? ` "${step.title}"` : ''}: `;

      await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(step.keysPressed), false);
      // Let calls made without awaiting finish; keys buffered waiting for the timeout stay buffered
      await finishKeyEvents();

      const end = step.end ?? previousEnd;
      await assertExpectation(modeHandler, step, end, label);
      previousEnd = end;

      if (step.afterTimeout) {
        await fireTimeouts();
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

    if (inputBox) {
      assert.ok(inputBox.called, 'Expected an input box to open.');
    }
  } finally {
    sandbox.restore();
  }

  return modeHandler;
}
