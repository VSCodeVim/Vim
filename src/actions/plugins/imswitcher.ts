import { ModeName } from '../../mode/mode';
import { exists } from 'fs';
import { promisify } from 'util';
import { configuration } from '../../configuration/configuration';
import * as util from '../../util/util';
import { logger } from '../../util/logger';
import { Message } from '../../util/message';
import { Globals } from '../../globals';

// InputMethodSwitcher change input method automatically when mode changed
export class InputMethodSwitcher {
  constructor(execute: (cmd: string) => Promise<string> = util.executeShell) {
    this.execute = execute;
  }

  private savedIMKey = '';
  private execute: (cmd: string) => Promise<string>;

  public async switchInputMethod(prevMode: ModeName, newMode: ModeName) {
    if (configuration.autoSwitchInputMethod.enable !== true) {
      return;
    }
    if (!this.isConfigurationValid()) {
      this.disableIMSwitch();
      return;
    }
    // when you exit from insert-like mode, save origin input method and set it to default
    let isPrevModeInsertLike = this.isInsertLikeMode(prevMode);
    let isNewModeInsertLike = this.isInsertLikeMode(newMode);
    if (isPrevModeInsertLike !== isNewModeInsertLike) {
      if (isNewModeInsertLike) {
        await this.resumeIM();
      } else {
        await this.switchToDefaultIM();
      }
    }
  }

  // save origin input method and set input method to default
  private async switchToDefaultIM() {
    const obtainIMCmd = configuration.autoSwitchInputMethod.obtainIMCmd;
    const rawObtainIMCmd = this.getRawCmd(obtainIMCmd);
    if ((await promisify(exists)(rawObtainIMCmd)) || Globals.isTesting) {
      try {
        const insertIMKey = await this.execute(obtainIMCmd);
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
      await this.switchToIM(defaultIMKey);
    }
  }

  // resume origin inputmethod
  private async resumeIM() {
    if (this.savedIMKey !== configuration.autoSwitchInputMethod.defaultIM) {
      await this.switchToIM(this.savedIMKey);
    }
  }

  private async switchToIM(imKey: string) {
    let switchIMCmd = configuration.autoSwitchInputMethod.switchIMCmd;
    const rawSwitchIMCmd = this.getRawCmd(switchIMCmd);
    if ((await promisify(exists)(rawSwitchIMCmd)) || Globals.isTesting) {
      if (imKey !== '' && imKey !== undefined) {
        switchIMCmd = switchIMCmd.replace('{im}', imKey);
        try {
          await this.execute(switchIMCmd);
        } catch (e) {
          logger.error(`IMSwitcher: promise is rejected. err=${e}`);
        }
      }
    } else {
      this.showCmdNotFoundErrorMessage(rawSwitchIMCmd, 'vim.autoSwitchInputMethod.switchIMCmd');
    }
  }

  private isInsertLikeMode(mode: ModeName): boolean {
    const insertLikeModes = new Set([
      ModeName.Insert,
      ModeName.Replace,
      ModeName.SurroundInputMode,
    ]);
    return insertLikeModes.has(mode);
  }

  private getRawCmd(cmd: string): string {
    return cmd.split(' ')[0];
  }

  private showCmdNotFoundErrorMessage(cmd: string, config: string) {
    Message.ShowError(`Unable to find ${cmd}. check your ${config} in VSCode setting.`);
    this.disableIMSwitch();
  }

  private disableIMSwitch() {
    configuration.autoSwitchInputMethod.enable = false;
  }

  private isConfigurationValid(): boolean {
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
