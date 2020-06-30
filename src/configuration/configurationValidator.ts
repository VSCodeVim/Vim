import { IConfiguration } from './iconfiguration';
import { IConfigurationValidator, ValidatorResults } from './iconfigurationValidator';

class ConfigurationValidator {
  private _validators: IConfigurationValidator[];

  constructor() {
    this._validators = [];
  }

  public registerValidator(validator: IConfigurationValidator) {
    this._validators.push(validator);
  }

  public async validate(config: IConfiguration): Promise<ValidatorResults> {
    const results = new ValidatorResults();

    for (const validator of this._validators) {
      let validatorResults = await validator.validate(config);
      if (validatorResults.hasError) {
        // errors found in configuration, disable feature
        validator.disable(config);
      }

      results.concat(validatorResults);
    }

    return results;
  }
}

export const configurationValidator = new ConfigurationValidator();
