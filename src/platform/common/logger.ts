import { IConfiguration } from 'src/configuration/iconfiguration';

export interface ILogger {
  error(errorMessage: string): void;
  debug(debugMessage: string): void;
  warn(warnMessage: string): void;
  verbose(verboseMessage: string): void;
  configChanged(configuration: IConfiguration): void;
}
