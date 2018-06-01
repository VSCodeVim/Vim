import { exec } from 'child_process';
import { ModeName, Mode } from '../../mode/mode';
import { existsSync, exists } from 'fs';
import { configuration } from '../../configuration/configuration';
import * as vscode from 'vscode';

// InputMethodSwitcher change input method automatically when mode changed
export class InputMethodSwitcher {
  public savedIMKey = '';

  public async switchInputMethod(prevMode: ModeName, newMode: ModeName) {
    const enableAutoSwitch = configuration.autoSwitchIM.enable;
    if (enableAutoSwitch !== true) {
      return;
    }
    // when you exit from insert-like mode, save origin input method and set it to default
    if (
      prevMode === ModeName.Insert ||
      prevMode === ModeName.SurroundInputMode ||
      prevMode === ModeName.Replace
    ) {
      if (
        newMode !== ModeName.Insert &&
        newMode !== ModeName.SurroundInputMode &&
        newMode !== ModeName.Replace
      ) {
        this.switchToDefaultIM();
        return;
      }
    }
    // when you enter insert-like mode, resume origin input method
    if (
      newMode === ModeName.Insert ||
      newMode === ModeName.SurroundInputMode ||
      newMode === ModeName.Replace
    ) {
      if (
        prevMode !== ModeName.Insert &&
        prevMode !== ModeName.SurroundInputMode &&
        prevMode !== ModeName.Replace
      ) {
        this.resumeIM();
      }
    }
  }

  // save origin input method and set input method to default
  public async switchToDefaultIM() {
    const obtainIMCmd = configuration.autoSwitchIM.obtainIMCmd;
    const rawObtainIMCmd = this.getRawCmd(obtainIMCmd);
    if (obtainIMCmd !== '') {
      if (existsSync(rawObtainIMCmd)) {
        const insertIMKey = await this.execShell(obtainIMCmd);
        if (insertIMKey !== undefined) {
          this.savedIMKey = insertIMKey.trim();
        }
      } else {
        this.showCmdNotFoundErrorMessage(rawObtainIMCmd);
      }
    }

    const defaultIMKey = configuration.autoSwitchIM.defaultIM;
    if (defaultIMKey !== this.savedIMKey) {
      this.switchToIM(defaultIMKey);
    }
  }

  // resume origin inputmethod
  public async resumeIM() {
    const defaultIMKey = configuration.autoSwitchIM.defaultIM;
    if (this.savedIMKey !== defaultIMKey) {
      this.switchToIM(this.savedIMKey);
    }
  }

  private async switchToIM(imKey: string) {
    let switchIMCmd = configuration.autoSwitchIM.switchIMCmd;
    if (!switchIMCmd.includes('{im}')) {
      this.showWrongSwitchIMCmdErrorMessage();
      return;
    }
    const rawSwitchIMCmd = this.getRawCmd(switchIMCmd);
    if (switchIMCmd !== '') {
      if (existsSync(rawSwitchIMCmd)) {
        if (imKey !== '' && imKey !== undefined) {
          switchIMCmd = switchIMCmd.replace('{im}', imKey);
          await this.execShell(switchIMCmd);
        }
      } else {
        this.showCmdNotFoundErrorMessage(rawSwitchIMCmd);
      }
    }
  }

  private getRawCmd(cmd: string): string {
    const cmds = cmd.split(' ');
    let rawCmd = '';
    if (cmds.length > 0) {
      rawCmd = cmds[0];
    }
    return rawCmd;
  }

  private showCmdNotFoundErrorMessage(cmd: string) {
    vscode.window.showErrorMessage(
      'Unable to find ' +
        cmd +
        '. check your "vim.autoSwitchIMCommand" in VSCode setting. \
      Or you can disable "vim.autoSwitchIM" to dismiss this error message'
    );
  }

  private showWrongSwitchIMCmdErrorMessage() {
    vscode.window.showErrorMessage(
      'switchIMCmd config in vim.autoSwitchIM is incorrect, \
      it should contain the placeholder {im}'
    );
  }

  private execShell(cmd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve(stdout);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
