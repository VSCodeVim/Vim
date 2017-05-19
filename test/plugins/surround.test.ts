"use strict";

import { setupWorkspace, cleanUpWorkspace } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

suite("surround plugin", () => {
    let modeHandler: ModeHandler;
    let {
        newTest,
        newTestOnly,
    } = getTestingFunctions();

    setup(async () => {
        await setupWorkspace(".js");
        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "ysiw) surrounds word",
      start: ["first li|ne test"],
      keysPressed: 'ysiw)',
      end: ["first (|line) test"],
    });

    newTest({
      title: "ysiw< surrounds word with tags",
      start: ["first li|ne test"],
      keysPressed: 'ysiw<123>',
      end: ["first <123>|line</123> test"],
    });

    newTest({
      title: "ysiw< surrounds word with tags and attributes",
      start: ["first li|ne test"],
      keysPressed: 'ysiw<abc attr1 attr2="test">',
      end: ['first <abc attr1 attr2="test">|line</abc> test'],
    });

    newTest({
      title: "change surround",
      start: ["first 'li|ne' test"],
      keysPressed: "cs')",
      end: ["first (li|ne) test"],
    });

    newTest({
      title: "change surround to tags",
      start: ["first [li|ne] test"],
      keysPressed: "cs]tabc>",
      end: ["first <abc>li|ne</abc> test"],
    });

    newTest({
      title: "delete surround",
      start: ["first 'li|ne' test"],
      keysPressed: "ds'",
      end: ["first li|ne test"],
    });

    newTest({
      title: "delete surround with tags",
      start: ["first <test>li|ne</test> test"],
      keysPressed: "dst",
      end: ["first li|ne test"],
    });
});
