"use strict";

import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {NormalMode} from '../../src/mode/modeNormal';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import {TextEditor} from '../../src/textEditor';
import {ModeHandler} from '../../src/mode/modeHandler';

suite("Mode Normal", () => {
    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();

        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

    test("Can handle 'x'", async () => {
        await TextEditor.insert("text");

        modeHandler.currentMode.motion.moveTo(0, 2);
        await modeHandler.handleKeyEvent("x");
        assertEqualLines(["tet"]);
        await modeHandler.handleKeyEvent("x");
        assertEqualLines(["te"]);
    });

    test("Can handle 'v'", async () => {
        await modeHandler.handleKeyEvent("v");
        assert.equal(modeHandler.currentMode.name, ModeName.Visual, "should be in visual mode now");
    });

    test("Can handle 'o'", async () => {
        await TextEditor.insert("text");

        await modeHandler.handleKeyEvent("o");
        assert.equal(modeHandler.currentMode.name, ModeName.Insert, "should be in insert mode now");
        return assertEqualLines(["text", ""]);
    });

    test("Can handle 'O'", async () => {
        await TextEditor.insert("text");

        await modeHandler.handleKeyEvent("O");
        assert.equal(modeHandler.currentMode.name, ModeName.Insert, "should be in insert mode now");
        return assertEqualLines(["", "text"]);
    });

    test("Can handle 'i'", async () => {
        await TextEditor.insert("texttext");
        modeHandler.currentMode.motion.moveTo(0, 4);

        await modeHandler.handleKeyEvent("i");
        assert.equal(modeHandler.currentMode.name, ModeName.Insert, "should be in insert mode now");

        await modeHandler.handleKeyEvent("!");
        return assertEqualLines(["text!text"]);
    });

    test("Can handle 'I'", async () => {
        await TextEditor.insert("text");
        modeHandler.currentMode.motion.moveTo(0, 3);

        await modeHandler.handleKeyEvent("I");
        assert.equal(modeHandler.currentMode.name, ModeName.Insert, "should be in insert mode now");

        await modeHandler.handleKeyEvent("!");
        return assertEqualLines(["!text"]);
    });

    test("Can handle 'a'", async () => {
        await TextEditor.insert("texttext");
        modeHandler.currentMode.motion.moveTo(0, 4);

        await modeHandler.handleKeyEvent("a");
        assert.equal(modeHandler.currentMode.name, ModeName.Insert, "should be in insert mode now");

        await modeHandler.handleKeyEvent("!");
        return assertEqualLines(["textt!ext"]);
    });

    test("Can handle 'A'", async () => {
        await TextEditor.insert("text");
        modeHandler.currentMode.motion.moveTo(0, 0);

        await modeHandler.handleKeyEvent("A");
        assert.equal(modeHandler.currentMode.name, ModeName.Insert, "should be in insert mode now");

        await modeHandler.handleKeyEvent("!");
        return assertEqualLines(["text!"]);
    });

    test("Can handle 'dw'", async () => {
        await TextEditor.insert("text text");

        modeHandler.currentMode.motion.moveTo(0, 5);
        await modeHandler.handleKeyEvent("d");
        await modeHandler.handleKeyEvent("w");
        assertEqualLines(["text "]);
        await modeHandler.handleKeyEvent("d");
        await modeHandler.handleKeyEvent("w");
        assertEqualLines(["text"]);
        await modeHandler.handleKeyEvent("d");
        await modeHandler.handleKeyEvent("w");
        assertEqualLines(["tex"]);
    });

    test("Can handle 'de'", async () => {
        await TextEditor.insert("text text");

        modeHandler.currentMode.motion.moveTo(0, 0);
        await modeHandler.handleKeyEvent("d");
        await modeHandler.handleKeyEvent("e");
        assertEqualLines([" text"]);
        await modeHandler.handleKeyEvent("d");
        await modeHandler.handleKeyEvent("e");
        assertEqualLines([""]);
    });

    test("Can handle 'db'", async () => {
        await TextEditor.insert("text text");

        modeHandler.currentMode.motion.moveTo(0, 8);
        await modeHandler.handleKeyEvent("d");
        await modeHandler.handleKeyEvent("b");
        assertEqualLines(["text t"]);
        await modeHandler.handleKeyEvent("d");
        await modeHandler.handleKeyEvent("b");
        assertEqualLines(["t"]);
    });

    test("Can handle 'D'", async () => {
        await TextEditor.insert("text");

        modeHandler.currentMode.motion.moveTo(0, 2);
        await modeHandler.handleKeyEvent("D");
        await assertEqualLines(["te"]);
        await modeHandler.handleKeyEvent("D");
        await assertEqualLines(["t"]);
    });
});
