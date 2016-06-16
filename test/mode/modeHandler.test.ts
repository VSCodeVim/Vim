"use strict";

import * as assert from 'assert';
import { setupWorkspace, cleanUpWorkspace } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';

suite("Mode Handler", () => {

    setup(setupWorkspace);

    teardown(cleanUpWorkspace);

    test("ctor", () => {
        var modeHandler = new ModeHandler();

        assert.equal(modeHandler.currentMode.name, ModeName.Normal);
        assert.equal(modeHandler.currentMode.isActive, true);
    });

    test("can set current mode", async () => {
        var modeHandler = new ModeHandler();

        assert.equal(modeHandler.currentMode.name, ModeName.Normal);

        await modeHandler.handleKeyEvent("i");
        assert.equal(modeHandler.currentMode.name, ModeName.Insert);
    });
});
