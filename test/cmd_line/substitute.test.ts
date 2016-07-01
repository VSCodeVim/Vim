"use strict";

import * as assert from 'assert';
import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { TextEditor } from '../../src/textEditor';
import { runCmdLine } from '../../src/cmd_line/main';

suite("Basic substitute", () => {
    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();
        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

    test("Replace single word once", async () => {
        await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<esc>']);
        await runCmdLine("%s/a/d", modeHandler);

        assertEqualLines([
            "dba"
        ]);
    });

    test("Replace with `g` flag", async () => {
        await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<esc>']);
        await runCmdLine("%s/a/d/g", modeHandler);

        assertEqualLines([
            "dbd"
        ]);
    });

    test("Replace multiple lines", async () => {
        await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<esc>', 'o', 'a', 'b']);
        await runCmdLine("%s/a/d/g", modeHandler);

        assertEqualLines([
            "dbd",
            "db"
        ]);
    });

    test("Replace across specific lines", async () => {
        await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<esc>', 'o', 'a', 'b']);
        await runCmdLine("1,1s/a/d/g", modeHandler);

        assertEqualLines([
            "dbd",
            "ab"
        ]);
    });


});