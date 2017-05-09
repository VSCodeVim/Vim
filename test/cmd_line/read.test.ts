"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';

suite("read", () => {
  let modeHandler = new ModeHandler();

  test("Can read shell command output", async () => {
    await runCmdLine('r! echo hey\\\\n\\\\tho', modeHandler);
    assertEqualLines([
      'hey',
      '\tho',
      ''
    ]);
  });

});
