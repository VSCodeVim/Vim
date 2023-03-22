import * as util from 'util';
import * as vscode from 'vscode';
import { Logger } from '../util/logger';
import { sorted } from './../common/motion/position';
import { Register, RegisterMode } from '../register/register';
import { TextEditor } from '../textEditor';
import { VimState } from './../state/vimState';
import { configuration } from '../configuration/configuration';
import { dirname } from 'path';
import { exists } from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { attach } from 'neovim/lib/attach';
import { Neovim } from 'neovim/lib/api/Neovim';
import { Position } from 'vscode';
import { TextDocument } from 'vscode';

export class NeovimWrapper implements vscode.Disposable {
  private process?: ChildProcess;
  private nvim?: Neovim;
  private readonly processTimeoutInSeconds = 3;

  async run(
    vimState: VimState,
    command: string
  ): Promise<{ statusBarText: string; error: boolean }> {
    if (!this.nvim) {
      this.nvim = await this.startNeovim(vimState.document);

      try {
        const nvimAttach = this.nvim.uiAttach(80, 20, {
          ext_cmdline: false,
          ext_popupmenu: false,
          ext_tabline: false,
          ext_wildmenu: false,
          rgb: false,
        });

        const timeout = new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Timeout')), this.processTimeoutInSeconds * 1000);
        });

        await Promise.race([nvimAttach, timeout]);
      } catch (e) {
        configuration.enableNeovim = false;
        throw new Error(`Failed to attach to neovim process. ${e.message}`);
      }

      const apiInfo = await this.nvim.apiInfo;
      const version = apiInfo[1].version;
      Logger.debug(`version: ${version.major}.${version.minor}.${version.patch}`);
    }

    await this.syncVSCodeToVim(vimState);
    command = (':' + command + '\n').replace('<', '<lt>');

    // Clear the previous error and status messages.
    // API does not allow setVvar so do it manually
    await this.nvim.command('let v:errmsg="" | let v:statusmsg=""');

    // Execute the command
    Logger.debug(`Running ${command}.`);
    await this.nvim.input(command);
    const mode = await this.nvim.mode;
    if (mode.blocking) {
      await this.nvim.input('<esc>');
    }

    // Check if an error occurred
    const errMsg = await this.nvim.getVvar('errmsg');
    let statusBarText = '';
    let error = false;
    if (errMsg && errMsg.toString() !== '') {
      statusBarText = errMsg.toString();
      error = true;
    } else {
      // Check to see if a status message was updated
      const statusMsg = await this.nvim.getVvar('statusmsg');
      if (statusMsg && statusMsg.toString() !== '') {
        statusBarText = statusMsg.toString();
      }
    }

    // Sync buffer back to VSCode
    await this.syncVimToVSCode(vimState);

    return { statusBarText, error };
  }

  private async startNeovim(document: TextDocument) {
    Logger.debug('Spawning Neovim process...');
    let dir = dirname(document.uri.fsPath);
    if (!(await util.promisify(exists)(dir))) {
      dir = __dirname;
    }
    const neovimArgs: string[] = [];
    // '-u' flag is only added if user wants to use a custom path for
    // their config file OR they want no config file to be loaded at all.
    // '-u' flag is omitted altogether if user wants Neovim to look for a
    // config in its default location.
    if (configuration.neovimUseConfigFile) {
      if (configuration.neovimConfigPath !== '') {
        neovimArgs.push('-u', configuration.neovimConfigPath);
      }
    } else {
      neovimArgs.push('-u', 'NONE');
    }
    neovimArgs.push('-i', 'NONE', '-n', '--embed');
    this.process = spawn(configuration.neovimPath, neovimArgs, {
      cwd: dir,
    });

    this.process.on('error', (err) => {
      Logger.error(`Error spawning neovim. ${err.message}.`);
      configuration.enableNeovim = false;
    });

    return attach({ proc: this.process });
  }

  // Data flows from VSCode to Vim
  private async syncVSCodeToVim(vimState: VimState) {
    if (!this.nvim) {
      return;
    }

    const buf = await this.nvim.buffer;
    if (configuration.expandtab) {
      await vscode.commands.executeCommand('editor.action.indentationToTabs');
    }

    await this.nvim.setOption('gdefault', configuration.gdefault === true);
    await buf.setLines(vimState.document.getText().split('\n'), {
      start: 0,
      end: -1,
      strictIndexing: true,
    });

    const [rangeStart, rangeEnd] = sorted(
      vimState.cursorStartPosition,
      vimState.cursorStopPosition
    );
    await this.nvim.callFunction('setpos', [
      '.',
      [0, vimState.cursorStopPosition.line + 1, vimState.cursorStopPosition.character, false],
    ]);
    await this.nvim.callFunction('setpos', [
      "'<",
      [0, rangeStart.line + 1, rangeEnd.character, false],
    ]);
    await this.nvim.callFunction('setpos', [
      "'>",
      [0, rangeEnd.line + 1, rangeEnd.character, false],
    ]);
    for (const mark of vimState.historyTracker.getLocalMarks()) {
      await this.nvim.callFunction('setpos', [
        `'${mark.name}`,
        [0, mark.position.line + 1, mark.position.character, false],
      ]);
    }

    // We only copy over " register for now, due to our weird handling of macros.
    const reg = await Register.get('"');
    if (reg) {
      const vsRegTovimReg = ['c', 'l', 'b'];
      await this.nvim.callFunction('setreg', [
        '"',
        reg.text as string,
        vsRegTovimReg[vimState.currentRegisterMode],
      ]);
    }
  }

  // Data flows from Vim to VSCode
  private async syncVimToVSCode(vimState: VimState) {
    if (!this.nvim) {
      return;
    }

    const buf = await this.nvim.buffer;
    const lines = await buf.getLines({ start: 0, end: -1, strictIndexing: false });

    // one Windows, lines that went to nvim and back have a '\r' at the end,
    // which causes the issues exhibited in #1914
    const fixedLines =
      process.platform === 'win32' ? lines.map((line, index) => line.replace(/\r$/, '')) : lines;

    const lineCount = vimState.document.lineCount;

    await TextEditor.replace(
      vimState.editor,
      new vscode.Range(0, 0, lineCount - 1, TextEditor.getLineLength(lineCount - 1)),
      fixedLines.join('\n')
    );

    Logger.debug(`${lines.length} lines in nvim. ${lineCount} in editor.`);

    const [row, character] = ((await this.nvim.callFunction('getpos', ['.'])) as number[]).slice(
      1,
      3
    );
    vimState.editor.selection = new vscode.Selection(
      new Position(row - 1, character),
      new Position(row - 1, character)
    );

    if (configuration.expandtab) {
      await vscode.commands.executeCommand('editor.action.indentationToSpaces');
    }
    // We're only syncing back the default register for now, due to the way we could
    // be storing macros in registers.
    const vimRegToVsReg: { [key: string]: RegisterMode } = {
      v: RegisterMode.CharacterWise,
      V: RegisterMode.LineWise,
      '\x16': RegisterMode.BlockWise,
    };
    vimState.currentRegisterMode =
      vimRegToVsReg[(await this.nvim.callFunction('getregtype', ['"'])) as string];
    Register.put(vimState, (await this.nvim.callFunction('getreg', ['"'])) as string);
  }

  dispose() {
    if (this.nvim) {
      this.nvim.quit();
    }

    if (this.process) {
      this.process.kill();
    }
  }
}
