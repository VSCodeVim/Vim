"use strict";

import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {ModeName} from '../../src/mode/mode';
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

    test("Can handle 't'", async () => {
        await TextEditor.insert("text text");

        modeHandler.currentMode.motion.moveTo(0, 0);
        await modeHandler.handleKeyEvent("t");
        await modeHandler.handleKeyEvent("o");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 0);

        await modeHandler.handleKeyEvent("t");
        await modeHandler.handleKeyEvent("x");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 1);

        await modeHandler.handleKeyEvent("2");
        await modeHandler.handleKeyEvent("t");
        await modeHandler.handleKeyEvent("x");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 6);

        // No more x's, don't go anywhere
        await modeHandler.handleKeyEvent("t");
        await modeHandler.handleKeyEvent("x");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 6);
    });

    test("Can handle 'T'", async () => {
        await TextEditor.insert("text text");

        modeHandler.currentMode.motion.moveTo(0, 8);
        await modeHandler.handleKeyEvent("T");
        await modeHandler.handleKeyEvent("z");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 8);

        await modeHandler.handleKeyEvent("T");
        await modeHandler.handleKeyEvent("e");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 7);

        await modeHandler.handleKeyEvent("2");
        await modeHandler.handleKeyEvent("T");
        await modeHandler.handleKeyEvent("e");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 2);

        // No more x's, don't go anywhere
        await modeHandler.handleKeyEvent("T");
        await modeHandler.handleKeyEvent("e");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 2);
    });

    test("Can handle 'f'", async () => {
        await TextEditor.insert("text text");

        modeHandler.currentMode.motion.moveTo(0, 0);
        await modeHandler.handleKeyEvent("f");
        await modeHandler.handleKeyEvent("o");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 0);

        await modeHandler.handleKeyEvent("f");
        await modeHandler.handleKeyEvent("x");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 2);

        await modeHandler.handleKeyEvent("2");
        await modeHandler.handleKeyEvent("f");
        await modeHandler.handleKeyEvent("t");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 5);

        // No more x's, don't go anywhere
        await modeHandler.handleKeyEvent("t");
        await modeHandler.handleKeyEvent("o");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 5);
    });

    test("Can handle 'F'", async () => {
        await TextEditor.insert("text text");

        modeHandler.currentMode.motion.moveTo(0, 8);
        await modeHandler.handleKeyEvent("F");
        await modeHandler.handleKeyEvent("z");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 8);

        await modeHandler.handleKeyEvent("F");
        await modeHandler.handleKeyEvent("e");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 6);

        await modeHandler.handleKeyEvent("2");
        await modeHandler.handleKeyEvent("F");
        await modeHandler.handleKeyEvent("t");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 3);

        // No more x's, don't go anywhere
        await modeHandler.handleKeyEvent("F");
        await modeHandler.handleKeyEvent("z");
        assert.equal(modeHandler.currentMode.motion.position.line, 0);
        assert.equal(modeHandler.currentMode.motion.position.character, 3);
    });
});
