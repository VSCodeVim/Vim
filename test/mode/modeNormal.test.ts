"use strict";

import { setupWorkspace, cleanUpWorkspace, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

suite("Mode Normal", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
        newTest
    } = getTestingFunctions(modeHandler);

    setup(async () => {
        await setupWorkspace();
    });

    teardown(cleanUpWorkspace);

    test("can be activated", async () => {
        let activationKeys = ['<esc>', '<ctrl-[>'];

        for (let key of activationKeys) {
            await modeHandler.handleKeyEvent('i');
            await modeHandler.handleKeyEvent(key);

            assertEqual(modeHandler.currentMode.name, ModeName.Normal);
        }

        await modeHandler.handleKeyEvent('v');
        await modeHandler.handleKeyEvent('v');

        assertEqual(modeHandler.currentMode.name, ModeName.Normal);
    });

    newTest({
      title: "Can handle %",
      start: ['|((( )))'],
      keysPressed: '%',
      end: ["((( ))|)"],
    });

    newTest({
      title: "Can handle dw",
      start: ['one |two three'],
      keysPressed: 'dw',
      end: ["one |three"],
    });

    newTest({
      title: "Can handle dw",
      start: ['one | '],
      keysPressed: 'dw',
      end: ["one| "],
    });

    newTest({
      title: "Can handle dw",
      start: ['one |two'],
      keysPressed: 'dw',
      end: ["one| "],
    });

    newTest({
      title: "Can handle dd last line",
      start: ['one', '|two'],
      keysPressed: 'dd',
      end: ["|one"],
    });

    newTest({
      title: "Can handle dd single line",
      start: ['|one'],
      keysPressed: 'dd',
      end: ["|"],
    });

    newTest({
      title: "Can handle dd",
      start: ['|one', 'two'],
      keysPressed: 'dd',
      end: ["|two"],
    });

    newTest({
      title: "Can handle 3dd",
      start: ['|one', 'two', 'three', 'four', 'five'],
      keysPressed: '3dd',
      end: ["|four", "five"],
    });

    newTest({
      title: "Can handle 3dd off end of document",
      start: ['one', 'two', 'three', '|four', 'five'],
      keysPressed: '3dd',
      end: ["one", "two", "|three"],
    });

    newTest({
      title: "Can handle dd empty line",
      start: ['one', '|', 'two'],
      keysPressed: 'dd',
      end: ["one", "|two"],
    });

    newTest({
      title: "Can handle 'de'",
      start: ['text tex|t'],
      keysPressed: '^de',
      end: ['| text'],
    });

    newTest({
      title: "Can handle 'de' then 'de' again",
      start: ['text tex|t'],
      keysPressed: '^dede',
      end: ['|'],
    });

    newTest({
      title: "Can handle 'db'",
      start: ['text tex|t'],
      keysPressed: '$db',
      end: ['text |t'],
    });

    newTest({
      title: "Can handle 'db then 'db' again",
      start: ['text tex|t'],
      keysPressed: '$dbdb',
      end: ['|t'],
    });

    newTest({
      title: "Can handle 'dl' at end of line",
      start: ['bla|h'],
      keysPressed: '$dldldl',
      end: ['|b'],
    });

    newTest({
      title: "Can handle 'cw'",
      start: ['text text tex|t'],
      keysPressed: '^lllllllcw',
      end: ['text te| text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 's'",
      start: ['tex|t'],
      keysPressed: '^sk',
      end: ['k|ext'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ciw'",
      start: ['text text tex|t'],
      keysPressed: '^lllllllciw',
      end: ['text | text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ciw' on blanks",
      start: ['text   text tex|t'],
      keysPressed: '^lllllciw',
      end: ['text|text text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw'",
      start: ['text text tex|t'],
      keysPressed: '^llllllcaw',
      end: ['text |text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on first letter",
      start: ['text text tex|t'],
      keysPressed: '^lllllcaw',
      end: ['text |text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on blanks",
      start: ['text   tex|t'],
      keysPressed: '^lllllcaw',
      end: ['text|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on blanks",
      start: ['text |   text text'],
      keysPressed: 'caw',
      end: ['text| text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'df'",
      start: ['aext tex|t'],
      keysPressed: '^dft',
      end: ['| text']
    });

    newTest({
      title: "Can handle 'dt'",
      start: ['aext tex|t'],
      keysPressed: '^dtt',
      end: ['|t text']
    });

    newTest({
      title: "Can handle A and backspace",
      start: ['|text text'],
      keysPressed: 'A<backspace><esc>',
      end: ['text te|x']
    });

    newTest({
      title: "Can handle 'P' after 'yy'",
      start: ['one', 'tw|o'],
      keysPressed: 'yyP',
      end: ['one', '|two', 'two']
    });

    newTest({
      title: "Can handle 'p' after 'yy'",
      start: ['one', 'tw|o'],
      keysPressed: 'yyp',
      end: ['one', 'two', '|two']
    });

    newTest({
      title: "Can repeat w",
      start: ['|one two three four'],
      keysPressed: '2w',
      end: ['one two |three four']
    });

    newTest({
      title: "Can repeat p",
      start: ['|one'],
      keysPressed: 'yy2p',
      end: ['one', '|one', 'one']
    });
});