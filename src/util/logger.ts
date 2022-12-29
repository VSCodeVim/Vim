import { LogOutputChannel, window } from 'vscode';

export class Logger {
  private static output: LogOutputChannel | undefined;
  private static readonly cache = new Map<string, Logger>();

  static get(prefix: string): Logger {
    if (!this.output) {
      this.output = window.createOutputChannel('Vim', { log: true });
    }

    let logger = Logger.cache.get(prefix);
    if (logger === undefined) {
      logger = new Logger(prefix);
      Logger.cache.set(prefix, logger);
    }

    return logger;
  }

  private scope: string;

  private constructor(scope: string) {
    this.scope = scope;
  }

  error(msg: string): void {
    Logger.output?.error(`[${this.scope}] ${msg}`);
  }
  warn(msg: string): void {
    Logger.output?.warn(`[${this.scope}] ${msg}`);
  }
  info(msg: string): void {
    Logger.output?.info(`[${this.scope}] ${msg}`);
  }
  debug(msg: string): void {
    Logger.output?.debug(`[${this.scope}] ${msg}`);
  }
  trace(msg: string): void {
    Logger.output?.trace(`[${this.scope}] ${msg}`);
  }
}
