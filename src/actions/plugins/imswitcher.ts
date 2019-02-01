import * as util from '../../util/util';
import { Globals } from '../../globals';
import { ModeName } from '../../mode/mode';
import { configuration } from '../../configuration/configuration';
import { exists } from 'fs';
import { Logger } from '../../util/logger';
import { promisify } from 'util';

/**
 * InputMethodSwitcher changes input method when mode changed
 */
export class InputMethodSwitcher {
  constructor(execute: (cmd: string) => Promise<string> = util.executeShell) {
    this.execute = execute;
  }

  private execute: (cmd: string) => Promise<string>;
  private readonly logger = Logger.get('IMSwitcher');
  private savedIMKey = '';

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
        this.logger.error(`Error switching to default IM. err=${e}`);
      }
    } else {
      this.logger.error(
        `Unable to find ${rawObtainIMCmd}. Check your 'vim.autoSwitchInputMethod.obtainIMCmd' in VSCode setting.`
      );
      this.disableIMSwitch();
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
          this.logger.error(`Error switching to IM. err=${e}`);
        }
      }
    } else {
      this.logger.error(
        `Unable to find ${rawSwitchIMCmd}. Check your 'vim.autoSwitchInputMethod.switchIMCmd' in VSCode setting.`
      );
      this.disableIMSwitch();
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

  private disableIMSwitch() {
    this.logger.warn('disabling IMSwitch');
    configuration.autoSwitchInputMethod.enable = false;
  }

  private isConfigurationValid(): boolean {
    let switchIMCmd = configuration.autoSwitchInputMethod.switchIMCmd;
    if (!switchIMCmd.includes('{im}')) {
      this.logger.error(
        'vim.autoSwitchInputMethod.switchIMCmd is incorrect, \
        it should contain the placeholder {im}'
      );
      return false;
    }
    let obtainIMCmd = configuration.autoSwitchInputMethod.obtainIMCmd;
    if (obtainIMCmd === undefined || obtainIMCmd === '') {
      this.logger.error('vim.autoSwitchInputMethod.obtainIMCmd is empty');
      return false;
    }
    let defaultIMKey = configuration.autoSwitchInputMethod.defaultIM;
    if (defaultIMKey === undefined || defaultIMKey === '') {
      this.logger.error('vim.autoSwitchInputMethod.defaultIM is empty');
      return false;
    }
    return true;
  }
}
