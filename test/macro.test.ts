"use strict";

import { setupWorkspace, cleanUpWorkspace, setTextEditorOptions } from './testUtils';
import { ModeHandler } from '../src/mode/modeHandler';
import { getTestingFunctions } from './testSimplifier';

suite("Record and execute a macro", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
        newTest,
        newTestOnly
    } = getTestingFunctions(modeHandler);

    setup(async () => {
        await setupWorkspace();
        setTextEditorOptions(4, false);
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "Can record and execute",
      start: ['|foo = 1', "bar = 'a'", "foobar = foo + bar"],
      keysPressed: 'qaA;<Esc>Ivar <Esc>qj@a',
      end: ['var foo = 1;', "var| bar = 'a';", "foobar = foo + bar"]
    });

    newTest({
      title: "Can play back with count",
      start: ['|"("+a+","+b+","+c+","+d+","+e+")"'],
      keysPressed: 'f+s + <Esc>qq;.q8@q',
      end: ['"(" + a + "," + b + "," + c + "," + d + "," + e +| ")"']
    });

    newTest({
      title: "Repeat change on contiguous lines",
      start: ['1. |one', '2. two', '3. three', '4. four'],
      keysPressed: 'qa0f.r)w~jq3@a',
      end: ['1) One', '2) Two', '3) Three', '4) F|our']
    });

    newTestOnly({
      title: "Append command to a macro",
      start: ['1. |one', '2. two', '3. three', '4. four'],
      keysPressed: 'qa0f.r)qqAw~jq3@a',
      end: ['1) One', '2) Two', '3) Three', '4) F|our']
    });
});