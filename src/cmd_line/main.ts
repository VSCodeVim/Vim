"use strict";

import * as vscode from "vscode";
import * as parser from "./parser";
import {VimState, ModeHandler} from "../mode/modeHandler";
import { ModeName } from './../mode/mode';
import {attach, RPCValue} from 'promised-neovim-client';
import {spawn} from 'child_process';
import { TextEditor } from "../textEditor";

async function run(vimState: VimState, command: string) {
  const proc = spawn('nvim', ['-u', 'NONE', '-N', '--embed'], {cwd: __dirname });

  const nvim = await attach(proc.stdin, proc.stdout);

  const buf = await nvim.getCurrentBuf();
  const window = await nvim.getCurrentWin();
  await buf.setLines(0, -1, true, TextEditor.getText().split('\n'));
  if (vimState.currentMode === ModeName.Visual || vimState.currentMode === ModeName.VisualLine) {
    let t : RPCValue
    await nvim.callFunction("cursor", [vimState.cursorStartPosition.line, vimState.cursorStartPosition.character]);
    await nvim.input("V");
    await nvim.callFunction("cursor", [vimState.cursorPosition.line, vimState.cursorPosition.character]);
  } else {
    await nvim.callFunction("cursor", [vimState.cursorPosition.line, vimState.cursorPosition.character]);
  }
  await nvim.command(command);

  await TextEditor.replace(new vscode.Range(0, 0, TextEditor.getLineCount() - 1, TextEditor.getLineMaxColumn(TextEditor.getLineCount() - 1)), (await buf.getLines(0, -1, false)).join('\n'));
  nvim.quit();
  return;

}

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
    console.log("DONE");
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

  await run(modeHandler.vimState, command).then(() => {
    console.log("SUCCESS");
  }).catch((err)=>console.log(err));
  return;
  // try {
  //   var cmd = parser.parse(command);
  //   if (cmd.isEmpty) {
  //     return;
  //   }

  //   await cmd.execute(modeHandler.vimState.editor, modeHandler);
  //   return;
  // } catch (e) {
  //   await run(modeHandler, command).then(() => {
  //     console.log("SUCCESS");
  //   });
  //   return;
  // }
}
