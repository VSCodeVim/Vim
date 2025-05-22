import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import * as process from 'process';
import { configurationValidator } from '../configurationValidator';
import { IConfiguration } from '../iconfiguration';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';

export class NeovimValidator implements IConfigurationValidator {
  validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    if (config.enableNeovim) {
      let triedToParsePath = false;
      try {
        // Try to find nvim in path if it is not defined
        if (config.neovimPath === '') {
          const pathVar = process.env.PATH;
          if (pathVar) {
            pathVar.split(path.delimiter).forEach((element) => {
              let neovimExecutable = 'nvim';
              if (process.platform === 'win32') {
                neovimExecutable += '.exe';
              }
              const testPath = path.join(element, neovimExecutable);
              if (existsSync(testPath)) {
                config.neovimPath = testPath;
                triedToParsePath = true;
                return;
              }
            });
          }
        }
        execFileSync(config.neovimPath, ['--version']);
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        let errorMessage = `Invalid neovimPath. ${e.message}.`;
        if (triedToParsePath) {
          errorMessage += `Tried to parse PATH ${config.neovimPath}.`;
        }
        result.append({
          level: 'error',
          message: errorMessage,
        });
      }
      // If Neovim config path doesn't exist, default to empty config path.
      if (config.neovimUseConfigFile && config.neovimConfigPath !== '') {
        if (!existsSync(config.neovimConfigPath)) {
          const warningMessage = `No config file found in neovimConfigPath. Neovim will search its default config path.`;
          config.neovimConfigPath = '';
          result.append({
            level: 'warning',
            message: warningMessage,
          });
        }
      }
    }

    return Promise.resolve(result);
  }

  disable(config: IConfiguration) {
    config.enableNeovim = false;
  }
}

configurationValidator.registerValidator(new NeovimValidator());
