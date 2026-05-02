import * as assert from 'assert';

import * as packagejson from '../../package.json';
import { Mode } from '../../src/mode/mode';
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
  // same modes (Normal, Visual*) as `MoveBeginningFullWordCtrlBS`.
  // `getRelevantAction` returns the first registered match, so the word-back
  // class never fired — `<C-BS>` instead behaved like `<BS>` (char left).
  //
  // `<S-BS>` is intentionally left as a char-back motion (matches VSCode's
  // default Shift+Backspace = deleteLeft and the Insert-mode <S-BS> = <BS>
  // symmetry).

  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: '<C-BS> in Normal moves to start of WORD (like B)',
    start: ['hello.dot wo|rld'],
    keysPressed: '<C-BS>',
    end: ['hello.dot |world'],
    endMode: Mode.Normal,
  });

  newTest({
    title: '<C-BS> in Visual extends to start of WORD',
    start: ['hello.dot wo|rld'],
    keysPressed: 'v<C-BS>',
    end: ['hello.dot |world'],
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
