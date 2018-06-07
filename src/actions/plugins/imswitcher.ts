import { exec } from 'child_process';
import { ModeName, Mode } from '../../mode/mode';
import { existsSync, exists } from 'fs';
import { configuration } from '../../configuration/configuration';
import * as vscode from 'vscode';
import * as util from '../../util';

// InputMethodSwitcher change input method automatically when mode changed
export class InputMethodSwitcher {
  private savedIMKey = '';

  public async switchInputMethod(prevMode: ModeName, newMode: ModeName) {
    if (configuration.autoSwitchInputMethod.enable !== true) {
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
  private async switchToDefaultIM() {
    const obtainIMCmd = configuration.autoSwitchInputMethod.obtainIMCmd;
    const rawObtainIMCmd = this.getRawCmd(obtainIMCmd);
    if (obtainIMCmd !== '') {
      if (existsSync(rawObtainIMCmd)) {
        const insertIMKey = await util.executeShell(obtainIMCmd);
        if (insertIMKey !== undefined) {
          this.savedIMKey = insertIMKey.trim();
        }
      } else {
        this.showCmdNotFoundErrorMessage(rawObtainIMCmd);
      }
    }

    const defaultIMKey = configuration.autoSwitchInputMethod.defaultIM;
    if (defaultIMKey !== this.savedIMKey) {
      this.switchToIM(defaultIMKey);
    }
  }

  // resume origin inputmethod
  private async resumeIM() {
    if (this.savedIMKey !== configuration.autoSwitchInputMethod.defaultIM) {
      this.switchToIM(this.savedIMKey);
    }
  }

  private async switchToIM(imKey: string) {
    let switchIMCmd = configuration.autoSwitchInputMethod.switchIMCmd;
    if (!switchIMCmd.includes('{im}')) {
      util.showError(
        'switchIMCmd config in vim.autoSwitchInputMethod is incorrect, \
        it should contain the placeholder {im}'
      );
      this.disableIMSwitch();
      return;
    }
    const rawSwitchIMCmd = this.getRawCmd(switchIMCmd);
    if (switchIMCmd !== '') {
      if (existsSync(rawSwitchIMCmd)) {
        if (imKey !== '' && imKey !== undefined) {
          switchIMCmd = switchIMCmd.replace('{im}', imKey);
          await util.executeShell(switchIMCmd);
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
    util.showError(
      'Unable to find ' + cmd + '. check your "vim.autoSwitchInputMethod" in VSCode setting.'
    );
    this.disableIMSwitch();
  }

  private disableIMSwitch() {
    const originConfig = configuration.autoSwitchInputMethod;
    configuration.autoSwitchInputMethod = {
      enable: false,
      defaultIM: originConfig.defaultIM,
      switchIMCmd: originConfig.switchIMCmd,
      obtainIMCmd: originConfig.obtainIMCmd,
    };
  }
}
