"use strict";

import * as assert from 'assert';
import {CommandKeyMap} from '../../src/configuration/commandKeyMap';
import {ModeHandler} from '../../src/mode/modeHandler';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual} from './../testUtils';
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

    test("I broke visual mode tests", async () => {
        assert(false, "I BROKE THEM!");
    });

    test("can be activated", async () => {
        await modeHandler.handleKeyEvent('v');
        assertEqual(modeHandler.currentMode.name, ModeName.Visual);

        await modeHandler.handleKeyEvent('v');
        assertEqual(modeHandler.currentMode.name, ModeName.Normal);
    });

    test("Can handle w", async () => {
        await modeHandler.handleMultipleKeyEvents("itest test test\ntest\n".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', 'g', 'g',
            'v', 'w'
        ]);

        const sel = TextEditor.getSelection();

        assert.equal(sel.start.character, 0);
        assert.equal(sel.start.line, 0);

        // The input cursor comes BEFORE the block cursor. Try it out, this
        // is how Vim works.
        assert.equal(sel.end.character, 5);
        assert.equal(sel.end.line, 0);
    });

    test("Can handle wd", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'v', 'w', 'd'
        ]);

        assertEqualLines(["wo three"]);
    });

    test("Can handle x", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'v', 'x'
        ]);

        assertEqualLines(["ne two three"]);

        assertEqual(modeHandler.currentMode.name, ModeName.Normal);
    });

    test("Can do vwd in middle of sentence", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three foar".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'l', 'l', 'l', 'l',
            'v', 'w', 'd'
        ]);

        assertEqualLines(["one hree foar"]);
    });

    /*
    TODO

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
    */


});
