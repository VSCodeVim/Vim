"use strict";

import * as assert from 'assert';
import * as vscode from "vscode";
import {ModeHandler} from '../../src/mode/modeHandler';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {VisualMode} from '../../src/mode/modeVisual';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import {TextEditor} from '../../src/textEditor';

suite("Mode Visual", () => {
    let motion: Motion;
    let visualMode: VisualMode;
    let modeHandler: ModeHandler;
    let tmpFile: vscode.Uri;

    suiteSetup(async () => {
        tmpFile = await setupWorkspace();

        modeHandler = new ModeHandler();
        motion      = new Motion(MotionMode.Cursor);
        visualMode  = new VisualMode(motion, modeHandler);
    });

    suiteTeardown(async () => {
        await cleanUpWorkspace(tmpFile);
        modeHandler.dispose();
    });

    test("can be activated", () => {
        assert.equal(visualMode.shouldBeActivated("v", ModeName.Normal), true, "v didn't trigger visual mode...");
        assert.equal(visualMode.shouldBeActivated("v", ModeName.Insert), false, "activated from insert mode");
    });

    test("Can handle w", async () => {
        await TextEditor.insert("test test test\ntest\n");

        motion.moveTo(0, 0);

        await visualMode.handleActivation('v');
        await visualMode.handleKeyEvent("w");

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
        motion.moveTo(0, 0);

        await visualMode.handleActivation('v');
        await visualMode.handleKeyEvent("w");
        await visualMode.handleKeyEvent("d");

        assertEqualLines(["wo three"]);
    });

    test("Can handle x", async () => {
        await TextEditor.insert("one two three");
        motion.moveTo(0, 0);

        await visualMode.handleActivation('v');
        await visualMode.handleKeyEvent("x");

        assertEqualLines(["ne two three"]);
    });

    test("can do vwd in middle of sentence", async () => {
        await TextEditor.insert("one two three foar");
        motion.moveTo(0, 4);

        await visualMode.handleActivation('v');
        await visualMode.handleKeyEvent("w");
        await visualMode.handleKeyEvent("d");

        assertEqualLines(["one hree foar"]);
    });

    test("handles case where we go from selecting on right side to selecting on left side", async () => {
        await TextEditor.insert("one two three");
        motion.moveTo(0, 4);

        await visualMode.handleActivation('v');
        await visualMode.handleKeyEvent("w");
        await visualMode.handleKeyEvent("b");
        await visualMode.handleKeyEvent("b");
        await visualMode.handleKeyEvent("d");

        assertEqualLines(["wo three"]);
    });

    test("delete operator handles empty line", async () => {
        await TextEditor.insert("one two\n\nthree four");
        motion.moveTo(0, 0);

        await visualMode.handleActivation('v');
        await visualMode.handleKeyEvent("}");
        await visualMode.handleKeyEvent("d");

        assertEqualLines(["three four"]);
    });

    test("Change operator", async () => {
        await TextEditor.insert("one two three");
        motion.moveTo(0, 0);

        await visualMode.handleActivation('v');
        await visualMode.handleKeyEvent("w");
        await visualMode.handleKeyEvent("c");

        assertEqualLines(["wo three"]);

        assert.equal(((visualMode as any)._modeHandler as ModeHandler).currentMode.name, ModeName.Insert);
    });
});
