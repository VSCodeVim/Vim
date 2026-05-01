import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Note on cursor positions: in Visual mode, when cursor.start is before-or-equal
// cursor.stop (forward selection), the modeHandler shifts cursor.stop right by
// one at end of runAction (modeHandler.ts:877). The harness reads the shifted
// value, so expected end-position cursors for forward Visual entries are at
// logical_pos + 1.
//
// Note on key casing: action lookup uses strict-equality on keysPressed vs.
// `keys` declarations in src/actions/motion.ts. Casings:
//   <S-right>, <S-left>, <S-up>, <S-down>  (lowercase letter)
//   <S-Home>, <S-End>                      (capital H/E)
//   <C-S-right>, <C-S-left>, <C-S-Home>, <C-S-End>
// Notation.NormalizeKey is NOT applied to keypress inputs in the modeHandler
// today, only to vimrc/remap config.

suite('keymodel', () => {
  setup(async () => {
    await setupWorkspace();
  });

  suite("keymodel='startsel,stopsel'", () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
      selectmode: '',
      selectmodeKey: false,
    };

    newTest({
      title: 'A1: <S-right> from Normal enters Visual and extends right one char',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-right>',
      end: ['abc|d'], // logical col 2; +1 Visual forward shift → reported col 3
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A2: <S-right><S-right> extends two chars',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-right><S-right>',
      end: ['abcd|'], // logical col 3; +1 shift → col 4
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A3: <S-left> from Normal enters Visual leftward',
      config,
      start: ['ab|cd'],
      keysPressed: '<S-left>',
      end: ['a|bcd'],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A4: <S-down> from Normal enters Visual across lines',
      config,
      start: ['ab|cd', 'efgh'],
      keysPressed: '<S-down>',
      end: ['abcd', 'efg|h'], // forward Visual: cursor reported at +1
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A5: <S-up> from Normal enters Visual upward',
      config,
      start: ['abcd', 'ef|gh'],
      keysPressed: '<S-up>',
      end: ['ab|cd', 'efgh'], // backward Visual: no shift
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A6: <S-Home> from Normal enters Visual to bol',
      config,
      start: ['ab|cd'],
      keysPressed: '<S-Home>',
      end: ['|abcd'], // backward Visual to col 0
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A7: <S-End> from Normal enters Visual to eol',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-End>',
      end: ['abcd|'], // forward Visual: logical col 3, +1 shift → col 4 = end of line
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A8: <C-S-right> from Normal enters Visual word-right',
      config,
      start: ['|hello world'],
      keysPressed: '<C-S-right>',
      end: ['hello w|orld'], // forward: word start at col 6, +1 shift → col 7 = on 'o'
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A9: <C-S-left> from Normal enters Visual word-left',
      config,
      start: ['hello |world'],
      keysPressed: '<C-S-left>',
      end: ['|hello world'],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A10: <C-S-Home> from Normal enters Visual to file-start',
      config,
      start: ['line one', 'line tw|o'],
      keysPressed: '<C-S-Home>',
      end: ['|line one', 'line two'],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A11: <C-S-End> from Normal enters Visual to file-end',
      config,
      start: ['lin|e one', 'line two'],
      keysPressed: '<C-S-End>',
      end: ['line one', 'line two|'], // forward: end-of-doc, +1 shift → after last char
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A12: <S-right> in Visual extends, stays Visual',
      config,
      start: ['a|bcd'],
      keysPressed: 'v<S-right><S-right>',
      end: ['abcd|'], // v anchors at col 1; two <S-right> advance logical to col 3, +1 → col 4
      endMode: Mode.Visual,
    });

    newTest({
      title: 'A13: d after <S-right><S-right> deletes selection',
      config,
      start: ['a|bcde'],
      keysPressed: '<S-right><S-right>d',
      end: ['a|e'], // anchor (0,1); 2× <S-right> covers chars 1-3 = 'bcd' (Visual inclusive); delete leaves 'ae'
      endMode: Mode.Normal,
    });
  });

  suite("keymodel='' (terminal-Vim — shifted special keys do NOT enter Visual)", () => {
    const config = {
      keymodel: '',
      keymodelStartsSelection: false,
      keymodelStopsSelection: false,
    };

    newTest({
      title: 'B1: <S-right> with empty keymodel does not enter Visual (acts as `w`)',
      config,
      start: ['hel|lo world'],
      keysPressed: '<S-right>',
      end: ['hello |world'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'B2: <C-S-right> with empty keymodel does not enter Visual',
      config,
      start: ['hel|lo world'],
      keysPressed: '<C-S-right>',
      end: ['hello |world'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'B3: <S-Home> with empty keymodel goes to bol, no Visual',
      config,
      start: ['ab|cd'],
      keysPressed: '<S-Home>',
      end: ['|abcd'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'B4: <S-End> with empty keymodel goes to eol, no Visual',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-End>',
      end: ['abc|d'], // Normal mode: cursor on last char (col 3), no shift
      endMode: Mode.Normal,
    });
  });

  suite("keymodel='stopsel' — unshifted special keys exit Visual to source mode", () => {
    newTest({
      title: 'C1: <right> after <S-right> exits Visual back to Normal',
      config: {
        keymodel: 'startsel,stopsel',
        keymodelStartsSelection: true,
        keymodelStopsSelection: true,
      },
      start: ['a|bcd'],
      keysPressed: '<S-right><right>',
      end: ['abc|d'], // <S-right> selects to logical col 2; <right> exits Visual + advances → Normal at col 3
      endMode: Mode.Normal,
    });

    newTest({
      title: 'C2: keymodelStopsSelection=false: <right> after <S-right> stays in Visual (extends)',
      config: {
        keymodel: 'startsel',
        keymodelStartsSelection: true,
        keymodelStopsSelection: false,
      },
      start: ['a|bcd'],
      keysPressed: '<S-right><right>',
      end: ['abcd|'], // logical col 3 + Visual forward shift = col 4
      endMode: Mode.Visual,
    });
  });
});
