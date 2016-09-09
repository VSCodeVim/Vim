"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';

suite("read", () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("Can read shell command output", async () => {
    await runCmdLine('r! echo heyho', modeHandler);
    assertEqualLines([
      'heyho',
      ''
    ]);
  });
});
