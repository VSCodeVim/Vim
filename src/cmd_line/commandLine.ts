import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { Neovim } from '../neovim/neovim';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import * as parser from './parser';
import * as util from '../util';
import { VimError, ErrorCode } from '../error';

export class CommandLine {
  public static async PromptAndRun(initialText: string, vimState: VimState): Promise<void> {
    if (!vscode.window.activeTextEditor) {
      console.log('CommandLine: No active document.');
      return;
    }

    let cmd = await vscode.window.showInputBox(this.getInputBoxOptions(initialText));
    if (cmd && cmd[0] === ':' && configuration.cmdLineInitialColon) {
      cmd = cmd.slice(1);
    }

    await CommandLine.Run(cmd!, vimState);
  }

  public static async Run(command: string, vimState: VimState): Promise<void> {
    if (!command || command.length === 0) {
      return;
    }

    try {
      const cmd = parser.parse(command);
      const useNeovim = configuration.enableNeovim && cmd.command && cmd.command.neovimCapable;

      if (useNeovim) {
        await vimState.nvim.run(vimState, command);
      } else {
        await cmd.execute(vimState.editor, vimState);
      }
    } catch (e) {
      if (e instanceof VimError) {
        if (e.code === ErrorCode.E492 && configuration.enableNeovim) {
          await vimState.nvim.run(vimState, command);
        } else {
          StatusBar.SetText(
            `${e.toString()}. ${command}`,
            vimState.currentMode,
            vimState.isRecordingMacro,
            true
          );
        }
      } else {
        util.showError(e.toString());
      }
    }
  }

  private static getInputBoxOptions(text: string): vscode.InputBoxOptions {
    return {
      prompt: 'Vim command line',
      value: configuration.cmdLineInitialColon ? ':' + text : text,
      ignoreFocusOut: false,
      valueSelection: [
        configuration.cmdLineInitialColon ? text.length + 1 : text.length,
        configuration.cmdLineInitialColon ? text.length + 1 : text.length,
      ],
    };
  }
}
