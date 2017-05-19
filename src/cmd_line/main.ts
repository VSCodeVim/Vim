"use strict";

import * as vscode from "vscode";
import * as parser from "./parser";
import {ModeHandler} from "../mode/modeHandler";
import {attach, RPCValue} from 'promised-neovim-client';
import {spawn} from 'child_process';
import { TextEditor } from "../textEditor";

async function run(currentText: string[], command: string) {
  const proc = spawn('nvim', ['-u', 'NONE', '-N', '--embed'], {cwd: __dirname });

  const nvim = await attach(proc.stdin, proc.stdout);
  nvim.on('request', (method: string, args: RPCValue[], resp: RPCValue) => {
      // handle msgpack-rpc request
  });

  nvim.on('notification', (method: string, args: RPCValue[]) => {
      // handle msgpack-rpc notification
  });

  await nvim.command('vsp');

  let lines: string[];
  const buf = await nvim.getCurrentBuf();
  await buf.setLines(0, -1, true, currentText);
  await nvim.command(command);
  return buf.getLines(0, -1, false);
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

  let t: string[] = [];
  await run(TextEditor.getText().split('\n'), command).then((res) => {
    console.log(res);
    t = res;
  });
  await TextEditor.replace(new vscode.Range(0, 0, TextEditor.getLineCount() - 1, TextEditor.getLineMaxColumn(TextEditor.getLineCount() - 1)), t.join('\n'));

  return;


  // try {
  //   var cmd = parser.parse(command);
  //   if (cmd.isEmpty) {
  //     return;
  //   }

  //   await cmd.execute(modeHandler.vimState.editor, modeHandler);
  //   return;
  // } catch (e) {
  //   modeHandler.setStatusBarText(e.toString());
  //   return;
  // }
}
