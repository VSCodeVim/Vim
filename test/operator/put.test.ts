"use strict";

import { ModeHandler } from "../../src/mode/modeHandler";
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';

suite("put operator", () => {

    let modeHandler: ModeHandler;

    setup(async () => {
        await setupWorkspace();

        modeHandler = new ModeHandler();
    });

    suiteTeardown(cleanUpWorkspace);

    test ("basic put test", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'iblah blah'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'D', 'p', 'p'
        ]);

        await assertEqualLines(["blah blahblah blah"]);
    });
});