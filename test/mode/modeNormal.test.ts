"use strict";

import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {NormalMode} from '../../src/mode/modeNormal';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import {TextEditor} from '../../src/textEditor';
import {ModeHandler} from '../../src/mode/modeHandler';

suite("Mode Normal", () => {

    let motion : Motion;
    let modeNormal : NormalMode;
    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();

        modeHandler = new ModeHandler();
        motion      = new Motion(MotionMode.Cursor);
        modeNormal  = new NormalMode(motion, modeHandler);
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
    
    test("Can handle [count]", async () => {
        await TextEditor.insert("text");
        
        motion = motion.moveTo(0, 0);
        await modeNormal.handleKeyEvent("3");
        await modeNormal.handleKeyEvent("l");
        assert.equal(motion.position.line, 0);
        assert.equal(motion.position.character, 3);
    });
});
