import * as fs from 'fs';
import { IConfiguration } from '../iconfiguration';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { promisify } from 'util';

export class NeovimValidator implements IConfigurationValidator {
  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    if (config.enableNeovim) {
      try {
        const stat = await promisify(fs.stat)(config.neovimPath);
        if (!stat.isFile()) {
          result.append({
            level: 'error',
            message: `Invalid neovimPath. Please configure full path to nvim binary.`,
          });
        }
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
