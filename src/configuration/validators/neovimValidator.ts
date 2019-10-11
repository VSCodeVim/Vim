import { IConfiguration } from '../iconfiguration';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { promisify } from 'util';
import { execFile } from 'child_process';

export class NeovimValidator implements IConfigurationValidator {
  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    if (config.enableNeovim) {
      let triedToParsePath = false;
      try {
        // Try to find nvim in path if it is not defined
        if (config.neovimPath === '') {
          const pathVar = process.env.PATH;
          if (pathVar) {
            pathVar.split(';').forEach(element => {
              if (element.toLocaleLowerCase().includes('neovim')) {
                const path = require('path');
                config.neovimPath = element + path.sep + 'nvim';
                triedToParsePath = true;
                return;
              }
            });
          }
        }
        await promisify(execFile)(config.neovimPath, ['--version']);
      } catch (e) {
        let errorMessage = `Invalid neovimPath. ${e.message}.`;
        if (triedToParsePath) {
          errorMessage += 'Tried to parse PATH.';
        }
        result.append({
          level: 'error',
          message: errorMessage,
        });
      }
    }

    return Promise.resolve(result);
  }

  disable(config: IConfiguration) {
    config.enableNeovim = false;
  }
}
