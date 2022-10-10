import { Logger } from '../../util/logger';
import { Mode } from '../../mode/mode';
import { configuration } from '../../configuration/configuration';
import { executePowerShell, InputMethod } from '../../inputmethod/inputmethod';
import { extensions } from 'vscode';

/**
 *
 * ImTurnOffCM: turn off conversion mode on input method, before transitting NORMAL mode.
 */
export class ImTurnOffCM extends InputMethod {
  private static readonly logger = Logger.get('IMTurnOffCM');
  private cmd:string = "";

  constructor(execute: (cmd: string) => Promise<string> = executePowerShell) {
    // the values of following two lines should be the same as the one in package.json
    const publisher = "vscodevim";
    const extname = "vim";
    let cmd:string|undefined = "";

    super(execute);
    cmd = extensions.getExtension(publisher + "." + extname)?.extensionPath;
    if (cmd !== undefined) {
      cmd += "\\bin\\imTurnOffCM.ps1";
      this.cmd = cmd;
    }
  }

  public async turnOffConversionMode(prevMode: Mode, newMode: Mode) {
    if (configuration.imTurnOffConversionMode.enable !== true) {
      return;
    }

    if (this.cmd.length === 0) {
      return;
    }

    // when you exit from insert-like mode, turn off IME conversion mode.
    const isPrevModeInsertLike = InputMethod.isInsertLikeMode(prevMode);
    const isNewModeInsertLike = InputMethod.isInsertLikeMode(newMode);
    if (isPrevModeInsertLike !== isNewModeInsertLike) {
      if (isPrevModeInsertLike) {
        await this.execute(this.cmd);
      }
    }
  }
}