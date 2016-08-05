"use strict";

import { ModeHandler } from "../../src/mode/modeHandler";
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';

suite("put operator", () => {

  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();

    modeHandler = new ModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test("basic put test", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<escape>',
      '^', 'D', 'p', 'p'
    ]);

    await assertEqualLines(["blah blahblah blah"]);
  });

  test("test yy end of line", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah\nblah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<escape>',
      '^', 'y', 'y', 'p'
    ]);

    await assertEqualLines(["blah blah", "blah", "blah"]);
  });

  test("test yy first line", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah\nblah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<escape>',
      'g', 'g', 'y', 'y', 'p'
    ]);

    await assertEqualLines(["blah blah", "blah blah", "blah"]);
  });

  test("test yy middle line", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'i1\n2\n3'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<escape>',
      'k', 'y', 'y', 'p'
    ]);

    await assertEqualLines(["1", "2", "2", "3"]);
  });

});