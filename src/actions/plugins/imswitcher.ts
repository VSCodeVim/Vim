import { ModeName } from '../../mode/mode';
import { existsSync } from 'fs';
import { configuration } from '../../configuration/configuration';
import * as util from '../../util/util';
import { logger } from '../../util/logger';
import { Message } from '../../util/message';

// InputMethodSwitcher change input method automatically when mode changed
export class InputMethodSwitcher {
  private savedIMKey = '';

  public async switchInputMethod(prevMode: ModeName, newMode: ModeName) {
    if (configuration.autoSwitchInputMethod.enable !== true) {
      return;
    }
    if (!this.validateConfiguration()) {
      this.disableIMSwitch();
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
    if (existsSync(rawObtainIMCmd)) {
      try {
        const insertIMKey = await util.executeShell(obtainIMCmd);
        if (insertIMKey !== undefined) {
          this.savedIMKey = insertIMKey.trim();
        }
      } catch (e) {
        logger.error(`IMSwitcher: promise is rejected. err=${e}`);
      }
    } else {
      this.showCmdNotFoundErrorMessage(rawObtainIMCmd, 'vim.autoSwitchInputMethod.obtainIMCmd');
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
    const rawSwitchIMCmd = this.getRawCmd(switchIMCmd);
    if (existsSync(rawSwitchIMCmd)) {
      if (imKey !== '' && imKey !== undefined) {
        switchIMCmd = switchIMCmd.replace('{im}', imKey);
        try {
          await util.executeShell(switchIMCmd);
        } catch (e) {
          logger.error(`IMSwitcher: promise is rejected. err=${e}`);
        }
      }
    } else {
      this.showCmdNotFoundErrorMessage(rawSwitchIMCmd, 'vim.autoSwitchInputMethod.switchIMCmd');
    }
  }

  private getRawCmd(cmd: string): string {
    return cmd.split(' ')[0];
  }

  private showCmdNotFoundErrorMessage(cmd: string, config: string) {
    Message.ShowError('Unable to find ' + cmd + '. check your ' + config + ' in VSCode setting.');
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

  private validateConfiguration(): boolean {
    let switchIMCmd = configuration.autoSwitchInputMethod.switchIMCmd;
    if (!switchIMCmd.includes('{im}')) {
      Message.ShowError(
        'vim.autoSwitchInputMethod.switchIMCmd is incorrect, \
        it should contain the placeholder {im}'
      );
      return false;
    }
    let obtainIMCmd = configuration.autoSwitchInputMethod.obtainIMCmd;
    if (obtainIMCmd === undefined || obtainIMCmd === '') {
      Message.ShowError('vim.autoSwitchInputMethod.obtainIMCmd is empty, please set it correctly!');
      return false;
    }
    let defaultIMKey = configuration.autoSwitchInputMethod.defaultIM;
    if (defaultIMKey === undefined || defaultIMKey === '') {
      Message.ShowError('vim.autoSwitchInputMethod.defaultIM is empty, please set it correctly!');
      return false;
    }
    return true;
  }
}
