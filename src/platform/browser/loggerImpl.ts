import { configuration } from '../../configuration/configuration';
import { ILogger } from 'src/platform/common/logger';

/**
 * Displays VSCode message to user
 */
export class VsCodeMessage implements ILogger {
  actionMessages = ['Dismiss', 'Suppress Errors'];
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  error(errorMessage: string): void {
    this.log({ level: 'error', message: errorMessage });
  }

  debug(debugMessage: string): void {
    this.log({ level: 'debug', message: debugMessage });
  }

  warn(warnMessage: string): void {
    this.log({ level: 'warn', message: warnMessage });
  }

  verbose(verboseMessage: string): void {
    this.log({ level: 'verbose', message: verboseMessage });
  }

  private async log(info: { level: string; message: string }) {
    if (configuration.debug.silent) {
      return;
    }
    let showMessage: (message: string, ...items: string[]) => void;
    switch (info.level) {
      case 'error':
        showMessage = console.error;
        break;
      case 'warn':
        showMessage = console.warn;
        break;
      case 'info':
      case 'verbose':
      case 'debug':
        showMessage = console.log;
        break;
      default:
        throw 'Unsupported ' + info.level;
    }

    showMessage(`${this.prefix}: ${info.message}`, ...this.actionMessages);
  }

  public configChanged(): void {
    // Nothing to change
  }
}

export class LoggerImpl {
  static get(prefix: string): ILogger {
    return new VsCodeMessage(prefix);
  }
}
