"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';
import { getAndUpdateModeHandler } from "../../extension";
import { TextEditor } from "../../src/textEditor";
import { Configuration } from "../../src/configuration/configuration";

suite("read", () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test("Can read shell command output", async () => {
    await runCmdLine('r! echo hey', modeHandler);
    assertEqualLines([
      '',
      'hey',
    ]);
  });

});
