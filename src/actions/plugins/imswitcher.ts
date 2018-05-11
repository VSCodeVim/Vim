import { exec } from 'child_process';
import { ModeName, Mode } from '../../mode/mode';
import { existsSync } from 'fs';
import { configuration } from '../../configuration/configuration';
import * as vscode from 'vscode';

// InputMethodSwitcher change input method automatically when mode changed
export class InputMethodSwitcher {
  public savedIM = '';

  public async switchInputMethod(oldMode: ModeName, newMode: ModeName) {
    const enableAutoSwitch = configuration.autoSwitchInputMethod;
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
        this.disableOriginInputMethod();
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
        this.enableOriginInputMethod();
      }
    }
  }

  // save origin input method and set input method to default
  public async disableOriginInputMethod() {
    if (process.platform === 'darwin') {
      const commandPath = configuration.autoSwitchInputMethodConfig.dependencyPath;
      if (existsSync(commandPath)) {
        const originIM = await this.execShell(commandPath);
        if (originIM !== undefined) {
          this.savedIM = originIM;
        }
        const defaultIMKey = configuration.autoSwitchInputMethodConfig.defaultInputMethodKey;
        await this.execShell(commandPath + ' ' + defaultIMKey);
      } else {
        vscode.window.showErrorMessage(
          'Unable to find im-select,\
        check your "vim.autoSwitchInputMethodConfig" in VSCode setting. \
        Or you can turn off "vim.autoSwitchInputMethod" to dismiss this error message'
        );
      }
    }
  }

  // resume origin inputmethod
  public async enableOriginInputMethod() {
    if (process.platform === 'darwin') {
      const commandPath = configuration.autoSwitchInputMethodConfig.dependencyPath;
      if (existsSync(commandPath)) {
        if (this.savedIM !== undefined && this.savedIM !== '') {
          await this.execShell(commandPath + ' ' + this.savedIM);
        }
      } else {
        vscode.window.showErrorMessage(
          'Unable to find im-select,\
        check your "vim.autoSwitchInputMethodConfig" in VSCode setting. \
        Or you can turn off "vim.autoSwitchInputMethod" to dismiss this error message'
        );
      }
    }
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
