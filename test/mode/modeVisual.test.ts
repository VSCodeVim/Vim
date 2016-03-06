"use strict";

import * as assert from 'assert';
import {ModeHandler} from '../../src/mode/modeHandler';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {VisualMode} from '../../src/mode/modeVisual';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import {TextEditor} from '../../src/textEditor';

suite("Mode Visual", () => {
    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();

        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

    test("Can handle w", async () => {
        await TextEditor.insert("test test test\ntest\n");

        modeHandler.currentMode.motion.moveTo(0, 0);

        await modeHandler.handleKeyEvent("v");
        await modeHandler.handleKeyEvent("w");

        const sel = TextEditor.getSelection();

        assert.equal(sel.start.character, 0);
        assert.equal(sel.start.line, 0);

        // The input cursor comes BEFORE the block cursor. Try it out, this
        // is how Vim works.
        assert.equal(sel.end.character, 5);
        assert.equal(sel.end.line, 0);
    });

    test("Can handle wd", async () => {
        await TextEditor.insert("one two three");
        modeHandler.currentMode.motion.moveTo(0, 0);

        await modeHandler.handleKeyEvent("v");
        await modeHandler.handleKeyEvent("w");
        await modeHandler.handleKeyEvent("d");

        assertEqualLines(["wo three"]);
    });

    test("Can handle x", async () => {
        await TextEditor.insert("one two three");
        modeHandler.currentMode.motion.moveTo(0, 0);

        await modeHandler.handleKeyEvent("v");
        await modeHandler.handleKeyEvent("x");

        assertEqualLines(["ne two three"]);
    });

    test("can do vwd in middle of sentence", async () => {
        await TextEditor.insert("one two three foar");
        modeHandler.currentMode.motion.moveTo(0, 4);

        await modeHandler.handleKeyEvent("v");
        await modeHandler.handleKeyEvent("w");
        await modeHandler.handleKeyEvent("d");

        assertEqualLines(["one hree foar"]);
    });

    test("handles case where we go from selecting on right side to selecting on left side", async () => {
        await TextEditor.insert("one two three");
        modeHandler.currentMode.motion.moveTo(0, 4);

        await modeHandler.handleKeyEvent("v");
        await modeHandler.handleKeyEvent("w");
        await modeHandler.handleKeyEvent("b");
        await modeHandler.handleKeyEvent("b");
        await modeHandler.handleKeyEvent("d");

        assertEqualLines(["wo three"]);
    });

    test("delete operator handles empty line", async () => {
        await TextEditor.insert("one two\n\nthree four");
        modeHandler.currentMode.motion.moveTo(0, 0);

        await modeHandler.handleKeyEvent("v");
        await modeHandler.handleKeyEvent("}");
        await modeHandler.handleKeyEvent("d");

        assertEqualLines(["three four"]);
    });

    test("Change operator", async () => {
        await TextEditor.insert("one two three");
        modeHandler.currentMode.motion.moveTo(0, 0);

        await modeHandler.handleKeyEvent("v");
        await modeHandler.handleKeyEvent("w");
        await modeHandler.handleKeyEvent("c");

        assertEqualLines(["wo three"]);

        assert.equal(modeHandler.currentMode.name, ModeName.Insert, "should be in insert mode now");
    });
});
