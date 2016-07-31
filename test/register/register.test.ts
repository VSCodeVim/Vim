"use strict";

import { ModeHandler } from "../../src/mode/modeHandler";
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';

suite("register", () => {

  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();

    modeHandler = new ModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test("basic register put test", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<esc>',
      '^', '"', '"', 'D', '"', '"', 'p', '"', '"', 'p'
    ]);

    await assertEqualLines(["blah blahblah blah"]);
  });

  test("test yy and '*' register", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah\nblah'.split('')
    );

    await modeHandler.handleMultipleKeyEvents([
      '<esc>',
      '^', '"', '*', 'y', 'y', '"', '*', 'p'
    ]);

    await assertEqualLines(["blah blah", "blah", "blah"]);
  });

  test("test two seperate registers", async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iblah blah\nblah'.split('')
    );
    /* Register '"' is the default register */
    await modeHandler.handleMultipleKeyEvents([
      '<esc>',
      'g', 'g', '"', '*', 'y', 'y', 'j', 'y', 'y', '"', '*', 'p', 'p',
    ]);

    await assertEqualLines(["blah blah", "blah", "blah blah", "blah"]);
  });

});