"use strict";

import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual} from './../testUtils';
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

    /*

    These tests don't pass because the functionality is broken!

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
            '^', 'l', 'l', 'l', 'l', 'l',
            'c', 'a', 'w'
        ]);

        assertEqual(TextEditor.getSelection().start.character, 5, "caw is on wrong position");
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });

    test("Can handle 'caw' on blanks", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext   text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'l', 'l', 'l', 'l', 'l',
            'c', 'a', 'w'
        ]);

        await assertEqualLines(["text"]);
        assertEqual(TextEditor.getSelection().start.character, 4, "caw is on wrong position");
        await assert.equal(modeHandler.currentMode.name, ModeName.Insert, "didn't enter insert mode");
    });
    */
});
