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
    title: "Can use two registers together",
    start: ['|one', "two"],
    keysPressed: '"ayyj"byy"ap"bp',
    end: ["one", "two", "one", "|two"],
  });

});