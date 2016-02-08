"use strict";

import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {NormalMode} from '../../src/mode/modeNormal';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import {TextEditor} from '../../src/textEditor';

suite("Mode Normal", () => {

    let motion : Motion;
    let modeNormal : NormalMode;

    setup(async () => {
        await setupWorkspace();

        motion = new Motion(MotionMode.Cursor);
        modeNormal = new NormalMode(motion);
    });

    teardown(cleanUpWorkspace);

    test("can be activated", () => {
        let activationKeys = ['esc', 'ctrl+[', 'ctrl+c'];

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeNormal.shouldBeActivated(key, ModeName.Insert), true, key);
        }
    });

    test("Can handle 'x'", async () => {
        await TextEditor.insert("text");

        motion = motion.moveTo(0, 2);
        await modeNormal.handleKeyEvent("x");
        await assertEqualLines(["tet"]);
        await modeNormal.handleKeyEvent("x");
        assertEqualLines(["te"]);
    });
});
