"use strict";

import * as assert from 'assert';
import { setupWorkspace, cleanUpWorkspace } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';

suite("Mode Handler", () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("ctor", () => {
    assert.equal(modeHandler.currentMode.name, ModeName.Normal);
    assert.equal(modeHandler.currentMode.isActive, true);
  });

  test("can set current mode", async () => {
    assert.equal(modeHandler.currentMode.name, ModeName.Normal);

    await modeHandler.handleKeyEvent("i");
    assert.equal(modeHandler.currentMode.name, ModeName.Insert);
  });
});
