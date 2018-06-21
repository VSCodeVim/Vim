import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { logger } from '../util/logger';
import { Message } from '../util/message';
import { getExtensionDirPath } from '../util/util';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import * as parser from './parser';
import { VimError, ErrorCode } from '../error';
import { CommandLineHistory } from './commandLineHistory';

class CommandLine {
  private _history: CommandLineHistory;

  constructor() {
    this._history = new CommandLineHistory(getExtensionDirPath());
  }

  public async Run(command: string, vimState: VimState): Promise<void> {
    if (!command || command.length === 0) {
      return;
    }

    if (command && command[0] === ':') {
      command = command.slice(1);
    }

    this._history.add(command);

    try {
      const cmd = parser.parse(command);
      const useNeovim = configuration.enableNeovim && cmd.command && cmd.command.neovimCapable;

      if (useNeovim) {
        await vimState.nvim.run(vimState, command);
      } else {
        await cmd.execute(vimState.editor, vimState);
      }
    } catch (e) {
      logger.error(`commandLine : error executing cmd=${command}. err=${e}.`);
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
        Message.ShowError(e.toString());
      }
    }
  }

  public async ShowHistory(initialText: string, vimState: VimState): Promise<string | undefined> {
    if (!vscode.window.activeTextEditor) {
      logger.debug('commandLine : No active document.');
      return '';
    }

    this._history.add(initialText);

    let cmd = await vscode.window.showQuickPick(this._history.get(), {
      placeHolder: 'Vim command history',
      ignoreFocusOut: false,
    });

    return cmd;
  }
}

export const commandLine = new CommandLine();
