import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { Neovim } from '../neovim/neovim';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import * as parser from './parser';
import * as util from '../util';
import { VimError, ErrorCode } from '../error';

class CommandLineHistory {
  private _history: string[] = [];
  private _is_loaded: boolean = false;
  private _filePath: string = '';

  public add(command: string | undefined): void {
    if (!command || command.length === 0) {
      return;
    }

    let index: number = this._history.indexOf(command);
    if (index !== -1) {
      this._history.splice(index, 1);
    }
    this._history.unshift(command);

    if (this._history.length > configuration.history) {
      this._history.pop();
    }
  }

  public get(): string[] {
    if (!this._is_loaded) {
      this.load();
      this._is_loaded = true;
    }
    return this._history;
  }

  public setFilePath(filePath: string): void {
    this._filePath = filePath;
  }

  private load(): void {
    const fs = require('fs');

    if (!fs.existsSync(this._filePath)) {
      return;
    }

    try {
      let data = fs.readFileSync(this._filePath, 'utf-8');
      let parsedData = JSON.parse(data);
      if (Array.isArray(parsedData)) {
        this._history = parsedData;
      } else {
        console.log('CommandLine: Failed to load history.');
      }
    } catch (e) {
      console.error(e);
    }
  }

  public save(): void {
    const fs = require('fs');
    fs.writeFileSync(this._filePath, JSON.stringify(this._history), 'utf-8');
  }
}

export class CommandLine {
  private static _history: CommandLineHistory = new CommandLineHistory();

  public static async PromptAndRun(initialText: string, vimState: VimState): Promise<void> {
    if (!vscode.window.activeTextEditor) {
      console.log('CommandLine: No active document.');
      return;
    }

    let cmd = await vscode.window.showInputBox(this.getInputBoxOptions(initialText));
    if (cmd && cmd[0] === ':' && configuration.cmdLineInitialColon) {
      cmd = cmd.slice(1);
    }

    this._history.add(cmd);
    this._history.save();

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

  public static async ShowHistory(
    initialText: string,
    vimState: VimState
  ): Promise<string | undefined> {
    if (!vscode.window.activeTextEditor) {
      console.log('CommandLine: No active document.');
      return '';
    }

    this._history.add(initialText);

    let cmd = await vscode.window.showQuickPick(this._history.get(), {
      placeHolder: 'Vim command history',
      ignoreFocusOut: false,
    });

    return cmd;
  }

  public static SetHistoryDirPath(historyDirPath: string): void {
    const path = require('path');
    const filePath: string = path.join(historyDirPath, '.cmdline_history');
    this._history.setFilePath(filePath);
  }
}
