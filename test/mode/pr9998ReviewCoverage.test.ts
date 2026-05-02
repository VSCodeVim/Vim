import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { isPseudoMode, isStatusBarMode, isVisualMode, Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Coverage for issues raised in the critical review of PR #9998 that are
// not already pinned by `pr9998Regressions.test.ts`. Each `suite` block
// matches one item from the review.

suite('PR #9998 review — A: <C-BS> in Replace is single-char, not word-back', () => {
  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: '<C-BS> in Replace deletes one char (matches <BS>, NOT word-back like Insert)',
    start: ['hello wor|ld'],
    keysPressed: 'R<C-BS>',
    end: ['hello wo|rld'],
    endMode: Mode.Replace,
  });

  newTest({
    title: '<C-BS> in Insert DOES delete the previous word (consistency anchor)',
    start: ['|'],
    keysPressed: 'ihello world<C-BS>',
    end: ['hello |'],
    endMode: Mode.Insert,
  });
});

suite('PR #9998 review — B: mouse drag right-to-left preserves cursor.start', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
    await modeHandler.handleMultipleKeyEvents('ihello world'.split(''));
    await modeHandler.handleKeyEvent('<Esc>');
    await modeHandler.handleKeyEvent('0');
  });

  const simulateMouseDrag = async (
    anchor: vscode.Position,
    active: vscode.Position,
  ): Promise<void> => {
    const editor = modeHandler.vimState.editor;
    editor.selection = new vscode.Selection(anchor, active);
    await modeHandler.handleSelectionChange({
      textEditor: editor,
      selections: [editor.selection],
      kind: vscode.TextEditorSelectionChangeKind.Mouse,
    });
  };

  test('left-to-right drag (anchor=col0 → active=col5) deletes the 5-char range "hello"', async () => {
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('d');
    assert.strictEqual(modeHandler.vimState.document.getText(), ' world');
  });

  test('right-to-left drag (anchor=col5 → active=col0) deletes the SAME 5-char range as LTR', async () => {
    await simulateMouseDrag(new vscode.Position(0, 5), new vscode.Position(0, 0));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('d');
    const text = modeHandler.vimState.document.getText();
    assert.strictEqual(
      text,
      ' world',
      `RTL drag must select the same range as LTR (' world' after d). Got '${text}': ` +
        'cursor.start was not adjusted with getLeft() when selectionStart is after the active position.',
    );
  });
});

suite('PR #9998 review — C: mouse drag from Insert enters (insert) VISUAL pseudo', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
    await modeHandler.handleMultipleKeyEvents('ihello world'.split(''));
    await modeHandler.handleKeyEvent('<Esc>');
    await modeHandler.handleKeyEvent('0');
  });

  const simulateMouseDrag = async (
    anchor: vscode.Position,
    active: vscode.Position,
  ): Promise<void> => {
    const editor = modeHandler.vimState.editor;
    editor.selection = new vscode.Selection(anchor, active);
    await modeHandler.handleSelectionChange({
      textEditor: editor,
      selections: [editor.selection],
      kind: vscode.TextEditorSelectionChangeKind.Mouse,
    });
  };

  test('Insert + mouse drag enters Visual with modeBeforeEnteringVisualMode=Insert', async () => {
    await modeHandler.handleKeyEvent('i');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);

    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 5));

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    assert.strictEqual(
      modeHandler.vimState.modeBeforeEnteringVisualMode,
      Mode.Insert,
      'modeBeforeEnteringVisualMode should be Insert so <Esc> returns to Insert',
    );
  });

  test('Insert + drag → Esc returns to Insert (not Normal)', async () => {
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('<Esc>');

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });

  test('Insert + drag synthesises -- (insert) VISUAL -- via currentModeWithoutOperatorPending', async () => {
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 5));

    assert.strictEqual(modeHandler.vimState.currentModeWithoutOperatorPending, Mode.InsertVisual);
  });
});

suite('PR #9998 review — D: count chaining survives recordedState.count clear', () => {
  // executeOperator now ends with `recordedState.count = 0; operatorCount = 0`.
  // Verify that legitimate count chains still produce correct counts.

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: '`2d3w` deletes 6 words (count×operatorCount, not just operatorCount)',
    start: ['|aa bb cc dd ee ff gg hh'],
    keysPressed: '2d3w',
    end: ['|gg hh'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '`3dw` deletes 3 words',
    start: ['|aa bb cc dd ee'],
    keysPressed: '3dw',
    end: ['|dd ee'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '`dw.` repeats once (no count carry)',
    start: ['|aa bb cc dd'],
    keysPressed: 'dw.',
    end: ['|cc dd'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '`3dw` then `.` repeats with count 3 (deletes 3 more words)',
    start: ['|aa bb cc dd ee ff gg'],
    keysPressed: '3dw.',
    end: ['|gg'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '`dw` then `3.` overrides the repeat count to 3',
    start: ['|aa bb cc dd ee'],
    keysPressed: 'dw3.',
    end: ['|ee'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'consecutive operators do not inherit count: `2dw dw` deletes 3 words',
    start: ['|aa bb cc dd ee'],
    keysPressed: '2dwdw',
    end: ['|dd ee'],
    endMode: Mode.Normal,
  });
});

suite('PR #9998 review — E: <C-o> state cleanup on return to Insert/Replace', () => {
  // setCurrentMode and setModeData each clear modeToReturnToAfterNormalCommand
  // when transitioning to Insert/Replace. Pin that the flag IS undefined after
  // the round-trip — duplicated guards are a refactor smell but the cleanup
  // contract is what matters externally.

  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
    await modeHandler.handleMultipleKeyEvents('ihello world'.split(''));
    await modeHandler.handleKeyEvent('<Esc>');
    await modeHandler.handleKeyEvent('0');
  });

  test('Insert + <C-o>w returns to Insert with modeToReturnToAfterNormalCommand cleared', async () => {
    await modeHandler.handleKeyEvent('i');
    await modeHandler.handleKeyEvent('<C-o>');
    assert.strictEqual(
      modeHandler.vimState.modeToReturnToAfterNormalCommand,
      Mode.Insert,
      'flag must be set after <C-o>',
    );

    await modeHandler.handleKeyEvent('w');

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    assert.strictEqual(
      modeHandler.vimState.modeToReturnToAfterNormalCommand,
      undefined,
      'flag must be cleared after the one Normal command finishes',
    );
  });

  test('Replace + <C-o>w returns to Replace with the flag cleared', async () => {
    await modeHandler.handleKeyEvent('R');
    await modeHandler.handleKeyEvent('<C-o>');
    assert.strictEqual(modeHandler.vimState.modeToReturnToAfterNormalCommand, Mode.Replace);

    await modeHandler.handleKeyEvent('w');

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Replace);
    assert.strictEqual(modeHandler.vimState.modeToReturnToAfterNormalCommand, undefined);
  });

  test('modeBeforeEnteringVisualMode is cleared on leaving Visual', async () => {
    await modeHandler.handleKeyEvent('i');
    const editor = modeHandler.vimState.editor;
    editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleSelectionChange({
      textEditor: editor,
      selections: [editor.selection],
      kind: vscode.TextEditorSelectionChangeKind.Mouse,
    });
    assert.strictEqual(modeHandler.vimState.modeBeforeEnteringVisualMode, Mode.Insert);

    await modeHandler.handleKeyEvent('<Esc>');

    assert.strictEqual(
      modeHandler.vimState.modeBeforeEnteringVisualMode,
      undefined,
      'flag must be cleared after leaving Visual',
    );
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });
});

suite('PR #9998 review — F: Mode enum reorder did not break the helpers', () => {
  // The PR reordered the Mode enum to group pseudo-modes after Disabled, which
  // shifted every numeric value. These pure-function helpers are the contracts
  // most likely to silently miscompare if a Mode value is hard-coded.

  test('isPseudoMode covers all 9 documented pseudo-modes', () => {
    const pseudos = [
      Mode.OperatorPendingMode,
      Mode.InsertNormal,
      Mode.ReplaceNormal,
      Mode.InsertVisual,
      Mode.InsertVisualLine,
      Mode.InsertVisualBlock,
      Mode.ReplaceVisual,
      Mode.ReplaceVisualLine,
      Mode.ReplaceVisualBlock,
    ];
    for (const m of pseudos) {
      assert.strictEqual(isPseudoMode(m), true, `${Mode[m]} should be a pseudo-mode`);
    }
  });

  test('isPseudoMode rejects every real mode', () => {
    const real = [
      Mode.Normal,
      Mode.Insert,
      Mode.Replace,
      Mode.Visual,
      Mode.VisualLine,
      Mode.VisualBlock,
      Mode.SearchInProgressMode,
      Mode.CommandlineInProgress,
      Mode.EasyMotionMode,
      Mode.EasyMotionInputMode,
      Mode.SurroundInputMode,
      Mode.Disabled,
    ];
    for (const m of real) {
      assert.strictEqual(isPseudoMode(m), false, `${Mode[m]} must not be a pseudo-mode`);
    }
  });

  test('isVisualMode rejects pseudo-Visual modes (they pose as Visual via currentModeWithoutOperatorPending)', () => {
    assert.strictEqual(isVisualMode(Mode.Visual), true);
    assert.strictEqual(isVisualMode(Mode.VisualLine), true);
    assert.strictEqual(isVisualMode(Mode.VisualBlock), true);
    assert.strictEqual(isVisualMode(Mode.InsertVisual), false);
    assert.strictEqual(isVisualMode(Mode.ReplaceVisualBlock), false);
  });

  test('isStatusBarMode unaffected by the reorder', () => {
    assert.strictEqual(isStatusBarMode(Mode.SearchInProgressMode), true);
    assert.strictEqual(isStatusBarMode(Mode.CommandlineInProgress), true);
    assert.strictEqual(isStatusBarMode(Mode.Normal), false);
    assert.strictEqual(isStatusBarMode(Mode.Disabled), false);
  });
});

suite('PR #9998 review — G: Visual-mode remap redraws the new selection', () => {
  // The PR added an unconditional updateView() after handledAsRemap when the
  // resulting mode is Visual. Pin that a vmap that extends the selection ends
  // with both vimState.cursor and editor.selection in agreement.

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: 'vmap x → ll: pressing x in Visual extends selection by 2 chars',
    config: {
      visualModeKeyBindings: [{ before: ['x'], after: ['l', 'l'] }],
    },
    start: ['ab|cdefg'],
    keysPressed: 'vx',
    end: ['abcde|fg'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'vmap remap result is operable: subsequent `d` deletes the extended range',
    config: {
      visualModeKeyBindings: [{ before: ['x'], after: ['l', 'l'] }],
    },
    start: ['ab|cdefg'],
    keysPressed: 'vxd',
    end: ['ab|fg'],
    endMode: Mode.Normal,
  });
});

suite('PR #9998 review — H: visual remaps fire in (insert) VISUAL pseudo', () => {
  // `VisualModeRemapper` now subscribes to all 6 InsertVisual* / ReplaceVisual*
  // pseudo-modes. Pin that a vmap registered as visualModeKeyBindings actually
  // fires while the remapper sees one of those pseudo-modes
  // (entered via i<S-right>).

  newTest({
    title: 'vmap x → ll fires while in (insert) VISUAL via i<S-right>',
    config: {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
      visualModeKeyBindings: [{ before: ['x'], after: ['l', 'l'] }],
    },
    start: ['ab|cdefg'],
    keysPressed: 'i<S-right>x',
    end: ['abcdef|g'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'after vmap fires in pseudo, <Esc> still returns to Insert',
    config: {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
      visualModeKeyBindings: [{ before: ['x'], after: ['l', 'l'] }],
    },
    start: ['ab|cdefg'],
    keysPressed: 'i<S-right>x<Esc>',
    end: ['abcde|fg'],
    endMode: Mode.Insert,
  });
});

suite('PR #9998 review — I: re-drag while already in Visual updates, does not re-enter', () => {
  // `mouseSelectionGoesIntoVisualMode && !isVisualMode(currentMode)` guards the
  // setCurrentMode(Visual) call. Pin that a second drag while already in
  // Visual just updates the cursor range and does not emit a new
  // mode-transition (which would clobber modeBeforeEnteringVisualMode).

  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
    await modeHandler.handleMultipleKeyEvents('ihello world'.split(''));
    await modeHandler.handleKeyEvent('<Esc>');
    await modeHandler.handleKeyEvent('0');
  });

  const simulateMouseDrag = async (
    anchor: vscode.Position,
    active: vscode.Position,
  ): Promise<void> => {
    const editor = modeHandler.vimState.editor;
    editor.selection = new vscode.Selection(anchor, active);
    await modeHandler.handleSelectionChange({
      textEditor: editor,
      selections: [editor.selection],
      kind: vscode.TextEditorSelectionChangeKind.Mouse,
    });
  };

  test('second drag in Insert→Visual keeps modeBeforeEnteringVisualMode=Insert', async () => {
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 3));
    assert.strictEqual(modeHandler.vimState.modeBeforeEnteringVisualMode, Mode.Insert);

    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 7));

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    assert.strictEqual(
      modeHandler.vimState.modeBeforeEnteringVisualMode,
      Mode.Insert,
      'a second drag must not clobber the Insert return target',
    );
  });

  test('second drag updates cursor.stop to the new active position', async () => {
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 3));
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 7));

    assert.strictEqual(modeHandler.vimState.cursor.stop.character, 7);
    assert.strictEqual(modeHandler.vimState.cursor.start.character, 0);
  });
});

suite('PR #9998 review — J: click past EOL in Insert leaves mode in Insert', () => {
  // The past-EOL block has `if (currentMode !== Mode.Insert)` so the clamp
  // path is skipped for Insert. Pin that an Insert-mode click past EOL stays
  // Insert and does not flip into Visual via the empty-selection branch.

  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace({ fileContent: ['hello'] });
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  const simulateMouseClick = async (position: vscode.Position): Promise<void> => {
    const editor = modeHandler.vimState.editor;
    editor.selection = new vscode.Selection(position, position);
    await modeHandler.handleSelectionChange({
      textEditor: editor,
      selections: [editor.selection],
      kind: vscode.TextEditorSelectionChangeKind.Mouse,
    });
  };

  test('Insert-mode click past EOL stays in Insert', async () => {
    await modeHandler.handleKeyEvent('A');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);

    await simulateMouseClick(new vscode.Position(0, 5));

    assert.strictEqual(
      modeHandler.vimState.currentMode,
      Mode.Insert,
      'past-EOL click in Insert must not flip mode',
    );
  });
});

suite(
  'PR #9998 review — K: Keyboard-kind promotion ignores non-empty selection in VisualLine',
  () => {
    // The Keyboard-kind promotion branch only allows {Normal, Insert, Replace}
    // (and excludes Insert/Replace when isSnippetSelectionChange()).
    // VisualLine and VisualBlock take the early `if (isVisualMode) return;`
    // path. Pin that an external selection-change does NOT collapse VisualLine
    // back into charwise Visual.

    let modeHandler: ModeHandler;

    setup(async () => {
      await setupWorkspace({ fileContent: ['line one', 'line two', 'line three'] });
      const handler = await getAndUpdateModeHandler();
      assert.ok(handler);
      modeHandler = handler;
    });

    test('VisualLine survives a Keyboard-kind external selection change', async () => {
      await modeHandler.handleKeyEvent('V');
      assert.strictEqual(modeHandler.vimState.currentMode, Mode.VisualLine);

      const editor = modeHandler.vimState.editor;
      editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(1, 4));
      await modeHandler.handleSelectionChange({
        textEditor: editor,
        selections: [editor.selection],
        kind: vscode.TextEditorSelectionChangeKind.Keyboard,
      });

      assert.strictEqual(
        modeHandler.vimState.currentMode,
        Mode.VisualLine,
        'VisualLine must not be downgraded to charwise Visual by external selection events',
      );
    });
  },
);
