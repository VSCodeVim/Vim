"use strict";

import { ModeHandler } from "../../src/mode/modeHandler";
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';
import { getTestingFunctions } from '../testSimplifier';
import * as clipboard from 'copy-paste';

suite("register", () => {
  let modeHandler: ModeHandler = new ModeHandler();

  let {
      newTest,
      newTestOnly,
  } = getTestingFunctions(modeHandler);

  setup(async () => {
    await setupWorkspace();
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

});