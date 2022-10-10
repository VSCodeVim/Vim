import { Logger } from '../../util/logger';
import { Mode } from '../../mode/mode';
import { configuration } from '../../configuration/configuration';
import { executeShell, InputMethod } from '../../inputmethod/inputmethod';

/**
 * InputMethodSwitcher changes input method when mode changed
 */
export class InputMethodSwitcher extends InputMethod {
  private static readonly logger = Logger.get('IMSwitcher');
  private savedIMKey = '';

  constructor(execute: (cmd: string) => Promise<string> = executeShell) {
    super(execute);
  }

  public async switchInputMethod(prevMode: Mode, newMode: Mode) {
    if (configuration.autoSwitchInputMethod.enable !== true) {
      return;
    }
    // when you exit from insert-like mode, save origin input method and set it to default
    const isPrevModeInsertLike = InputMethod.isInsertLikeMode(prevMode);
    const isNewModeInsertLike = InputMethod.isInsertLikeMode(newMode);
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
      InputMethodSwitcher.logger.error(`Error switching to default IM. err=${e}`);
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
        InputMethodSwitcher.logger.error(`Error switching to IM. err=${e}`);
      }
    }
  }
}
