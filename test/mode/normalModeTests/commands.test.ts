"use strict";

import { setupWorkspace, cleanUpWorkspace } from './../../testUtils';
import { ModeName } from '../../../src/mode/mode';
import { ModeHandler } from '../../../src/mode/modeHandler';
import { getTestingFunctions } from '../../testSimplifier';

suite("Mode Normal", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
        newTest
    } = getTestingFunctions(modeHandler);

    setup(async () => {
        await setupWorkspace();
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "Can handle x",
      start: ['te|xt'],
      keysPressed: 'x',
      end: ["te|t"],
    });

    newTest({
      title: "Can handle 'cc'",
      start: ['one', '|one two'],
      keysPressed: 'cca<esc>',
      end: ["one", "|a"],
    });

    newTest({
      title: "Can handle 'yy'",
      start: ['|one'],
      keysPressed: 'yyO<esc>p',
      end: ["", "|one", "one"],
    });

    newTest({
      title: "Can handle 'D'",
      start: ['tex|t'],
      keysPressed: '^llD',
      end: ['t|e'],
    });

    newTest({
      title: "Can handle 'DD'",
      start: ['tex|t'],
      keysPressed: '^llDD',
      end: ['|t'],
    });

    newTest({
      title: "Can handle x at end of line",
      start: ['one tw|o'],
      keysPressed: '^llxxxxxxxxx',
      end: ['|'],
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
      title: "Can backspace in insert mode",
      start: ['one', '|'],
      keysPressed: 'i<backspace><esc>',
      end: ['on|e']
    });

});