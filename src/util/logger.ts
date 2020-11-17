import { ILogger } from 'src/platform/common/logger';
import { LoggerImpl } from 'platform/loggerImpl';

export class Logger {
  private static readonly cache = new Map<string, ILogger>();

  static get(prefix: string): ILogger {
    let logger = Logger.cache.get(prefix);
    if (logger === undefined) {
      logger = LoggerImpl.get(prefix);
      Logger.cache.set(prefix, logger);
    }

    return logger;
  }

  static configChanged() {
    for (const logger of this.cache.values()) {
      logger.configChanged();
    }
  }
}
