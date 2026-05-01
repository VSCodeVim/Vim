import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Coverage for issue #2224: native VSCode selection-changing commands should
// promote VSCodeVim out of Normal into Visual so subsequent operators
// (`d`, `y`, `c`, etc.) act on the selection.
//
// `handleSelectionChange` promotes on:
//   - Command-kind events with non-empty selections
//     (e.g. `editor.action.smartSelect.grow`)
//   - Keyboard-kind events with non-empty selections
//     (e.g. `expandLineSelection`, `cursorRightSelect`)
//
// Tests bind each VSCode command to a leader key so the harness can dispatch
// it and observe the resulting Vim mode. Negative cases (Vim navigation that
// must NOT promote) live in `selectionPromotion.test.ts`.

suite('issue #2224: VSCode selection commands enter Visual', () => {
  setup(async () => {
    await setupWorkspace();
  });

  newTest({
    title: 'expandLineSelection from Normal enters Visual',
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
    end: ['the quick brown fox', '|jumps over the lazy dog'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'editor.action.smartSelect.grow from Normal enters Visual',
    config: {
      normalModeKeyBindings: [
        {
          before: ['<leader>', 'g'],
          commands: ['editor.action.smartSelect.grow'],
        },
      ],
      leader: ' ',
    },
    start: ['function fo|o() { return 42; }'],
    keysPressed: ' g',
    end: ['function foo|() { return 42; }'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'cursorRightSelect from Normal enters Visual',
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
    end: ['ab|cd'],
    endMode: Mode.Visual,
  });

  newTest({
    title: 'cursorDownSelect from Normal enters Visual',
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
    end: ['abcd', 'ef|gh'],
    endMode: Mode.Visual,
  });
});
