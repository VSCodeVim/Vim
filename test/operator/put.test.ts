"use strict";

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ModeHandler } from "../../src/mode/modeHandler";
import { PutOperator } from "../../src/actions/actions";
import { TextEditor } from '../../src/textEditor';
import { Position, PositionOptions } from "../../src/motion/position";
import { setupWorkspace, cleanUpWorkspace } from '../testUtils';
import { Register } from '../../src/register/register';


suite("put operator", () => {
    suiteSetup(setupWorkspace);

    suiteTeardown(cleanUpWorkspace);

    test ("stuff doesnt work", () => {
        assert(false);
    });

/*
    test("put 'the dog' into empty file", async () => {
        const expectedText = "the dog";
        const position = new Position(0, 0, PositionOptions.CharacterWiseExclusive);
        const mode = new ModeHandler();
        const put = new PutOperator();

        Register.put(expectedText);

        await put.run(position, position);

        const actualText = TextEditor.readLineAt(0);
        const cursorPosition = vscode.window.activeTextEditor.selection.active;
        assert.equal(actualText, expectedText,
            "did not paste expected content");
        assert.equal(cursorPosition.line, position.getRight().line,
            "cursor should be on the same line");
        assert.equal(cursorPosition.character, position.getRight().character,
            "cursor should be on start of put content");
    });

    test("put ' brown' into 'the dog'", async () => {
        const phrase = "brown ";
        const expectedText = `the ${phrase}dog`;
        const position = new Position(0, 3, PositionOptions.CharacterWiseExclusive);
        const mode = new ModeHandler();
        const put = new PutOperator();

        Register.put(phrase);

        // using ^ to show the cusor position
        // before : the dog
        //             ^
        // after  : the brown dog
        //              ^

        await put.run(position, position);

        const actualText = TextEditor.readLineAt(0);
        const cursorPosition = vscode.window.activeTextEditor.selection.active;
        assert.equal(actualText, expectedText,
            "did not paste expected content");
        assert.equal(cursorPosition.line, position.getRight().line,
            "cursor should be on the same line");
        assert.equal(cursorPosition.character, position.getRight().character,
            "cursor should be on start of put content");
    });
    */
});