import { Mode } from '../../src/mode/mode';
import { newTest, newTestSkip } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Coverage for the `selectmode` config token. With `selectmode=key`, shifted
// arrow motions should land in Mode.Select instead of Mode.Visual. With the
// default empty `selectmode`, they land in Visual. The motions themselves are
// gated by `keymodel=startsel` (see keymodel.test.ts for that layer).
//
// Sub-modes (SelectLine, SelectBlock) and their entry commands (gh, gH, g<C-h>,
// <C-g>) are NOT yet ported from berknam's actions.ts in our merge — those
// tests are skipped with TODOs and belong in a follow-up PR.

suite('selectmode', () => {
  setup(async () => {
    await setupWorkspace();
  });

  suite("selectmode='key' — <S-arrow> enters Select instead of Visual", () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
      selectmode: 'key',
      selectmodeKey: true,
    };

    newTest({
      title: 'G1: <S-right> from Normal enters Select (not Visual)',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-right>',
      end: ['abc|d'], // forward Visual/Select shift behaves the same
      endMode: Mode.Select,
    });

    newTest({
      title: 'G2: <S-down> from Normal enters Select across lines',
      config,
      start: ['ab|cd', 'efgh'],
      keysPressed: '<S-down>',
      end: ['abcd', 'efg|h'],
      endMode: Mode.Select,
    });

    newTest({
      title: 'G3: <S-Home> from Normal enters Select to bol',
      config,
      start: ['ab|cd'],
      keysPressed: '<S-Home>',
      end: ['|abcd'],
      endMode: Mode.Select,
    });

    newTest({
      title: 'G4: Insert + <S-right> with selectmode=key shows (insert) SELECT in status bar',
      config,
      start: ['a|bcd'],
      keysPressed: 'i<S-right>',
      end: ['abc|d'],
      endMode: Mode.Select,
      statusBar: '-- (insert) SELECT --',
    });
  });

  suite("selectmode='' (default) — <S-arrow> enters Visual", () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
      selectmode: '',
      selectmodeKey: false,
    };

    newTest({
      title: 'G5: empty selectmode + <S-right> enters Visual (regression-protect default)',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-right>',
      end: ['abc|d'],
      endMode: Mode.Visual,
    });
  });

  // TODO follow-up: gh / gH / g<C-h> / <C-g> entry commands not yet ported
  // from berknam's actions.ts. SelectLine / SelectBlock unreachable today.
  newTestSkip({
    title: "G6 (TODO): 'gh' from Normal enters Select — entry command not ported",
    start: ['a|bcd'],
    keysPressed: 'gh',
    end: ['ab|cd'],
    endMode: Mode.Select,
  });

  newTestSkip({
    title: "G7 (TODO): '<C-g>' swaps Visual <-> Select — command not ported",
    start: ['a|bcd'],
    keysPressed: 'v<C-g>',
    end: ['a|bcd'],
    endMode: Mode.Select,
  });
});
