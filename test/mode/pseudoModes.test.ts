import { Mode } from '../../src/mode/mode';
import { newTest, newTestSkip } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Pseudo-modes are synthesized labels for Vim states where one mode is
// temporarily nested inside another:
//
//   - `(insert) VISUAL`  — Insert + <S-arrow>: in Visual mode but `<Esc>` returns to Insert
//   - `(replace) VISUAL` — Replace + <S-arrow>: same idea, returns to Replace
//   - `(insert) ` (no NORMAL suffix, by design) — Insert + <C-o>: pending one Normal command
//
// They never appear as `vimState.currentMode`; they're synthesized via
// `currentModeIncludingPseudoModes` for the status bar and the remapper.

suite('pseudo-modes', () => {
  setup(async () => {
    await setupWorkspace();
  });

  suite('Insert ↔ Visual via <S-arrow>', () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
    };

    newTest({
      title: 'Insert + <S-right> enters Visual; <Esc> returns to Insert',
      config,
      start: ['a|bcd'],
      keysPressed: 'i<S-right><Esc>',
      end: ['ab|cd'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Insert + <S-right> shows `(insert) VISUAL` in the status bar',
      config,
      start: ['a|bcd'],
      keysPressed: 'i<S-right>',
      end: ['abc|d'],
      endMode: Mode.Visual,
      statusBar: '-- (insert) VISUAL --',
    });

    newTest({
      title: 'Insert + <S-right>d deletes selection and returns to Insert',
      config,
      start: ['a|bcde'],
      keysPressed: 'i<S-right>d',
      end: ['a|de'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Insert + <S-down><Esc> returns to Insert',
      config,
      start: ['ab|cd', 'efgh'],
      keysPressed: 'i<S-down><Esc>',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Insert + <C-S-right><Esc> returns to Insert',
      config,
      start: ['|hello world'],
      keysPressed: 'i<C-S-right><Esc>',
      end: ['hello |world'],
      endMode: Mode.Insert,
    });
  });

  suite('Replace ↔ Visual via <S-arrow>', () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
    };

    newTest({
      title: 'Replace + <S-right><Esc> returns to Replace',
      config,
      start: ['a|bcd'],
      keysPressed: 'R<S-right><Esc>',
      end: ['ab|cd'],
      endMode: Mode.Replace,
    });

    newTest({
      title: 'Replace + <S-right> shows `(replace) VISUAL` in the status bar',
      config,
      start: ['a|bcd'],
      keysPressed: 'R<S-right>',
      end: ['abc|d'],
      endMode: Mode.Visual,
      statusBar: '-- (replace) VISUAL --',
    });

    newTest({
      title: 'Replace + <S-down><Esc> returns to Replace',
      config,
      start: ['ab|cd', 'efgh'],
      keysPressed: 'R<S-down><Esc>',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Replace,
    });
  });

  suite('<C-o> from Insert (pending one Normal command)', () => {
    newTest({
      title: 'Insert + <C-o>w runs one Normal command, returns to Insert',
      start: ['hel|lo world'],
      keysPressed: 'i<C-o>w',
      end: ['hello |world'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'Insert + <C-o> shows `(insert) ` in the status bar',
      start: ['a|bcd'],
      keysPressed: 'i<C-o>',
      end: ['a|bcd'],
      statusBar: '-- (insert) --',
    });

    newTest({
      title: 'Insert + <C-o>dw deletes a word, returns to Insert',
      start: ['hel|lo world'],
      keysPressed: 'i<C-o>dw',
      end: ['hel|world'],
      endMode: Mode.Insert,
    });

    // Replace + <C-o> is currently a no-op: ExecuteOneNormalCommandInInsertMode
    // is registered only for Mode.Insert. Closing this gap is one line —
    // adding Mode.Replace to that action's `modes` and a small tweak to the
    // exit path so it returns to Replace rather than Insert. Skipping the
    // test here documents the expected behaviour for whoever closes the gap.
    newTestSkip({
      title: 'Replace + <C-o>w returns to Replace (not yet wired)',
      start: ['hel|lo world'],
      keysPressed: 'R<C-o>w',
      end: ['hello |world'],
      endMode: Mode.Replace,
    });
  });
});
