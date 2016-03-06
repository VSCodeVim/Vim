"use strict";

import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {InsertMode} from '../../src/mode/modeInsert';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import {TextEditor} from '../../src/textEditor';

suite("Mode Insert", () => {

    let motion: Motion;
    let modeInsert: InsertMode;

    setup(async () => {
        await setupWorkspace();

        motion = new Motion(MotionMode.Cursor);
        modeInsert = new InsertMode(motion);
    });

    teardown(cleanUpWorkspace);

    test("can handle key events", async () => {
        await modeInsert.handleKeyEvent("!");

        return assertEqualLines(["!"]);
    });

});
