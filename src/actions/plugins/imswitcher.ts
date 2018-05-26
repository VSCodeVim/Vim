import { exec } from 'child_process';
import { ModeName, Mode } from '../../mode/mode';
import { existsSync, exists } from 'fs';
import { configuration } from '../../configuration/configuration';
import * as vscode from 'vscode';

// InputMethodSwitcher change input method automatically when mode changed
export class InputMethodSwitcher {
  public savedIMKey = '';

  public async switchInputMethod(oldMode: ModeName, newMode: ModeName) {
    const enableAutoSwitch = configuration.autoSwitchIM.enable;
    if (enableAutoSwitch !== true) {
      return;
    }
    // when you exit from insert-like mode, save origin input method and set it to default
    if (
      oldMode === ModeName.Insert ||
      oldMode === ModeName.SurroundInputMode ||
      oldMode === ModeName.Replace
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
        oldMode !== ModeName.Insert &&
        oldMode !== ModeName.SurroundInputMode &&
        oldMode !== ModeName.Replace
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
        this.showErrorMessage(rawObtainIMCmd);
      }
    }

    const switchIMCmd = configuration.autoSwitchIM.switchIMCmd;
    const defaultIMKey = configuration.autoSwitchIM.defaultIM;
    const rawSwitchIMCmd = this.getRawCmd(switchIMCmd);
    if (switchIMCmd !== '') {
      if (existsSync(rawSwitchIMCmd)) {
        if (this.savedIMKey !== defaultIMKey) {
          await this.execShell(switchIMCmd + ' ' + defaultIMKey);
        }
      } else {
        this.showErrorMessage(rawSwitchIMCmd);
      }
    }
  }

  // resume origin inputmethod
  public async resumeIM() {
    const switchIMCmd = configuration.autoSwitchIM.switchIMCmd;
    const rawSwitchIMCmd = this.getRawCmd(switchIMCmd);
    const defaultIMKey = configuration.autoSwitchIM.defaultIM;
    if (switchIMCmd !== '') {
      if (existsSync(rawSwitchIMCmd)) {
        if (
          this.savedIMKey !== defaultIMKey &&
          this.savedIMKey !== '' &&
          this.savedIMKey !== undefined
        ) {
          await this.execShell(switchIMCmd + ' ' + this.savedIMKey);
        }
      } else {
        this.showErrorMessage(rawSwitchIMCmd);
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

  private showErrorMessage(cmd: string) {
    vscode.window.showErrorMessage(
      'Unable to find ' +
        cmd +
        '. check your "vim.autoSwitchIMCommand" in VSCode setting. \
    Or you can turn off "vim.autoSwitchIM" to dismiss this error message'
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
