import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from './../testUtils';

// Tests for the `keymodel` Vim option (`:help 'keymodel'`):
//
//   - `startsel` — a shifted special key starts/extends a Visual selection.
//   - `stopsel`  — an unshifted special key exits a Visual selection.
//
// Some assertions land on cursor.stop one column past where the cursor
// "appears" — that's the modeHandler's forward-Visual cursor convention
// (cursor.stop is shifted right by one when start ≤ stop, so VSCode renders
// the selection as inclusive of the char under the cursor).

suite('keymodel', () => {
  setup(async () => {
    await setupWorkspace();
  });

  suite("keymodel='startsel,stopsel'", () => {
    const config = {
      keymodel: 'startsel,stopsel',
      keymodelStartsSelection: true,
      keymodelStopsSelection: true,
    };

    newTest({
      title: '<S-right> from Normal enters Visual and extends right one char',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-right>',
      end: ['abc|d'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<S-right><S-right> extends two chars',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-right><S-right>',
      end: ['abcd|'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<S-left> from Normal enters Visual leftward',
      config,
      start: ['ab|cd'],
      keysPressed: '<S-left>',
      end: ['a|bcd'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<S-down> from Normal enters Visual across lines',
      config,
      start: ['ab|cd', 'efgh'],
      keysPressed: '<S-down>',
      end: ['abcd', 'efg|h'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<S-up> from Normal enters Visual upward',
      config,
      start: ['abcd', 'ef|gh'],
      keysPressed: '<S-up>',
      end: ['ab|cd', 'efgh'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<S-Home> from Normal enters Visual to start of line',
      config,
      start: ['ab|cd'],
      keysPressed: '<S-Home>',
      end: ['|abcd'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<S-End> from Normal enters Visual to end of line',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-End>',
      end: ['abcd|'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<C-S-right> from Normal enters Visual word-right',
      config,
      start: ['|hello world'],
      keysPressed: '<C-S-right>',
      end: ['hello w|orld'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<C-S-left> from Normal enters Visual word-left',
      config,
      start: ['hello |world'],
      keysPressed: '<C-S-left>',
      end: ['|hello world'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<C-S-Home> from Normal enters Visual to start of file',
      config,
      start: ['line one', 'line tw|o'],
      keysPressed: '<C-S-Home>',
      end: ['|line one', 'line two'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<C-S-End> from Normal enters Visual to end of file',
      config,
      start: ['lin|e one', 'line two'],
      keysPressed: '<C-S-End>',
      end: ['line one', 'line two|'],
      endMode: Mode.Visual,
    });

    newTest({
      title: '<S-right> in Visual extends, stays Visual',
      config,
      start: ['a|bcd'],
      keysPressed: 'v<S-right><S-right>',
      end: ['abcd|'],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'd after <S-right><S-right> deletes the selection',
      config,
      start: ['a|bcde'],
      keysPressed: '<S-right><S-right>d',
      end: ['a|e'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'count prefix: 3<S-right> selects three chars',
      config,
      start: ['a|bcdef'],
      keysPressed: '3<S-right>',
      end: ['abcde|f'],
      endMode: Mode.Visual,
    });

    newTest({
      title: 'count prefix: 2<S-down> extends Visual two lines down',
      config,
      start: ['ab|cd', 'efgh', 'ijkl'],
      keysPressed: '2<S-down>',
      end: ['abcd', 'efgh', 'ijk|l'],
      endMode: Mode.Visual,
    });
  });

  suite("keymodel='' (terminal-Vim — shifted special keys do NOT start a selection)", () => {
    const config = {
      keymodel: '',
      keymodelStartsSelection: false,
      keymodelStopsSelection: false,
    };

    newTest({
      title: '<S-right> with empty keymodel does not enter Visual (acts as `w`)',
      config,
      start: ['hel|lo world'],
      keysPressed: '<S-right>',
      end: ['hello |world'],
      endMode: Mode.Normal,
    });

    newTest({
      title: '<C-S-right> with empty keymodel does not enter Visual',
      config,
      start: ['hel|lo world'],
      keysPressed: '<C-S-right>',
      end: ['hello |world'],
      endMode: Mode.Normal,
    });

    newTest({
      title: '<S-Home> with empty keymodel goes to start of line, no Visual',
      config,
      start: ['ab|cd'],
      keysPressed: '<S-Home>',
      end: ['|abcd'],
      endMode: Mode.Normal,
    });

    newTest({
      title: '<S-End> with empty keymodel goes to end of line, no Visual',
      config,
      start: ['a|bcd'],
      keysPressed: '<S-End>',
      end: ['abc|d'],
      endMode: Mode.Normal,
    });
  });

  suite("keymodel='stopsel' — unshifted special keys exit Visual to source mode", () => {
    newTest({
      title: '<right> after <S-right> exits Visual back to Normal',
      config: {
        keymodel: 'startsel,stopsel',
        keymodelStartsSelection: true,
        keymodelStopsSelection: true,
      },
      start: ['a|bcd'],
      keysPressed: '<S-right><right>',
      end: ['abc|d'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'with stopsel disabled, <right> after <S-right> stays in Visual (extends)',
      config: {
        keymodel: 'startsel',
        keymodelStartsSelection: true,
        keymodelStopsSelection: false,
      },
      start: ['a|bcd'],
      keysPressed: '<S-right><right>',
      end: ['abcd|'],
      endMode: Mode.Visual,
    });
  });
});
