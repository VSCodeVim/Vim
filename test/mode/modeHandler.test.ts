"use strict";

import * as assert from 'assert';
import * as vscode from 'vscode';
import {setupWorkspace, cleanUpWorkspace} from './../testUtils';
import {ModeName} from '../../src/mode/mode';
import {ModeHandler} from '../../src/mode/modeHandler';

suite("Mode Handler", () => {

    setup(setupWorkspace);

    teardown(cleanUpWorkspace);

    test("ctor", () => {
        var modeHandler = new ModeHandler();

        assert.equal(modeHandler.currentMode.name, ModeName.Normal);
        assert.equal(modeHandler.currentMode.isActive, true);
    });

    test("TODO", () => {
        assert.equal(true, false, "FAIL!!!");
    })

    /*
    test("can set current mode", () => {
        var modeHandler = new ModeHandler();

        modeHandler.setCurrentModeByName(ModeName.Normal);
        assert.equal(modeHandler.currentMode.name, ModeName.Normal);

        modeHandler.setCurrentModeByName(ModeName.Insert);
        assert.equal(modeHandler.currentMode.name, ModeName.Insert);
    });

    test("Uses correct cursor style depending on mode", async () => {
        const modeHandler = new ModeHandler();

        modeHandler.setCurrentModeByName(ModeName.Normal);
        assert.equal(vscode.window.activeTextEditor.options.cursorStyle, vscode.TextEditorCursorStyle.Block);

        modeHandler.setCurrentModeByName(ModeName.Insert);
        assert.equal(vscode.window.activeTextEditor.options.cursorStyle, vscode.TextEditorCursorStyle.Line);

        modeHandler.setCurrentModeByName(ModeName.Visual);
        assert.equal(vscode.window.activeTextEditor.options.cursorStyle, vscode.TextEditorCursorStyle.Block);
    });
    */

});
