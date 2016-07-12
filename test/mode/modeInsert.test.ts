"use strict";

import {setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual} from './../testUtils';
import {ModeName} from '../../src/mode/mode';
import {TextEditor} from '../../src/textEditor';
import {ModeHandler} from "../../src/mode/modeHandler";

suite("Mode Insert", () => {
    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();

        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

    test("can be activated", async () => {
        let activationKeys = ['o', 'I', 'i', 'O', 'a', 'A'];

        for (let _key of activationKeys) {
            const key = _key!;

            await modeHandler.handleKeyEvent(key);
            assertEqual(modeHandler.currentMode.name, ModeName.Insert);

            await modeHandler.handleKeyEvent('<esc>');
        }
    });

    test("can handle key events", async () => {
        await modeHandler.handleMultipleKeyEvents(['i', '!']);

        return assertEqualLines(["!"]);
    });

    test("<esc> should change cursor position", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            'h', 'e', 'l', 'l', 'o',
            '<esc>'
        ]);

        assertEqual(TextEditor.getSelection().start.character, 4, "<esc> moved cursor position.");
    });

    test("Can handle 'o'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't',
            '<esc>',
            'o'
        ]);

        return assertEqualLines(["text", ""]);
    });

    test("Can handle 'O'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't',
            '<esc>',
            'O'
        ]);

        return assertEqualLines(["", "text"]);
    });

    test("Can handle 'i'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't', 't', 'e', 'x', 't', // insert 'texttext'
            '<esc>',
            '^', 'l', 'l', 'l', 'l',                // move to the 4th character
            'i',
            '!'                                     // insert a !
        ]);

        assertEqualLines(["text!text"]);
    });

    test("Can handle 'I'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't',
            '<esc>',
            '^', 'l', 'l', 'l',
            'I',
            '!',
        ]);

        assertEqualLines(["!text"]);
    });

    test("Can handle 'a'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't', 't', 'e', 'x', 't', // insert 'texttext'
            '<esc>',
            '^', 'l', 'l', 'l', 'l',                // move to the 4th character
            'a',
            '!'                                     // append a !
        ]);

        assertEqualLines(["textt!ext"]);
    });

    test("Can handle 'A'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't',
            '<esc>',
            '^',
            'A',
            '!',
        ]);

        assertEqualLines(["text!"]);
    });
});
