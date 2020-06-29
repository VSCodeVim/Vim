import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { IConfiguration } from '../iconfiguration';
import { existsAsync } from '../../util/fs';
import { Globals } from '../../globals';
import { configurationValidator } from '../configurationValidator';

export class InputMethodSwitcherConfigurationValidator implements IConfigurationValidator {
  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    const inputMethodConfig = config.autoSwitchInputMethod;

    if (!inputMethodConfig.enable || Globals.isTesting) {
      return Promise.resolve(result);
    }

    if (!inputMethodConfig.switchIMCmd.includes('{im}')) {
      result.append({
        level: 'error',
        message:
          'vim.autoSwitchInputMethod.switchIMCmd is incorrect, it should contain the placeholder {im}.',
      });
    }

    if (inputMethodConfig.obtainIMCmd === undefined || inputMethodConfig.obtainIMCmd === '') {
      result.append({
        level: 'error',
        message: 'vim.autoSwitchInputMethod.obtainIMCmd is empty.',
      });
    } else if (!(await existsAsync(this.getRawCmd(inputMethodConfig.obtainIMCmd)))) {
      result.append({
        level: 'error',
        message: `Unable to find ${inputMethodConfig.obtainIMCmd}. Check your 'vim.autoSwitchInputMethod.obtainIMCmd' in VSCode setting.`,
      });
    }

    if (inputMethodConfig.defaultIM === undefined || inputMethodConfig.defaultIM === '') {
      result.append({
        level: 'error',
        message: 'vim.autoSwitchInputMethod.defaultIM is empty.',
      });
    } else if (!(await existsAsync(this.getRawCmd(inputMethodConfig.switchIMCmd)))) {
      result.append({
        level: 'error',
        message: `Unable to find ${inputMethodConfig.switchIMCmd}. Check your 'vim.autoSwitchInputMethod.switchIMCmd' in VSCode setting.`,
      });
    }

    return Promise.resolve(result);
  }

  disable(config: IConfiguration) {
    config.autoSwitchInputMethod.enable = false;
  }

  private getRawCmd(cmd: string): string {
    return cmd.split(' ')[0];
  }
}

configurationValidator.registerValidator(new InputMethodSwitcherConfigurationValidator());
