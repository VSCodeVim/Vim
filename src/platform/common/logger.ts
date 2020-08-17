export interface ILogger {
  error(errorMessage: string): void;
  debug(debugMessage: string): void;
  warn(warnMessage: string): void;
  verbose(verboseMessage: string): void;
}
