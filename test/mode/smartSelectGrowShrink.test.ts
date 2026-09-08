import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace } from './../testUtils';

// Reproduces a real-world bug reported during dogfooding of PR #9998:
// smartSelect.grow on a TypeScript line behaves correctly on the FIRST
// grow (enters Visual, selects the word) but the SECOND grow loses the
// selection entirely and snaps the cursor back to column 6 (start of `if`).
//
// The exact line used is taken verbatim from the user's repro:
//
//   `      if (keybinding.when.includes('listFocus')) {`
//
// with the caret placed on the dot after `when` (column 25, zero-indexed).
//
// Each test asserts: (a) what text VSCode has selected, (b) what Vim mode
// reports, (c) where vimState.cursor sits. Mismatches between (a) and (c)
// surface the bug at the cursor-tracking layer.

const LINE = "      if (keybinding.when.includes('listFocus')) {";
const DOT_AFTER_WHEN = 25;

const getSelectedText = (editor: vscode.TextEditor): string => {
  return editor.document.getText(editor.selection);
};

const seedTSFile = async (modeHandler: ModeHandler): Promise<void> => {
  const editor = modeHandler.vimState.editor;
  const range = new vscode.Range(0, 0, editor.document.lineCount, 0);
  await editor.edit((eb) => eb.replace(range, LINE));
  // Position cursor on the dot after `when`.
  modeHandler.vimState.cursor = modeHandler.vimState.cursor.withNewStop(
    new vscode.Position(0, DOT_AFTER_WHEN),
  );
  modeHandler.vimState.cursor = modeHandler.vimState.cursor.withNewStart(
    new vscode.Position(0, DOT_AFTER_WHEN),
  );
  editor.selection = new vscode.Selection(
    new vscode.Position(0, DOT_AFTER_WHEN),
    new vscode.Position(0, DOT_AFTER_WHEN),
  );
  modeHandler.updateView();
};

const grow = async (): Promise<void> => {
  await vscode.commands.executeCommand('editor.action.smartSelect.grow');
  // Smart-select fires async; yield so handleSelectionChange runs before assert.
  await new Promise((r) => setTimeout(r, 50));
};

const shrink = async (): Promise<void> => {
  await vscode.commands.executeCommand('editor.action.smartSelect.shrink');
  await new Promise((r) => setTimeout(r, 50));
};

suite('smartSelect.grow / shrink on a TypeScript line', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace({ fileExtension: '.ts' });
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
    await seedTSFile(modeHandler);
  });

  test('baseline: cursor on dot after `when`, Normal mode, no selection', () => {
    const editor = modeHandler.vimState.editor;
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assert.strictEqual(editor.selection.active.character, DOT_AFTER_WHEN);
    assert.ok(editor.selection.isEmpty, 'no selection initially');
  });

  test('grow #1 → enters Visual; selects `when`', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    const selected = getSelectedText(editor);
    assert.strictEqual(
      modeHandler.vimState.currentMode,
      Mode.Visual,
      `expected Visual after first grow, got ${Mode[modeHandler.vimState.currentMode]}`,
    );
    assert.strictEqual(
      selected,
      'when',
      `expected "when" selected after grow #1, got "${selected}"`,
    );
  });

  test('grow #2 → still Visual; selection extends to `keybinding.when`', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await grow();
    const selected = getSelectedText(editor);
    assert.strictEqual(
      modeHandler.vimState.currentMode,
      Mode.Visual,
      `expected Visual after grow #2, got ${Mode[modeHandler.vimState.currentMode]}`,
    );
    assert.ok(
      selected.includes('keybinding.when') || selected.includes('keybinding'),
      `expected selection to include "keybinding.when" after grow #2, got "${selected}"`,
    );
  });

  test('grow #3 → still Visual; selection extends further', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await grow();
    await grow();
    const selected = getSelectedText(editor);
    assert.strictEqual(
      modeHandler.vimState.currentMode,
      Mode.Visual,
      `expected Visual after grow #3, got ${Mode[modeHandler.vimState.currentMode]}`,
    );
    assert.ok(
      selected.length > 'keybinding.when'.length,
      `expected wider selection after grow #3, got "${selected}" (len ${selected.length})`,
    );
  });

  test('grow #4 → still Visual; selection wraps the includes() call', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await grow();
    await grow();
    await grow();
    const selected = getSelectedText(editor);
    assert.strictEqual(
      modeHandler.vimState.currentMode,
      Mode.Visual,
      `expected Visual after grow #4, got ${Mode[modeHandler.vimState.currentMode]}`,
    );
    assert.ok(
      selected.includes('includes'),
      `expected selection to include "includes" after grow #4, got "${selected}"`,
    );
  });

  test('grow then shrink returns to grow #1 state', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await grow();
    await shrink();
    const selected = getSelectedText(editor);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    assert.strictEqual(selected, 'when', `expected "when" after grow×2+shrink, got "${selected}"`);
  });

  test('grow×4 then shrink×3 returns to `when` selection', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await grow();
    await grow();
    await grow();
    await shrink();
    await shrink();
    await shrink();
    const selected = getSelectedText(editor);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    assert.strictEqual(
      selected,
      'when',
      `expected "when" after grow×4+shrink×3, got "${selected}"`,
    );
  });

  test('grow #1 then yank lands cursor at start of `when` and yanks `when`', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await modeHandler.handleKeyEvent('y');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assert.strictEqual(
      editor.selection.active.character,
      21,
      `expected cursor at col 21 (start of "when"), got col ${editor.selection.active.character}`,
    );
  });

  test('grow×2 then yank yanks the wider selection (covers `keybinding.when`)', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await grow();
    const selectedBefore = getSelectedText(editor);
    await modeHandler.handleKeyEvent('y');
    assert.strictEqual(
      modeHandler.vimState.currentMode,
      Mode.Normal,
      `expected Normal after yank, got ${Mode[modeHandler.vimState.currentMode]}`,
    );
    // After yank the selection collapses; cursor should land at start of the
    // selected range, NOT at column 6 (start of `if`) which is the reported
    // bug.
    assert.notStrictEqual(
      editor.selection.active.character,
      6,
      `regression: cursor jumped to col 6 (start of "if") — the user-reported bug. ` +
        `Pre-yank selection was "${selectedBefore}".`,
    );
  });

  // The user-reported flow: enter Visual via `v` first, then trigger smart
  // select via a vmap remap (`=` -> editor.action.smartSelect.grow). The bug
  // was that the post-remap updateView at modeHandler.ts:659 (since removed)
  // clobbered editor.selection back to the pre-grow range, so the first `=`
  // appeared to be a no-op.
  test('vmap = → smartSelect.grow after `v` actually grows the selection (regression for post-remap updateView clobber)', async () => {
    await setupWorkspace({
      fileExtension: '.ts',
      config: {
        visualModeKeyBindings: [
          {
            before: ['='],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
      },
    });
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
    await seedTSFile(modeHandler);

    await modeHandler.handleKeyEvent('v');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('=');
    await new Promise((r) => setTimeout(r, 50));

    const editor = modeHandler.vimState.editor;
    const selected = getSelectedText(editor);
    assert.ok(
      selected.length > 1,
      `expected vmap = to grow selection beyond 1 char; got "${selected}" (len ${selected.length})`,
    );
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
  });

  test('vimState.cursor tracks selection after grow #2 (no stale cursor)', async () => {
    const editor = modeHandler.vimState.editor;
    await grow();
    await grow();
    const sel = editor.selection;
    const cur = modeHandler.vimState.cursor;
    // Vim-side cursor.start should match selection.anchor (or be anchor-1 if
    // the convention shift puts anchor before stop). cursor.stop should be
    // close to selection.active (within 1 of the convention shift).
    const startMatches =
      cur.start.character === sel.anchor.character ||
      cur.start.character === sel.anchor.character - 1 ||
      cur.start.character === sel.anchor.character + 1;
    const stopMatches =
      cur.stop.character === sel.active.character ||
      cur.stop.character === sel.active.character - 1 ||
      cur.stop.character === sel.active.character + 1;
    assert.ok(
      startMatches,
      `vimState.cursor.start (${cur.start.character}) does not match selection.anchor (${sel.anchor.character})`,
    );
    assert.ok(
      stopMatches,
      `vimState.cursor.stop (${cur.stop.character}) does not match selection.active (${sel.active.character})`,
    );
  });
});
