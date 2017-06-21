"use strict";

import { setupWorkspace, cleanUpWorkspace } from './../../testUtils';
import { ModeName } from '../../../src/mode/mode';
import { ModeHandler } from '../../../src/mode/modeHandler';
import { getTestingFunctions } from '../../testSimplifier';

suite("Mode Normal", () => {
    let {
        newTest,
        newTestOnly
    } = getTestingFunctions();

    setup(async () => {
        await setupWorkspace();
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "Can handle 'x'",
      start: ['te|xt'],
      keysPressed: 'x',
      end: ["te|t"],
    });

    newTest({
      title: "Can handle 'Nx'",
      start: ['te|xt'],
      keysPressed: '2x',
      end: ["t|e"],
    });

    newTest({
      title: "Can handle 'x' at end of line",
      start: ['one tw|o'],
      keysPressed: '^llxxxxxxxxx',
      end: ['|'],
    });

    newTest({
      title: "Can handle 'Ns'",
      start: ['|text'],
      keysPressed: '3s',
      end: ['|t'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'Ns' at end of line",
      start: ['te|xt'],
      keysPressed: '3s',
      end: ['te|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle '<Del>'",
      start: ['te|xt'],
      keysPressed: '<Del>',
      end: ["te|t"],
    });

    newTest({
      title: "Can handle '<Del>' with counts, which removes the last character of the count",
      start: ['|text'],
      keysPressed: '10<Del>x',
      end: ["|ext"],
    });

    newTest({
      title: "Can handle '<Del>' at end of line",
      start: ['one tw|o'],
      keysPressed: '^ll<Del><Del><Del><Del><Del><Del><Del><Del><Del>',
      end: ['|'],
    });

    newTest({
      title: "Can handle 'cc'",
      start: ['one', '|one two', 'three'],
      keysPressed: 'cca<Esc>',
      end: ["one", "|a", "three"],
    });

    newTest({
      title: "Can handle 'Ncc'",
      start: ['one', '|one two', 'three four', 'five'],
      keysPressed: '2cca<Esc>',
      end: ["one", "|a", "five"]
    });

    newTest({
      title: "Can handle 'yy'",
      start: ['|one'],
      keysPressed: 'yyO<Esc>p',
      end: ["", "|one", "one"],
    });

    newTest({
      title: "Can handle 'D'",
      start: ['tex|t'],
      keysPressed: '^llD',
      end: ['t|e'],
    });

    newTest({
      title: "Can handle 'D' on empty lines",
      start: ['text', '|', 'text'],
      keysPressed: 'D',
      end: ['text', '|', 'text']
    });

    newTest({
      title: "Can handle 'DD'",
      start: ['tex|t'],
      keysPressed: '^llDD',
      end: ['|t'],
    });

    newTest({
      title: "Can handle 'C'",
      start: ['tex|t'],
      keysPressed: '^llC',
      end: ['te|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'NC'",
      start: ['tex|t', 'one', 'two'],
      keysPressed: '^ll2C',
      end: ['te|', 'two'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'r'",
      start: ['tex|t'],
      keysPressed: 'hrs',
      end: ['te|st']
    });

    newTest({
      title: "Can handle '<Count>r'",
      start: ['123|456', '789'],
      keysPressed: '2ra',
      end: ['123a|a6', '789']
    });

    newTest({
      title: "Can handle '<Count>r'",
      start: ['123|456', '789'],
      keysPressed: '4ra',
      end: ['123|456', '789']
    });

    newTest({
      title: "Can handle 'r' after 'dd'",
      start: ['one', 'two', 'thre|e'],
      keysPressed: 'kddrT',
      end: ['one', '|Three']
    });

    newTest({
      title: "Can handle 'J' once",
      start: ['one', 'tw|o'],
      keysPressed: 'kJ',
      end: ['one| two']
    });

    newTest({
      title: "Can handle 'J' twice",
      start: ['one', 'two', 'thre|e'],
      keysPressed: 'kkJJ',
      end: ['one two| three']
    });

    newTest({
      title: "Can handle 'J' with empty last line",
      start: ['one', 'two', '|'],
      keysPressed: 'kJ',
      end: ['one', 'two| ']
    });

    newTest({
      title: "Can handle 'J's with multiple empty last lines",
      start: ['one', 'two', '', '', '', '|'],
      keysPressed: 'kkkkkJJJJJ',
      end: ['one two| ']
    });

    newTest({
      title: "Can handle 'J' with leading white space on next line",
      start: ['on|e', ' two'],
      keysPressed: 'kJ',
      end: ['one| two']
    });

    newTest({
      title: "Can handle 'J' with only white space on next line",
      start: ['on|e', '    '],
      keysPressed: 'J',
      end: ['one| ']
    });

    newTest({
      title: "Can handle 'J' with TWO indented lines",
      start: ['   on|e', '    two'],
      keysPressed: 'kJ',
      end: ['   one| two']
    });

    newTest({
      title: "Can handle 'J' with ')' first character on next line",
      start: ['one(', ')tw|o'],
      keysPressed: 'kJ',
      end: ['one(|)two']
    });

    newTest({
      title: "Can handle 'J' with a following delete",
      start: ['on|e', 'two'],
      keysPressed: 'Jx',
      end: ['one|two']
    });

    newTest({
      title: "Can handle 'J' in Visual Line mode",
      start: ['on|e', 'two'],
      keysPressed: 'VJ',
      end: ['one| two']
    });

    newTest({
      title: "Can handle 'gJ' once",
      start: ['|one', 'two'],
      keysPressed: 'kgJ',
      end: ['one|two']
    });

    newTest({
      title: "Can handle 'gJ' once and ALL WHITESPACE IS ELIMINATED",
      start: ['|one', '  two'],
      keysPressed: 'kgJ',
      end: ['one|two']
    });

    newTest({
      title: "Can handle '~'",
      start: ['|text'],
      keysPressed: '~',
      end: ['T|ext']
    });

    newTest({
      title: "Can handle 'g~{motion}'",
      start: ['|one two'],
      keysPressed: 'g~w',
      end: ['|ONE two']
    });

    newTest({
      title: "Can handle '<BS>' in insert mode",
      start: ['one', '|'],
      keysPressed: 'i<BS><Esc>',
      end: ['on|e']
    });

    newTest({
      title: "Can handle undo with P",
      start: ['one', '|two', 'three'],
      keysPressed: 'ddkPjddu',
      end: ['two', '|one', 'three'],
    });

});
