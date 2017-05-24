"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';
import { getAndUpdateModeHandler } from "../../extension";

suite("Basic substitute", () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("Replace single word once", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    await runCmdLine("%s/a/d", modeHandler);

    assertEqualLines([
      "dba"
    ]);
  });

  test("Replace with `g` flag", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    await runCmdLine("%s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd"
    ]);
  });

  test("Replace multiple lines", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
    await runCmdLine("%s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd",
      "db"
    ]);
  });

  test("Replace across specific lines", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
    await runCmdLine("1,1s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd",
      "ab"
    ]);
  });

  test("Replace current line with no active selection", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b', '<Esc>']);
    await runCmdLine("s/a/d/g", modeHandler);

    assertEqualLines([
      "aba",
      "db"
    ]);
  });

  test("Replace text in selection", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b', '<Esc>', '$', 'v', 'k', '0']);
    await runCmdLine("'<,'>s/a/d/g", modeHandler);

    assertEqualLines([
      "dbd",
      "db"
    ]);
  });

  test("Substitute support marks", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'c', '<Esc>', 'y', 'y', '2', 'p', 'g', 'g', 'm', 'a', 'j', 'm', 'b']);
    await runCmdLine("'a,'bs/a/d/g", modeHandler);

    assertEqualLines([
      "dbc",
      "dbc",
      "abc"
    ]);
  });
});