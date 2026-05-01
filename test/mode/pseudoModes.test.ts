import { Mode } from '../../src/mode/mode';
import { newTest, newTestSkip } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Pseudo-mode coverage: when Insert/Replace + <S-arrow> enters Visual, and
// when Insert + <C-o> enters Normal-for-one-command, the modeHandler tracks
// the source mode so <Esc> / completion of the command returns there. The
// display layer (`statusBar.ts:174-225`) shows synthesized strings like
// '-- (insert) VISUAL --' and '-- (insert) --' (the latter is the C-o pseudo-Normal
// in Insert; note it is intentionally NOT '-- (insert) NORMAL --').

suite('pseudo-modes (Insert/Replace ↔ Visual; C-o)', () => {
  setup(async () => {
    await setupWorkspace();
  });

  suite('D: Insert ↔ Visual via <S-arrow>', () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
      selectmode: '',
      selectmodeKey: false,
    };

    newTest({
      title: 'D1: Insert + <S-right> enters Visual; <Esc> returns to Insert',
      config,
      start: ['a|bcd'],
      keysPressed: 'i<S-right><Esc>',
      // i puts Insert at col 1. <S-right> moves stop to logical col 2 (Visual fwd
      // shift to col 3). <Esc> exits Visual back to Insert; cursor lands on the
      // last selected char (col 2 displayed; in Insert mode no shift).
      end: ['ab|cd'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'D2: Insert + <S-right> shows pseudo-mode in status bar',
      config,
      start: ['a|bcd'],
      keysPressed: 'i<S-right>',
      end: ['abc|d'], // forward Visual shift
      endMode: Mode.Visual,
      statusBar: '-- (insert) VISUAL --',
    });

    newTest({
      title: 'D3: Insert + <S-right>d deletes 2 chars and returns to Insert',
      config,
      start: ['a|bcde'],
      keysPressed: 'i<S-right>d',
      // i anchors Visual at col 1. <S-right> moves cursor.stop to logical col 2;
      // Visual selection is inclusive of both anchor (col 1='b') and cursor char
      // (col 2='c'), so 'bc' gets selected. d deletes → 'ade'.
      end: ['a|de'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'D4: Insert + <S-down> enters Visual line-down; <Esc> returns to Insert',
      config,
      start: ['ab|cd', 'efgh'],
      keysPressed: 'i<S-down><Esc>',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'D5: Insert + <C-S-right> enters Visual word-right; <Esc> returns to Insert',
      config,
      start: ['|hello world'],
      keysPressed: 'i<C-S-right><Esc>',
      end: ['hello |world'],
      endMode: Mode.Insert,
    });
  });

  suite('E: Replace ↔ Visual via <S-arrow>', () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
      selectmode: '',
      selectmodeKey: false,
    };

    newTest({
      title: 'E1: Replace + <S-right> enters Visual; <Esc> returns to Replace',
      config,
      start: ['a|bcd'],
      keysPressed: 'R<S-right><Esc>',
      end: ['ab|cd'],
      endMode: Mode.Replace,
    });

    newTest({
      title: 'E2: Replace + <S-right> shows pseudo-mode in status bar',
      config,
      start: ['a|bcd'],
      keysPressed: 'R<S-right>',
      end: ['abc|d'],
      endMode: Mode.Visual,
      statusBar: '-- (replace) VISUAL --',
    });

    newTest({
      title: 'E3: Replace + <S-down> + <Esc> returns to Replace',
      config,
      start: ['ab|cd', 'efgh'],
      keysPressed: 'R<S-down><Esc>',
      end: ['abcd', 'ef|gh'],
      endMode: Mode.Replace,
    });
  });

  suite('F: <C-o> from Insert (pseudo-Normal)', () => {
    newTest({
      title: 'F1: Insert + <C-o>w runs one normal command, returns to Insert',
      start: ['hel|lo world'],
      keysPressed: 'i<C-o>w',
      end: ['hello |world'], // <C-o>w moves to next word start
      endMode: Mode.Insert,
    });

    newTest({
      title: 'F2: Insert + <C-o> shows pseudo-Normal in status bar',
      start: ['a|bcd'],
      keysPressed: 'i<C-o>',
      end: ['a|bcd'],
      // Note: berknam's status-bar text for InsertNormal is '-- (insert) --',
      // matching the design that pseudo-Normal in Insert is the "subordinate"
      // Normal, not labelled "NORMAL" again.
      statusBar: '-- (insert) --',
    });

    newTest({
      title: 'F3: Insert + <C-o>dw deletes word, returns to Insert',
      start: ['hel|lo world'],
      keysPressed: 'i<C-o>dw',
      // <C-o>dw deletes 'lo ' (rest of word + trailing space, per `dw` semantics)
      // → 'hel' + 'world' = 'helworld', cursor at col 3.
      end: ['hel|world'],
      endMode: Mode.Insert,
    });

    // F4 (Replace + <C-o>) is intentionally skipped: ExecuteOneNormalCommandInInsertMode
    // at insert.ts:574 only registers `modes = [Mode.Insert]`; <C-o> from Replace
    // mode has no handler in the current codebase. This is a gap that can be
    // closed in a follow-up by widening that action's `modes` to include Replace.
    newTestSkip({
      title: 'F4 (TODO): Replace + <C-o>w returns to Replace — not yet wired',
      start: ['hel|lo world'],
      keysPressed: 'R<C-o>w',
      end: ['hello |world'],
      endMode: Mode.Replace,
    });
  });
});
