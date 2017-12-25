import * as vscode from 'vscode';

import { Configuration } from '../configuration/configuration';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import { Neovim } from '../neovim/nvimUtil';
import * as parser from './parser';

// Shows the vim command line.
export async function showCmdLine(initialText: string, vimState: VimState): Promise<undefined> {
  if (!vscode.window.activeTextEditor) {
    console.log('No active document.');
    return;
  }

  const options: vscode.InputBoxOptions = {
    prompt: 'Vim command line',
    value: Configuration.cmdLineInitialColon ? ':' + initialText : initialText,
    ignoreFocusOut: false,
    valueSelection: [
      Configuration.cmdLineInitialColon ? initialText.length + 1 : initialText.length,
      Configuration.cmdLineInitialColon ? initialText.length + 1 : initialText.length,
    ],
  };

  try {
    const cmdString = await vscode.window.showInputBox(options);
    const trimmedCmdString =
      cmdString && Configuration.cmdLineInitialColon && cmdString[0] === ':'
        ? cmdString.slice(1)
        : cmdString;
    await runCmdLine(trimmedCmdString!, vimState);
    return;
  } catch (e) {
    StatusBar.Text = e.toString();
    return;
  }
}

export async function runCmdLine(command: string, vimState: VimState): Promise<undefined> {
  if (!command || command.length === 0) {
    return;
  }

  try {
    var cmd = parser.parse(command);
    if (
      Configuration.enableNeovim &&
      (!cmd.command || (cmd.command && cmd.command.neovimCapable))
    ) {
      await Neovim.command(vimState, command)
        .then(() => {
          console.log('Substituted for neovim command');
        })
        .catch(err => console.log(err));
    } else {
      await cmd.execute(vimState.editor, vimState);
    }
    return;
  } catch (e) {
    if (Configuration.enableNeovim) {
      await Neovim.command(vimState, command)
        .then(() => {
          console.log('SUCCESS');
        })
        .catch(err => console.log(err));
    }
    return;
  }
}
