import * as fs from 'fs';
import { IConfiguration } from '../iconfiguration';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { vimrc } from '../vimrc';

export class VimrcValidator implements IConfigurationValidator {
  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    // if (config.vimrc.enable && !fs.existsSync(vimrc.vimrcPath)) {
    //   result.append({
    //     level: 'error',
    //     message: `.vimrc not found at ${config.vimrc.path}`,
    //   });
    // }

    return result;
  }

  disable(config: IConfiguration): void {
    // no-op
  }
}
