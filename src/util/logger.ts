import { ILogger } from 'src/platform/common/logger';
import { LoggerImpl } from 'platform/loggerImpl';

export class Logger {
  static get(prefix?: string): ILogger {
    return LoggerImpl.get(prefix);
  }
}
