"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';
import { getAndUpdateModeHandler } from "../../extension";

suite("read", () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test("Can read shell command output", async () => {
    await runCmdLine('r! echo hey\\\\n\\\\tho', modeHandler);
    assertEqualLines([
      'hey',
      '\tho',
      ''
    ]);
  });

});
