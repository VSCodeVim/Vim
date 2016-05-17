"use strict";

import * as assert from 'assert';
import {newDefaultNormalKeymap} from '../../src/mode/commands';
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
        modeNormal  = new NormalMode(motion, modeHandler, newDefaultNormalKeymap());
    });

    teardown(cleanUpWorkspace);

    test("can be activated", () => {
        let activationKeys = ['esc', 'ctrl+['];

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeNormal.shouldBeActivated(key, ModeName.Insert), true, key);
        }

        assert.equal(modeNormal.shouldBeActivated("v", ModeName.Visual), true, "couldn't deactivate from visual with v");
    });

    test("Can handle 'x'", async () => {
        await TextEditor.insert("text");

        motion = motion.moveTo(0, 2);
        await modeNormal.handleKeyEvent("x");
        await assertEqualLines(["tet"]);
        await modeNormal.handleKeyEvent("x");
        assertEqualLines(["te"]);
    });

    test("Can handle 'dw'", async () => {
        await TextEditor.insert("text text text");

        motion = motion.moveTo(0, 5);
        await modeNormal.handleKeyEvent("dw");
        await assertEqualLines(["text text"]);
        await modeNormal.handleKeyEvent("dw");
        await assertEqualLines(["text "]);
        await modeNormal.handleKeyEvent("dw");
        await assertEqualLines(["text"]);
    });

    test("Can handle 'de'", async () => {
        await TextEditor.insert("text text");

        motion = motion.moveTo(0, 0);
        await modeNormal.handleKeyEvent("de");
        await assertEqualLines([" text"]);
        await modeNormal.handleKeyEvent("de");
        await assertEqualLines([""]);
    });

    test("Can handle 'db'", async () => {
        await TextEditor.insert("text text");

        motion = motion.moveTo(0, 8);
        await modeNormal.handleKeyEvent("db");
        await assertEqualLines(["text t"]);
        await modeNormal.handleKeyEvent("db");
        await assertEqualLines(["t"]);
    });

    test("Can handle 'D'", async () => {
        await TextEditor.insert("text");

        motion = motion.moveTo(0, 2);
        await modeNormal.handleKeyEvent("D");
        await assertEqualLines(["te"]);
        await modeNormal.handleKeyEvent("D");
        await assertEqualLines(["t"]);
    });

    test("Can handle 'ge'", async () => {
        await TextEditor.insert("text text");

        motion = motion.moveTo(0, 6);
        await modeNormal.handleKeyEvent("g");
        await modeNormal.handleKeyEvent("e");
        await assert.equal(motion.position.character, 4, "wrong position");
    });

    test("Can handle 'C'", async () => {
        await TextEditor.insert("text");

        motion = motion.moveTo(0, 2);
        await modeNormal.handleKeyEvent("C");
        await assertEqualLines(["te"]);
        await assert.equal(modeHandler.currentMode.name === ModeName.Insert, true, "didn't enter insert mode");
    });

    test("Can handle 'cw'", async () => {
        await TextEditor.insert("text text text");

        motion = motion.moveTo(0, 7);
        await modeNormal.handleKeyEvent("c");
        await modeNormal.handleKeyEvent("w");
        await assertEqualLines(["text te text"]);
        await assert.equal(modeHandler.currentMode.name === ModeName.Insert, true, "didn't enter insert mode");
    });

    test("Can handle 'ciw'", async () => {
        await TextEditor.insert("text text text");

        motion = motion.moveTo(0, 7);
        await modeNormal.handleKeyEvent("c");
        await modeNormal.handleKeyEvent("i");
        await modeNormal.handleKeyEvent("w");
        await assertEqualLines(["text  text"]);
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'ciw' on blanks", async () => {
        await TextEditor.insert("text   text text");

        motion = motion.moveTo(0, 5);
        await modeNormal.handleKeyEvent("c");
        await modeNormal.handleKeyEvent("i");
        await modeNormal.handleKeyEvent("w");
        await assertEqualLines(["texttext text"]);
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'caw'", async () => {
        await TextEditor.insert("text text text");

        motion = motion.moveTo(0, 7);
        await modeNormal.handleKeyEvent("c");
        await modeNormal.handleKeyEvent("a");
        await modeNormal.handleKeyEvent("w");
        await assertEqualLines(["text text"]);
        await assert.equal(motion.position.character, 5, "wrong position");
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'caw' on blanks", async () => {
        await TextEditor.insert("text   text");

        motion = motion.moveTo(0, 5);
        await modeNormal.handleKeyEvent("c");
        await modeNormal.handleKeyEvent("a");
        await modeNormal.handleKeyEvent("w");
        await assertEqualLines(["text"]);
        await assert.equal(motion.position.character, 4, "wrong position");
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });
});
