"use strict";

import * as assert from 'assert';
import * as vscode from "vscode";
import {setupWorkspace, cleanUpWorkspace} from './../testUtils';
import {ModeName} from '../../src/mode/mode';
import {ModeHandler} from '../../src/mode/modeHandler';

suite("Mode Handler", () => {

    let tmpFile: vscode.Uri;

    setup(async () => {
        tmpFile = await setupWorkspace();
    });

    teardown(async () => {
        await cleanUpWorkspace(tmpFile);
    });

    test("ctor", () => {
        var modeHandler = new ModeHandler();

        assert.equal(modeHandler.currentMode.name, ModeName.Normal);
        assert.equal(modeHandler.currentMode.isActive, true);

        modeHandler.dispose();
    });

    test("can set current mode", () => {
        var modeHandler = new ModeHandler();

        modeHandler.setCurrentModeByName(ModeName.Normal);
        assert.equal(modeHandler.currentMode.name, ModeName.Normal);

        modeHandler.setCurrentModeByName(ModeName.Insert);
        assert.equal(modeHandler.currentMode.name, ModeName.Insert);

        modeHandler.setCurrentModeByName(ModeName.Visual);
        assert.equal(modeHandler.currentMode.name, ModeName.Visual);

        modeHandler.dispose();
    });
});
