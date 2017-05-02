"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';

suite("Basic sort", () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("Sort whole file, asc", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'b', '<Esc>', 'o', 'a', '<Esc>', 'o', 'c', '<Esc>']);
    await runCmdLine("sort", modeHandler);

    assertEqualLines([
      "a",
      "b",
      "c"
    ]);
  });

  test("Sort whole file, dsc", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'b', '<Esc>', 'o', 'a', '<Esc>', 'o', 'c', '<Esc>']);
    await runCmdLine("sort!", modeHandler);

    assertEqualLines([
      "c",
      "b",
      "a"
    ]);
  });

  test("Sort range, asc", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'b', '<Esc>', 'o', 'd', '<Esc>', 'o', 'a', '<Esc>', 'o', 'c', '<Esc>']);
    await runCmdLine("1,3sort", modeHandler);

    assertEqualLines([
      "a",
      "b",
      "d",
      "c"
    ]);
  });

  test("Sort range, dsc", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'b', '<Esc>', 'o', 'd', '<Esc>', 'o', 'a', '<Esc>', 'o', 'c', '<Esc>']);
    await runCmdLine("2,4sort!", modeHandler);

    assertEqualLines([
      "b",
      "d",
      "c",
      "a"
    ]);
  });

  test("#1592. Sort should work in Visual/VisualLine Mode without specifying ranges in ex commands", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'b', '<Esc>', 'o', 'a', '<Esc>', 'o', 'a', '<Esc>', 'g', 'g', 'V', 'j']);
    await runCmdLine("sort", modeHandler);

    assertEqualLines([
      "a",
      "b",
      "a"
    ]);
  });
});