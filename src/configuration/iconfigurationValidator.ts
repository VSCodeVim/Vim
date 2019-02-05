import { IConfiguration } from './iconfiguration';

interface IValidatorResult {
  level: 'error' | 'warning';
  message: string;
}

export class ValidatorResults {
  errors = new Array<IValidatorResult>();

  public append(validationResult: IValidatorResult) {
    this.errors.push(validationResult);
  }

  public concat(validationResults: ValidatorResults) {
    this.errors = this.errors.concat(validationResults.get());
  }

  public get(): ReadonlyArray<IValidatorResult> {
    return this.errors;
  }

  public numErrors(): number {
    return this.errors.filter(e => e.level === 'error').length;
  }

  public hasError(): boolean {
    return this.numErrors() > 0;
  }
}

export interface IConfigurationValidator {
  validate(config: IConfiguration): Promise<ValidatorResults>;
  disable(config: IConfiguration);
}
