"use strict";

import { ModeHandler } from "../../src/mode/modeHandler";
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';
import { getTestingFunctions } from '../testSimplifier';
import { getAndUpdateModeHandler } from "../../extension";

suite("put operator", () => {

  let modeHandler: ModeHandler;

  let {
    newTest,
    newTestOnly,
  } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("basic put test", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      '^', 'D', 'p', 'p'
    ]);

    await assertEqualLines(["blah blahblah blah"]);
  });

  test("test yy end of line", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah\nblah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      '^', 'y', 'y', 'p'
    ]);

    await assertEqualLines(["blah blah", "blah", "blah"]);
  });

  test("test yy first line", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah\nblah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'g', 'g', 'y', 'y', 'p'
    ]);

    await assertEqualLines(["blah blah", "blah blah", "blah"]);
  });

  test("test yy middle line", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'i1\n2\n3'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<Esc>',
      'k', 'y', 'y', 'p'
    ]);

    await assertEqualLines(["1", "2", "2", "3"]);
  });

  newTest({
    title: "test yy with correct positon movement",
    start: ["o|ne", "two", "three", "four"],
    keysPressed: '2yyjjpk',
    end: ["one", "two", "|three", "one", "two", "four"]
  });
});