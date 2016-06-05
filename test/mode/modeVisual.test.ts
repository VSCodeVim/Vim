"use strict";

import * as assert from 'assert';
import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { TextEditor } from '../../src/textEditor';

suite("Mode Visual", () => {
    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();
        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

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

    test("Can handle x across a selection", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'v', 'w', 'x'
        ]);

        assertEqualLines(["wo three"]);

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

    test("Can do vwd in middle of sentence", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'l', 'l', 'l', 'l',
            'v', 'w', 'd'
        ]);

        assertEqualLines(["one hree"]);
    });

    test("Can do vwd multiple times", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three four".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'v', 'w', 'd',
            'v', 'w', 'd',
            'v', 'w', 'd'
        ]);

        assertEqualLines(["our"]);
    });

    test("handles case where we go from selecting on right side to selecting on left side", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'l', 'l', 'l', 'l',
            'v', 'w', 'b', 'b', 'd'
        ]);

        assertEqualLines(["wo three"]);
    });

    test("handles case where we delete over a newline", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two\n\nthree four".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '0', 'k', 'k',
            'v', '}', 'd'
        ]);

        assertEqualLines(["three four"]);
    });

    test("handles change operator", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'v', 'w', 'c'
        ]);

        assertEqualLines(["wo three"]);
        assertEqual(modeHandler.currentMode.name, ModeName.Insert);
    });
});
