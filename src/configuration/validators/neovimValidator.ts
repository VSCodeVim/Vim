import { IConfiguration } from '../iconfiguration';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { promisify } from 'util';
import { execFile } from 'child_process';

export class NeovimValidator implements IConfigurationValidator {
  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    if (config.enableNeovim) {
      try {
        await promisify(execFile)(config.neovimPath, ['--version']);
      } catch (e) {
        result.append({
          level: 'error',
          message: `Invalid neovimPath. ${e.message}.`,
        });
      }
    }

    return Promise.resolve(result);
  }

  disable(config: IConfiguration) {
    config.enableNeovim = false;
  }
}
