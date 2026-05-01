import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Coverage for issue #2224: native VSCode selection-changing commands should
// promote VSCodeVim out of NORMAL into VISUAL so that subsequent Vim
// operators (`d`, `y`, `c`, etc.) operate on the selection. The promotion
// happens in `handleSelectionChange` (modeHandler.ts) when a selection event
// arrives with kind=Command (e.g. smartSelect.grow) or kind=Keyboard with a
// non-empty selection (e.g. expandLineSelection, cursorRightSelect) while
// VSCodeVim is in Normal/Insert/Replace.
//
// The Keyboard-kind branch was added as part of closing #2224 — see
// modeHandler.ts:320-345. The Command-kind branch already existed at master
// (see test/mode/modeVisual.test.ts:1740 for the existing smartSelect.grow
// test). Regression-guards for non-promoting cases (Vim navigation `j`, `k`,
// `cursorRight`, etc.) are in test/mode/selectionPromotion.test.ts.
//
// Pattern: bind the VSCode command to a leader keybinding and assert the
// resulting Vim mode after the keypress (same pattern as
// modeVisual.test.ts:1747).

suite('issue #2224: VSCode external commands enter Visual', () => {
  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: 'H1: expandLineSelection from Normal enters Visual (line-selected)',
    config: {
      normalModeKeyBindings: [
        {
          before: ['<leader>', 'l'],
          commands: ['expandLineSelection'],
        },
      ],
      leader: ' ',
    },
    start: ['the |quick brown fox', 'jumps over the lazy dog'],
    keysPressed: ' l',
    // expandLineSelection makes selection (0,0)-(1,0); cursor.stop reported (1,0).
    end: ['the quick brown fox', '|jumps over the lazy dog'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'H2: editor.action.smartSelect.grow from Normal enters Visual (regression-protect)',
    config: {
      normalModeKeyBindings: [
        {
          before: ['<leader>', 'g'],
          commands: ['editor.action.smartSelect.grow'],
        },
      ],
      leader: ' ',
    },
    // smartSelect on a word grows to the word; canonical #2224 case.
    start: ['function fo|o() { return 42; }'],
    keysPressed: ' g',
    // grew to 'function foo' (cols 0-11); Visual fwd shift → cursor.stop = col 12
    end: ['function foo|() { return 42; }'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'H3: cursorRightSelect (VSCode-native Shift+Right) from Normal enters Visual',
    config: {
      normalModeKeyBindings: [
        {
          before: ['<leader>', 'r'],
          commands: ['cursorRightSelect'],
        },
      ],
      leader: ' ',
    },
    start: ['a|bcd'],
    keysPressed: ' r',
    // selection from anchor (0,1) to active (0,2); harness reports cursor.stop = col 2
    end: ['ab|cd'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'H4: cursorDownSelect (VSCode-native Shift+Down) from Normal enters Visual',
    config: {
      normalModeKeyBindings: [
        {
          before: ['<leader>', 'd'],
          commands: ['cursorDownSelect'],
        },
      ],
      leader: ' ',
    },
    start: ['ab|cd', 'efgh'],
    keysPressed: ' d',
    // cursorDownSelect from (0,2) makes selection (0,2)-(1,2)
    end: ['abcd', 'ef|gh'],
    endMode: Mode.Visual,
  });
});
