"use strict";

import * as vscode from 'vscode';
import { ModeHandler } from "../../src/mode/modeHandler";
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual} from '../testUtils';
import { getTestingFunctions } from '../testSimplifier';
import * as util from '../../src/util';
import { getAndUpdateModeHandler } from "../../extension";

suite("register", () => {
  let modeHandler: ModeHandler;

  let {
      newTest,
      newTestOnly,
  } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: "Can copy to a register",
    start: ['|one', 'two'],
    keysPressed: '"add"ap',
    end: ["two", "|one"],
  });

  util.clipboardCopy("12345");

  newTest({
    title: "Can access '*' (clipboard) register",
    start: ['|one'],
    keysPressed: '"*P',
    end: ["1234|5one"],
  });

  newTest({
    title: "Can access '+' (clipboard) register",
    start: ['|one'],
    keysPressed: '"+P',
    end: ["1234|5one"],
  });

  newTest({
    title: "Can use two registers together",
    start: ['|one', "two"],
    keysPressed: '"ayyj"byy"ap"bp',
    end: ["one", "two", "one", "|two"],
  });

  newTest({
    title: "Can use black hole register",
    start: ['|asdf', "qwer"],
    keysPressed: 'yyj"_ddkp',
    end: ["asdf", "|asdf"],
  });

  test("System clipboard works with chinese characters", async () => {
    const testString = '你好';
    util.clipboardCopy(testString);
    assertEqual(testString, util.clipboardPaste());

    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    // Paste from our paste handler
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      '"', '*', 'P',
      'a'
    ]);
    assertEqualLines([testString]);

    // Now try the built in vscode paste
    await vscode.commands.executeCommand("editor.action.clipboardPasteAction");

    assertEqualLines([testString + testString]);
  });

  test("Yank stores text in Register '0'", async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents(
      'itest1\ntest2\ntest3'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g', 'g',
      'y', 'y',
      'j',
      'y', 'y',
      'g', 'g',
      'd', 'd',
      '"', '0',
      'P'
    ]);

    assertEqualLines([
      'test2',
      'test2',
      'test3'
    ]);
  });

  test("Register '1'-'9' stores delete content", async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents(
      'itest1\ntest2\ntest3\n'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g', 'g',
      'd', 'd',
      'd', 'd',
      'd', 'd',
      '"', '1', 'p',
      '"', '2', 'p',
      '"', '3', 'p'
    ]);

    assertEqualLines([
      '',
      'test3',
      'test2',
      'test1'
    ]);
  });

  test("\"A appends linewise text to \"a", async() => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents(
      'itest1\ntest2\ntest3'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g', 'g',
      'v', 'l', 'l',
      '"', 'a', 'y',
      'j',
      'V',
      '"', 'A', 'y',
      'j',
      '"', 'a', 'p'
    ]);

    assertEqualLines([
    'test1',
    'test2',
    'test3',
    'tes',
    'test2'
    ]);
  });

  test("\"A appends character wise text to \"a", async() => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleMultipleKeyEvents(
      'itest1\ntest2\n'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g', 'g',
      'v', 'l', 'l', 'l', 'l',
      '"', 'a', 'y',
      'j',
      'v', 'l', 'l', 'l', 'l',
      '"', 'A', 'y',
      'j',
      '"', 'a', 'p'
    ]);

    assertEqualLines([
    'test1',
    'test2',
    'test1test2',
    ]);
  });

});