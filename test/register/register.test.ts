"use strict";

import * as vscode from 'vscode';
import { ModeHandler } from "../../src/mode/modeHandler";
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';
import { getTestingFunctions } from '../testSimplifier';
import * as clipboard from 'copy-paste';

suite("register", () => {
  let modeHandler: ModeHandler;

  let {
      newTest,
      newTestOnly,
  } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  newTest({
    title: "Can copy to a register",
    start: ['|one', 'two'],
    keysPressed: '"add"ap',
    end: ["two", "|one"],
  });

  clipboard.copy("12345");

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