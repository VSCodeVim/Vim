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

  public get(): readonly IValidatorResult[] {
    return this.errors;
  }

  public get numErrors(): number {
    return this.errors.filter((e) => e.level === 'error').length;
  }

  public get hasError(): boolean {
    return this.numErrors > 0;
  }

  public get numWarnings(): number {
    return this.errors.filter((e) => e.level === 'warning').length;
  }

  public get hasWarning(): boolean {
    return this.numWarnings > 0;
  }
}

export interface IConfigurationValidator {
  validate(config: IConfiguration): Promise<ValidatorResults>;
  disable(config: IConfiguration): void;
}
