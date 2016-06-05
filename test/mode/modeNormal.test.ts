"use strict";

import * as assert from 'assert';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { TextEditor } from '../../src/textEditor';
import { ModeHandler } from '../../src/mode/modeHandler';

suite("Mode Normal", () => {

    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();

        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

    test("can be activated", async () => {
        let activationKeys = ['<esc>', '<c-[>'];

        for (let key of activationKeys) {
            await modeHandler.handleKeyEvent('i');
            await modeHandler.handleKeyEvent(key);

            assertEqual(modeHandler.currentMode.name, ModeName.Normal);
        }

        await modeHandler.handleKeyEvent('v');
        await modeHandler.handleKeyEvent('v');

        assertEqual(modeHandler.currentMode.name, ModeName.Normal);
    });

    test("Can handle 'x'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't',
            '<esc>',
            '^', 'l', 'l',
            'x',
        ]);

        assertEqualLines(["tet"]);
    });

    test("Can handle 'dw'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'w',
            'd', 'w'
        ]);

        await assertEqualLines(["text text"]);
        await modeHandler.handleMultipleKeyEvents(['d', 'w']);

        await assertEqualLines(["text "]);

        await modeHandler.handleMultipleKeyEvents(['d', 'w']);
        await assertEqualLines(["text"]);
    });

    test("Can handle dd end-of-line", async () => {
        await modeHandler.handleMultipleKeyEvents("ione\ntwo".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'd', 'd'
        ]);

        assertEqualLines(["one"]);
    });

    test("Can handle dd single line", async () => {
        await modeHandler.handleMultipleKeyEvents("ione".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            'd', 'd'
        ]);

        assertEqualLines([""]);
    });

    test("Can handle dd", async () => {
        await modeHandler.handleMultipleKeyEvents("ione\ntwo".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', 'g', 'g',
            'd', 'd'
        ]);

        assertEqualLines(["two"]);
    });

    test("Can handle cc", async () => {
        await modeHandler.handleMultipleKeyEvents("ione\none two".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'c', 'c', 'a', '<esc>'
        ]);

        assertEqualLines(["one", "a"]);
    });


    test("Can handle yy", async () => {
        await modeHandler.handleMultipleKeyEvents("ione".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'y', 'y', 'O', '<esc>', 'p'
        ]);

        assertEqualLines(["one", "one"]);
    });

    test("Can handle 'de'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^',
            'd', 'e'
        ]);

        await assertEqualLines([" text"]);
        await modeHandler.handleMultipleKeyEvents(['d', 'e']);
        await assertEqualLines([""]);
    });

    test("Can handle 'db'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '$',
            'd', 'b'
        ]);

        await assertEqualLines(["text t"]);
        await modeHandler.handleMultipleKeyEvents(['d', 'b']);
        await assertEqualLines(["t"]);
    });

    test("Can handle 'dl' at end of line", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'iblah'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '$',
            'd', 'l',
            'd', 'l',
            'd', 'l',
        ]);

        await assertEqualLines(["b"]);
    });

    test("Can handle 'D'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^',
            'l', 'l',
            'D'
        ]);

        await assertEqualLines(["te"]);
        await modeHandler.handleKeyEvent('D');
        await assertEqualLines(["t"]);
    });

    test("Can handle 'ge'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents(['<esc>', '$', 'g', 'e']);

        assertEqual(TextEditor.getSelection().start.character, 3, "ge failed");
    });

    test("Can handle 'gg'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext\ntext\ntext'.split('')
        );

        await modeHandler.handleMultipleKeyEvents(['<esc>', '$', 'j', 'k', 'j', 'g', 'g']);

        assertEqual(TextEditor.getSelection().start.character, 0, "gg failed");
        assertEqual(TextEditor.getSelection().start.line, 0, "gg failed");
    });

    test("Can handle x at end of line", async () => {
        await modeHandler.handleMultipleKeyEvents("ione two".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'l', 'l',
            'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'
        ]);

        assertEqualLines([""]);
    });

    test("Can handle 'C'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext'.split('')
        );

        await modeHandler.handleMultipleKeyEvents(['<esc>', '^', 'l', 'l', 'C']);

        await assertEqualLines(["te"]);
        await assert.equal(modeHandler.currentMode.name === ModeName.Insert, true, "didn't enter insert mode");
    });

    test("Can handle 'cw'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'l', 'l', 'l', 'l', 'l', 'l', 'l',
            'c', 'w'
        ]);

        await assertEqualLines(["text te text"]);
        await assert.equal(modeHandler.currentMode.name === ModeName.Insert, true, "didn't enter insert mode");
    });

    test("Retain same column when moving up/down", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text\ntext\ntext text'.split('')
        );
        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            'k', 'k'
        ]);

        assertEqual(TextEditor.getSelection().start.character, 8, "same column failed");
    });

    test("$ always keeps cursor on EOL", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text\ntext\ntext text'.split('')
        );
        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            'g', 'g',
            '$',
            'j', 'j'
        ]);

        assertEqual(TextEditor.getSelection().start.character, 8, "$ column thing failed :()");
    });

    test("Can handle 'ciw'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'l', 'l', 'l', 'l', 'l', 'l', 'l',
            'c', 'i', 'w'
        ]);

        await assertEqualLines(["text  text"]);
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'ciw' on blanks", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext   text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'l', 'l', 'l', 'l', 'l',
            'c', 'i', 'w'
        ]);

        await assertEqualLines(["texttext text"]);
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'caw'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'l', 'l', 'l', 'l', 'l', 'l',
            'c', 'a', 'w'
        ]);

        assertEqual(TextEditor.getSelection().start.character, 5, "caw is on wrong position");
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'caw' on first letter", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'l', 'l', 'l', 'l', 'l',
            'c', 'a', 'w'
        ]);

        assertEqual(TextEditor.getSelection().start.character, 5, "caw is on wrong position");
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'caw' on blanks", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext   text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'l', 'l', 'l', 'l', 'l',
            'c', 'a', 'w'
        ]);

        await assertEqualLines(["text"]);
        assertEqual(TextEditor.getSelection().start.character, 3, "caw is on wrong position");
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });
});
