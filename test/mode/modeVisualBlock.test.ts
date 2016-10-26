"use strict";

import { setupWorkspace, setTextEditorOptions, cleanUpWorkspace, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

suite("Mode Visual Block", () => {
  let modeHandler: ModeHandler = new ModeHandler();

  let {
    newTest,
    newTestOnly,
  } = getTestingFunctions(modeHandler);

  setup(async () => {
    await setupWorkspace();
    setTextEditorOptions(4, false);
  });

  teardown(cleanUpWorkspace);

  test("can be activated", async () => {
    await modeHandler.handleKeyEvent('<C-v>');
    assertEqual(modeHandler.currentMode.name, ModeName.VisualBlock);

    await modeHandler.handleKeyEvent('<C-v>');
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  newTest({
    title: "Can handle A forward select",
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljA123',
    end: ['tes123t', 'tes123|t'],
  });

  newTest({
    title: "Can handle A backwards select",
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjA123',
    end: ['tes123t', 'tes123|t'],
  });

  newTest({
    title: "Can handle I forward select",
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljI123',
    end: ['t123est', 't123|est'],
  });

  newTest({
    title: "Can handle I backwards select",
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjI123',
    end: ['t123est', 't123|est'],
  });

  newTest({
    title: "Can do a multi line replace",
    start: ["one |two three four five", "one two three four five"],
    keysPressed: "<C-v>jeer1",
    end: ["one |111111111 four five", "one 111111111 four five"],
    endMode: ModeName.Normal
  });

  newTest({
    title: "Can handle 'D'",
    start: ['tes|t', 'test'],
    keysPressed: '<C-v>hjD',
    end: ['t|e', 'te'],
  });

});
