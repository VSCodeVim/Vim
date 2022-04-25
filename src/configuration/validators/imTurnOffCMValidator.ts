import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { IConfiguration } from '../iconfiguration';
import { existsAsync } from 'platform/fs';
import { Globals } from '../../globals';
import { configurationValidator } from '../configurationValidator';
import { platform } from 'process';

export class ImTurnOffConversionModeConfigurationValidator implements IConfigurationValidator {
  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    const imTurnOffConversionMode = config.imTurnOffConversionMode;

    if (!imTurnOffConversionMode.enable || Globals.isTesting) {
      return Promise.resolve(result);
    }

    if (platform !== "win32") {
      result.append({
        level: 'error',
        message:
          "vim.imTurnOffConversionMode can turn on when platform is 'win32' only",
      });
    }

    return Promise.resolve(result);
  }

  disable(config: IConfiguration) {
    config.imTurnOffConversionMode.enable = false;
  }
}

configurationValidator.registerValidator(new ImTurnOffConversionModeConfigurationValidator());
