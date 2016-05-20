"use strict";

import * as assert from 'assert';
import {CommandKeyMap} from '../../src/configuration/commandKeyMap';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import {InsertMode} from '../../src/mode/modeInsert';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import {TextEditor} from '../../src/textEditor';

suite("Mode Insert", () => {

    let motion: Motion;
    let modeInsert: InsertMode;

    setup(async () => {
        await setupWorkspace();

        motion = new Motion(MotionMode.Cursor);
        modeInsert = new InsertMode(motion, CommandKeyMap.DefaultInsertKeyMap());
    });

    teardown(cleanUpWorkspace);

    test("can be activated", () => {
        let activationKeys = ['i', 'I', 'o', 'O', 'a', 'A'];

        for (let key of activationKeys) {
            assert.equal(modeInsert.shouldBeActivated(key, ModeName.Normal), true, key);
        }

        assert.equal(modeInsert.shouldBeActivated("i", ModeName.Visual), false, "can be activated from visual");
    });

    test("can handle key events", async () => {
        await modeInsert.handleKeyEvent("!");

        return assertEqualLines(["!"]);
    });

    test("Can handle 'o'", async () => {
        await TextEditor.insert("text");
        await modeInsert.handleActivation("o");

        return assertEqualLines(["text", ""]);
    });

    test("Can handle 'O'", async () => {
        await TextEditor.insert("text");
        await modeInsert.handleActivation("O");

        return assertEqualLines(["", "text"]);
    });

    test("Can handle 'i'", async () => {
        await TextEditor.insert("texttext");

        motion = motion.moveTo(0, 4);
        await modeInsert.handleActivation("i");
        await modeInsert.handleKeyEvent("!");

        assertEqualLines(["text!text"]);
    });

    test("Can handle 'I'", async () => {
        await TextEditor.insert("text");
        motion = motion.moveTo(0, 3);

        await modeInsert.handleActivation("I");
        await modeInsert.handleKeyEvent("!");

        assertEqualLines(["!text"]);
    });

    test("Can handle 'a'", async () => {
        await TextEditor.insert("texttext");

        motion = motion.moveTo(0, 4);
        await modeInsert.handleActivation("a");
        await modeInsert.handleKeyEvent("!");

        assertEqualLines(["textt!ext"]);
    });

    test("Can handle 'A'", async () => {
        await TextEditor.insert("text");

        motion = motion.moveTo(0, 0);
        await modeInsert.handleActivation("A");
        await modeInsert.handleKeyEvent("!");

        assertEqualLines(["text!"]);
    });
});
