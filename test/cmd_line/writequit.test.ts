"use strict";

import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual } from './../testUtils';
import { runCmdLine } from '../../src/cmd_line/main';
import * as vscode from "vscode";
import {join} from 'path';
import * as assert from 'assert';

async function WaitForVsCodeClose() : Promise<void> {
  // cleanUpWorkspace - testUtils.ts
  let poll = new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === 0) {
      return c();
    }

    let pollCount = 0;
    // TODO: the visibleTextEditors variable doesn't seem to be
    // up to date after a onDidChangeActiveTextEditor event, not
    // even using a setTimeout 0... so we MUST poll :(
    let interval = setInterval(() => {
      // if visibleTextEditors is not updated after 1 sec
      // we can expect that 'wq' failed
      if (pollCount <= 100) {
        pollCount++;
        if (vscode.window.visibleTextEditors.length > 0) {
          return;
        }
      }

      clearInterval(interval);
      c();
    }, 10);
  });

  try {
    await poll;
  } catch (error) {
    assert.fail(null, null, error.toString(), "");
  }
}

suite("Basic write-quit", () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test("Run write and quit", async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);

    await runCmdLine("wq", modeHandler);
    await WaitForVsCodeClose();

    assertEqual(vscode.window.visibleTextEditors.length, 0, "Window after 1sec still open");
  });
});