import * as util from '../../util/util';
import { Logger } from '../../util/logger';
import { ModeName } from '../../mode/mode';
import { configuration } from '../../configuration/configuration';

/**
 * InputMethodSwitcher changes input method when mode changed
 */
export class InputMethodSwitcher {
  private readonly logger = Logger.get('IMSwitcher');
  private execute: (cmd: string) => Promise<string>;
  private savedIMKey = '';

  constructor(execute: (cmd: string) => Promise<string> = util.executeShell) {
    this.execute = execute;
  }

  public async switchInputMethod(prevMode: ModeName, newMode: ModeName) {
    if (configuration.autoSwitchInputMethod.enable !== true) {
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
    try {
      const insertIMKey = await this.execute(obtainIMCmd);
      if (insertIMKey !== undefined) {
        this.savedIMKey = insertIMKey.trim();
      }
    } catch (e) {
      this.logger.error(`Error switching to default IM. err=${e}`);
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
    if (imKey !== '' && imKey !== undefined) {
      switchIMCmd = switchIMCmd.replace('{im}', imKey);
      try {
        await this.execute(switchIMCmd);
      } catch (e) {
        this.logger.error(`Error switching to IM. err=${e}`);
      }
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
}
