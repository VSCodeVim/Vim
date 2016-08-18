"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';

suite("Basic substitute", () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("Replace single word once", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<escape>']);
    await runCmdLine("%s/a/d", modeHandler);

    assertEqualLines([
      "dba"
    ]);
  });

  test("Replace with `g` flag", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<escape>']);
    await runCmdLine("%s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd"
    ]);
  });

  test("Replace multiple lines", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<escape>', 'o', 'a', 'b']);
    await runCmdLine("%s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd",
      "db"
    ]);
  });

  test("Replace across specific lines", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<escape>', 'o', 'a', 'b']);
    await runCmdLine("1,1s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd",
      "ab"
    ]);
  });

  test("Replace current line with no active selection", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<escape>', 'o', 'a', 'b', '<escape>']);
    await runCmdLine("s/a/d/g", modeHandler);

    assertEqualLines([
      "aba",
      "db"
    ]);
  });

  test("Replace text in selection", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<escape>', 'o', 'a', 'b', '<escape>', '$', 'v', 'k', '0']);
    await runCmdLine("'<,'>s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd",
      "db"
    ]);
  });
});