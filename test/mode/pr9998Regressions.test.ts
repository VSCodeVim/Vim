import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import * as packagejson from '../../package.json';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Red-test suite for issues surfaced reviewing PR #9998. Each `suite` below
// pins one bug; when a test passes the corresponding bug is fixed.

suite('PR #9998 — Bug #1: PageUp/PageDown miss suggestion-widget guard', () => {
  // Sibling bindings — `extension.vim_down`, `extension.vim_up`,
  // `extension.vim_shift+down`, `extension.vim_shift+up` — already guard
  // against intercepting the suggestion widget. PageUp/PageDown are the keys
  // VSCode uses to page through completion lists, so the same guard is
  // needed on their VSCodeVim bindings.

  type Keybinding = { key: string; command: string; when?: string };
  const keybindings = (packagejson as unknown as { contributes: { keybindings: Keybinding[] } })
    .contributes.keybindings;

  const findByCommand = (command: string): Keybinding | undefined =>
    keybindings.find((kb) => kb.command === command);

  for (const command of [
    'extension.vim_pageup',
    'extension.vim_pagedown',
    'extension.vim_shift+pageup',
    'extension.vim_shift+pagedown',
  ]) {
    test(`${command} \`when\` clause excludes suggestWidgetVisible & parameterHintsVisible`, () => {
      const kb = findByCommand(command);
      assert.ok(kb, `keybinding for ${command} not found in package.json`);
      const when = kb.when ?? '';
      assert.ok(
        when.includes('!suggestWidgetVisible'),
        `${command}: \`when\` should include !suggestWidgetVisible (got: ${when})`,
      );
      assert.ok(
        when.includes('!parameterHintsVisible'),
        `${command}: \`when\` should include !parameterHintsVisible (got: ${when})`,
      );
    });
  }
});

suite('PR #9998 — Bug #2: <C-BS> is dead in Normal/Visual', () => {
  // `MoveLeft` (motion.ts) used to claim `<C-BS>` as one of its keys for the
  // same modes (Normal, Visual*) as `MoveBeginningWordCtrlBS`.
  // `getRelevantAction` returns the first registered match, so the word-back
  // class never fired — `<C-BS>` instead behaved like `<BS>` (char left).
  //
  // `<C-BS>` uses small-word (`b`), matching `<C-Left>` and Insert-mode's
  // `deleteWordLeft`. `<S-BS>` is char-back (matches VSCode's default
  // Shift+Backspace = deleteLeft).

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: '<C-BS> in Normal moves to start of small word (like b, stops at punctuation)',
    start: ['hello.world fo|o'],
    keysPressed: '<C-BS>',
    end: ['hello.world |foo'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-BS> at start of word in Normal jumps over punctuation boundary as small word',
    start: ['hello.world |foo'],
    keysPressed: '<C-BS>',
    end: ['hello.|world foo'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-BS> in Visual extends to start of small word',
    start: ['hello.world fo|o'],
    keysPressed: 'v<C-BS>',
    end: ['hello.world |foo'],
    endMode: Mode.Visual,
  });

  newTest({
    title: '<S-BS> in Normal moves one char left (matches <BS>)',
    start: ['hello wo|rld'],
    keysPressed: '<S-BS>',
    end: ['hello w|orld'],
    endMode: Mode.Normal,
  });
});

// Bug #3 (`MoveLineEnd` / `MoveLineBegin` hardcode `setCurrentMode(Mode.Normal)`
// in their stopsel branches) was a wrong call in the review. `VimState.setCurrentMode`
// itself has a safety net (vimState.ts:~302) that, when leaving Visual with
// `modeBeforeEnteringVisualMode` set to Insert/Replace, rewrites the requested
// mode to that stored target. So the hardcoded `Normal` is silently corrected
// and the round-trip works. Remaining concern is purely consistency / dead-code
// risk if that safety net is later removed — not a behavior bug, no red test.

suite('PR #9998 — Bug #4: status bar empty during operator-pending', () => {
  // `statusBar.ts` switches on `currentModeIncludingPseudoModes`. While an
  // operator is pending in Normal, that getter returns
  // `Mode.OperatorPendingMode` — which has no case in the switch and falls
  // through to `default → ''`. Previously the switch keyed off
  // `vimState.modeData.mode`, which is the underlying Normal, so the bar
  // showed `-- NORMAL --`. These tests pin that the bar is non-empty
  // during operator-pending.

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: "after `d`, status bar shows '-- NORMAL --' (not empty)",
    start: ['ab|cd'],
    keysPressed: 'd',
    end: ['ab|cd'],
    statusBar: '-- NORMAL --',
  });

  newTest({
    title: "after `c`, status bar shows '-- NORMAL --' (not empty)",
    start: ['ab|cd'],
    keysPressed: 'c',
    end: ['ab|cd'],
    statusBar: '-- NORMAL --',
  });

  newTest({
    title: "after `y`, status bar shows '-- NORMAL --' (not empty)",
    start: ['ab|cd'],
    keysPressed: 'y',
    end: ['ab|cd'],
    statusBar: '-- NORMAL --',
  });
});

suite('PR #9998 — Bug #5: <C-Right>/<C-Left> use W/B instead of w/b', () => {
  // `:help <C-Right>` and `:help <C-Left>` define them as Vim's `w` / `b`
  // motions (small-word). The shifted siblings <C-S-Right> / <C-S-Left> are
  // implemented with `MoveWordBegin` / `MoveBeginningWord` (small-word, w/b)
  // — but the unshifted <C-Right> / <C-Left> mistakenly use
  // `MoveFullWordBegin` / `MoveBeginningFullWord` (BIG-word, W/B). The pair
  // disagrees with each other AND with Vim's documented default.
  //
  // Word definitions in `hello.world foo`:
  //   - small-word (w):  hello | . | world | foo
  //   - WORD       (W):  hello.world  | foo
  // So `w` from column 0 lands on `.` (column 5); `W` skips past
  // `hello.world` to `foo` (column 12).

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: '<C-right> in Normal moves to next small word (w), not WORD (W)',
    start: ['|hello.world foo'],
    keysPressed: '<C-right>',
    end: ['hello|.world foo'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-left> in Normal moves back to previous small word (b), not WORD (B)',
    start: ['hello.wor|ld foo'],
    keysPressed: '<C-left>',
    end: ['hello.|world foo'],
    endMode: Mode.Normal,
  });

  // Cross-check against the shifted siblings: the existing keymodel.test.ts
  // suite covers <C-S-right> / <C-S-left> with `hello world` (no punctuation),
  // where w and W happen to agree. These cases use punctuation so the two
  // word-definitions diverge — and pin that <C-Right> stays in lockstep with
  // <C-S-Right>.
  newTest({
    title: '<C-S-right> uses small-word, lands on `.` (consistency anchor)',
    config: {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
    },
    start: ['|hello.world foo'],
    keysPressed: '<C-S-right>',
    end: ['hello.|world foo'],
    endMode: Mode.Visual,
  });

  newTest({
    title: '<C-S-left> uses small-word, lands at start of `world` (consistency anchor)',
    config: {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
    },
    start: ['hello.wor|ld foo'],
    keysPressed: '<C-S-left>',
    end: ['hello.|world foo'],
    endMode: Mode.Visual,
  });
});

suite('PR #9998 — Bug #6: <S-Up>/<S-Down> are silent no-ops with empty keymodel', () => {
  // `:help <S-Up>` documents <S-Up> as equivalent to <C-B> (page up) and
  // <S-Down> as <C-F> (page down) — these are the Vim defaults regardless of
  // keymodel. With keymodel containing 'startsel', they additionally start a
  // Visual selection and move one line (the existing behaviour, covered by
  // keymodel.test.ts).
  //
  // Bug: `MoveUpShifted` / `MoveDownShifted` gate via `couldActionApply` on
  // `keymodelStartsSelection`. When startsel is off, the action becomes
  // invisible to the dispatcher — but `extension.vim_shift+up` /
  // `extension.vim_shift+down` still claim the keybinding in package.json,
  // so VSCode never falls back to native and the key becomes a silent no-op.
  //
  // Expected: with empty keymodel, <S-Up> = <C-B>, <S-Down> = <C-F>.

  const emptyKeymodel = {
    keymodel: '',
    keymodelStartsSelection: false,
    keymodelStopsSelection: false,
  };

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: '<S-up> with empty keymodel acts like <C-b> (page up), no Visual',
    config: emptyKeymodel,
    start: ['line one', 'line tw|o'],
    keysPressed: '<S-up>',
    end: ['|line one', 'line two'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<S-down> with empty keymodel acts like <C-f> (page down), no Visual',
    config: emptyKeymodel,
    start: ['line on|e', 'line two'],
    keysPressed: '<S-down>',
    end: ['line one', '|line two'],
    endMode: Mode.Normal,
  });

  // Sanity: with startsel ON, <S-up>/<S-down> still move ONE line and enter
  // Visual (the existing keymodel.test.ts behaviour). Pinned here so a
  // future fix doesn't accidentally collapse <S-up> into page-up unconditionally.
  const startsel = {
    keymodel: 'startsel',
    keymodelStartsSelection: true,
    keymodelStopsSelection: false,
  };

  newTest({
    title: '<S-up> with startsel still moves one line + enters Visual (no regression)',
    config: startsel,
    start: ['abcd', 'ef|gh'],
    keysPressed: '<S-up>',
    end: ['ab|cd', 'efgh'],
    endMode: Mode.Visual,
  });

  newTest({
    title: '<S-down> with startsel still moves one line + enters Visual (no regression)',
    config: startsel,
    start: ['ab|cd', 'efgh'],
    keysPressed: '<S-down>',
    end: ['abcd', 'efg|h'],
    endMode: Mode.Visual,
  });
});

suite('PR #9998 — Bug #7: R<C-o> not wired (Replace + <C-o> is a no-op)', () => {
  // `ExecuteOneNormalCommandInInsertMode` (insert.ts) is registered only for
  // `Mode.Insert`. In Replace mode, <C-o> has no matching action — Vim's
  // documented behaviour (`:help i_CTRL-O`) is the same as in Insert: leave
  // for one Normal command, then return to Replace.
  //
  // The pseudo-mode infrastructure already supports this:
  // `modeToReturnToAfterNormalCommand` is typed as `Mode.Insert | Mode.Replace`
  // and the runAction reentry path correctly dispatches to the stored target.
  // Only the entry action is missing for Replace.

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: 'Replace + <C-o>w runs one Normal command, returns to Replace',
    start: ['hel|lo world'],
    keysPressed: 'R<C-o>w',
    end: ['hello |world'],
    endMode: Mode.Replace,
  });

  newTest({
    title: "Replace + <C-o> shows '-- (replace) --' in the status bar",
    start: ['a|bcd'],
    keysPressed: 'R<C-o>',
    end: ['a|bcd'],
    statusBar: '-- (replace) --',
  });

  newTest({
    title: 'Replace + <C-o>dw deletes a word, returns to Replace',
    start: ['hel|lo world'],
    keysPressed: 'R<C-o>dw',
    end: ['hel|world'],
    endMode: Mode.Replace,
  });
});

suite('PR #9998 — Bug #8: <PageUp>/<PageDown> are silent no-ops in Insert', () => {
  // package.json now binds plain `PageUp`/`PageDown` for all modes (no
  // `vim.mode != 'Insert'` guard). `CommandMoveFullPageUp`/`Down` inherit
  // modes from `CommandScrollAndMoveCursor` = Normal/Visual only, so in
  // Insert the keybinding fires `extension.vim_pageup`, no action matches,
  // the key is swallowed, and VSCode never gets to handle it natively.
  // Master left these bindings absent, so VSCode's native page-up/down took
  // effect in Insert. Net result is a regression in Insert.
  //
  // The shifted variants (`<S-PageUp>`/`<S-PageDown>`) work in Insert
  // because their dedicated classes explicitly include Insert/Replace —
  // these tests pin the unshifted siblings to the same coverage.
  //
  // Preferred fix: extend `CommandMoveFullPageUp`/`Down` modes to include
  // Insert/Replace (same as the shifted variants). Adding
  // `vim.mode != 'Insert'` to the package.json `when` clause would also fix
  // it for users but not for the test harness, since handleKeyEvent doesn't
  // fall back to VSCode native.

  setup(async () => {
    await setupWorkspace({
      fileContent: ['line one', 'line two', 'line three'],
    });
  });

  test('<PageUp> in Insert moves the cursor (not a silent no-op)', async () => {
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    await handler.handleKeyEvent('G');
    await handler.handleKeyEvent('i');
    const startLine = handler.vimState.cursorStopPosition.line;

    await handler.handleKeyEvent('<PageUp>');

    assert.notStrictEqual(
      handler.vimState.cursorStopPosition.line,
      startLine,
      '<PageUp> in Insert should move the cursor up; it did not (silent no-op)',
    );
    assert.strictEqual(handler.vimState.currentMode, Mode.Insert);
  });

  test('<PageDown> in Insert moves the cursor (not a silent no-op)', async () => {
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    await handler.handleKeyEvent('g');
    await handler.handleKeyEvent('g');
    await handler.handleKeyEvent('i');
    const startLine = handler.vimState.cursorStopPosition.line;

    await handler.handleKeyEvent('<PageDown>');

    assert.notStrictEqual(
      handler.vimState.cursorStopPosition.line,
      startLine,
      '<PageDown> in Insert should move the cursor down; it did not (silent no-op)',
    );
    assert.strictEqual(handler.vimState.currentMode, Mode.Insert);
  });
});

suite('PR #9998 — Guard: click past EOL clamps cursor to last char', () => {
  // Originally written as a red regression test on the suspicion that the
  // PR's rewrite of the lastClickWasPastEol branch in
  // `modeHandler.handleSelectionChange` had broken cursor clamping: the old
  // assignment `newPosition.withColumn(getLineEnd().character - 1)` followed
  // by a write to `cursorStopPosition` was replaced with
  // `await this.handleKeyEvent('<LeftMouse>'); return;`, leaving the
  // `withColumn` line as dead code. `MoveLeftMouse` then sets the cursor to
  // the raw past-EOL position from `editor.selection.active`.
  //
  // In practice the cursor still ends at the last valid Normal-mode column,
  // because a downstream clamp (the `currentStopLineLength` adjustment in
  // `runAction`) corrects the position after `MoveLeftMouse` returns. So
  // this is not a regression — but the invariant ("click past EOL must NOT
  // strand the Normal-mode cursor past the last char") is load-bearing and
  // worth pinning, since it now relies on a clamp two layers removed from
  // the mouse path. If the downstream clamp is ever moved or removed, this
  // test catches the real regression.

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

  test('click past EOL in Normal clamps cursor to last char', async () => {
    // 'hello' is 5 chars (cols 0–4). Clicking at col 5 lands on the line-end
    // position; in Normal mode the valid cursor range is [0, lineLength-1],
    // so the cursor must clamp to col 4.
    await simulateMouseClick(new vscode.Position(0, 5));
    assert.strictEqual(
      modeHandler.vimState.cursorStopPosition.character,
      4,
      'cursor should clamp to col 4 (last valid Normal-mode position), ' +
        `not stay at col ${modeHandler.vimState.cursorStopPosition.character}`,
    );
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });
});

suite('PR #9998 — Bug #10: vim.keymodel default leaves the user stuck in Visual', () => {
  // package.json defaults `vim.keymodel` to bare `"startsel"`. With only
  // `startsel`, `<S-right>` enters Visual but unshifted `<right>` does NOT
  // exit (no `stopsel`), so a VSCode-muscle-memory user pressing
  // `<S-right>` then `<right>` to deselect ends up stranded in Visual until
  // <Esc>. Vim defaults to `""`; gVim defaults to `"startsel,stopsel"`.
  // Bare `"startsel"` is non-standard and produces the only stuck-in-Visual
  // combination of the four enum values.
  //
  // Expected default: `"startsel,stopsel"` (gVim parity, sane default for
  // VSCode users — <S-arrow> selects, plain arrow deselects).

  test('vim.keymodel default is "startsel,stopsel"', () => {
    const props = (
      packagejson as unknown as {
        contributes: {
          configuration: {
            properties: Record<string, { default?: unknown }>;
          };
        };
      }
    ).contributes.configuration.properties;
    const def = props['vim.keymodel']?.default;
    assert.strictEqual(
      def,
      'startsel,stopsel',
      `vim.keymodel default is ${JSON.stringify(def)}; expected "startsel,stopsel". ` +
        `Bare "startsel" enters Visual on <S-arrow> but never exits on <arrow> ` +
        `(no stopsel), leaving the user stranded in Visual until <Esc>.`,
    );
  });
});
