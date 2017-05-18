"use strict";

import * as vscode from "vscode";
import * as parser from "./parser";
import {ModeHandler} from "../mode/modeHandler";

// Shows the vim command line.
export async function showCmdLine(initialText: string, modeHandler : ModeHandler): Promise<undefined> {
  if (!vscode.window.activeTextEditor) {
    console.log("No active document.");
    return;
  }

  const options : vscode.InputBoxOptions = {
    prompt: "Vim command line",
    value: initialText,
    ignoreFocusOut: true,
    valueSelection: [initialText.length, initialText.length]
  };

  try {
    const cmdString = await vscode.window.showInputBox(options);
    await runCmdLine(cmdString!, modeHandler);
    return;
  } catch (e) {
    modeHandler.setStatusBarText(e.toString());
    return;
  }
}

export async function runCmdLine(command : string, modeHandler : ModeHandler) : Promise<undefined> {
  if (!command || command.length === 0) {
    return;
  }

  try {
    var cmd = parser.parse(command);
    if (cmd.isEmpty) {
      return;
    }

    await cmd.execute(modeHandler.vimState.editor, modeHandler);
    return;
  } catch (e) {
    modeHandler.setStatusBarText(e.toString());
    return;
  }
}
