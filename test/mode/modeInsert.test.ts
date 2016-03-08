"use strict";

import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {InsertMode} from '../../src/mode/modeInsert';
import {Motion, MotionMode} from '../../src/motion/motion';
import {ModeHandler} from '../../src/mode/modeHandler';


suite("Mode Insert", () => {

    let motion: Motion;
    let modeInsert: InsertMode;
    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();

        motion = new Motion(MotionMode.Cursor);
        modeHandler = new ModeHandler();
        modeInsert = new InsertMode(motion, modeHandler);
    });

    teardown(cleanUpWorkspace);

    test("can handle key events", async () => {
        await modeInsert.handleKeyEvent("!");

        return assertEqualLines(["!"]);
    });

});
