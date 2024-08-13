import { Logger } from '../../util/logger';
import { Mode } from '../../mode/mode';
import { configuration } from '../../configuration/configuration';
import { exec } from 'child_process';

/**
 * This function executes a shell command and returns the standard output as a string.
 */
function executeShell(cmd: string): Promise<string> {
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
      reject(error as Error);
    }
  });
}

/**
 * InputMethodSwitcher changes input method when mode changed
 */
export class InputMethodSwitcher {
  private execute: (cmd: string) => Promise<string>;
  private savedIMKey = '';

  constructor(execute: (cmd: string) => Promise<string> = executeShell) {
    this.execute = execute;
  }

  public async switchInputMethod(prevMode: Mode, newMode: Mode) {
    if (configuration.autoSwitchInputMethod.enable !== true) {
      return;
    }
    // when you exit from insert-like mode, save origin input method and set it to default
    const isPrevModeInsertLike = this.isInsertLikeMode(prevMode);
    const isNewModeInsertLike = this.isInsertLikeMode(newMode);
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
      Logger.error(`Error switching to default IM. err=${e}`);
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
        Logger.error(`Error switching to IM. err=${e}`);
      }
    }
  }

  private isInsertLikeMode(mode: Mode): boolean {
    return [Mode.Insert, Mode.Replace, Mode.SurroundInputMode].includes(mode);
  }
}
