"use strict";

import { setupWorkspace, cleanUpWorkspace, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

import * as vscode from 'vscode';

suite("Mode Visual Block", () => {
  let modeHandler: ModeHandler;

  let {
    newTest,
    newTestOnly,
  } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("can be activated", async () => {
    modeHandler.vimState.editor = vscode.window.activeTextEditor!;

    await modeHandler.handleKeyEvent('<C-v>');
    assertEqual(modeHandler.currentMode.name, ModeName.VisualBlock);

    await modeHandler.handleKeyEvent('<C-v>');
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  newTest({
    title: "Can handle A forward select",
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljA123',
    end: ['tes123|t', 'tes123t'],
  });

  newTest({
    title: "Can handle A backwards select",
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjA123',
    end: ['tes123|t', 'tes123t'],
  });

  newTest({
    title: "Can handle I forward select",
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljI123',
    end: ['t123|est', 't123est'],
  });

  newTest({
    title: "Can handle I backwards select",
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjI123',
    end: ['t123|est', 't123est'],
  });

  newTest({
    title: "Can handle I with empty lines on first character (inserts on empty line)",
    start: ['|test', '', 'test'],
    keysPressed: '<C-v>lljjI123',
    end: ['123|test', '123', '123test'],
  });

  newTest({
    title: "Can handle I with empty lines on non-first character (does not insert on empty line)",
    start: ['t|est', '', 'test'],
    keysPressed: '<C-v>lljjI123',
    end: ['t123|est', '', 't123est'],
  });

  newTest({
    title: "Can handle c forward select",
    start: ['|test', 'test'],
    keysPressed: 'l<C-v>ljc123',
    end: ['t123|t', 't123t'],
  });

  newTest({
    title: "Can handle c backwards select",
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjc123',
    end: ['t123|t', 't123t'],
  });

  newTest({
    title: "Can handle s backwards select",
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjs123',
    end: ['t123|t', 't123t'],
  });

  newTest({
    title: "Can handle C",
    start: ['tes|t', 'test'],
    keysPressed: 'h<C-v>hjC123',
    end: ['t123|', 't123'],
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
