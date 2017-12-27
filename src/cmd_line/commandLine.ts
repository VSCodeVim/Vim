import * as vscode from 'vscode';

import { Configuration } from '../configuration/configuration';
import { Neovim } from '../neovim/nvimUtil';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import * as parser from './parser';
import * as util from '../util';

export class CommandLine {
  public static async PromptAndRun(initialText: string, vimState: VimState): Promise<void> {
    if (!vscode.window.activeTextEditor) {
      console.log('CommandLine: No active document.');
      return;
    }

    try {
      let cmdString =
        (await vscode.window.showInputBox(this.getInputBoxOptions(initialText))) || '';
      if (cmdString && cmdString[0] === ':' && Configuration.cmdLineInitialColon) {
        cmdString = cmdString.slice(1);
      }

      await CommandLine.Run(cmdString, vimState);
    } catch (e) {
      StatusBar.SetText(e.toString(), vimState.currentMode, true);
    }
  }

  public static async Run(command: string, vimState: VimState): Promise<void> {
    if (!command || command.length === 0) {
      return;
    }

    try {
      const cmd = parser.parse(command);
      const useNeovim = Configuration.enableNeovim && cmd.command && cmd.command.neovimCapable;

      if (useNeovim) {
        await Neovim.command(vimState, command);
      } else {
        await cmd.execute(vimState.editor, vimState);
      }
    } catch (e) {
      console.error(e);
      await util.showError(`${e.message}`);
    }
  }

  private static getInputBoxOptions(text: string): vscode.InputBoxOptions {
    return {
      prompt: 'Vim command line',
      value: Configuration.cmdLineInitialColon ? ':' + text : text,
      ignoreFocusOut: false,
      valueSelection: [
        Configuration.cmdLineInitialColon ? text.length + 1 : text.length,
        Configuration.cmdLineInitialColon ? text.length + 1 : text.length,
      ],
    };
  }
}
