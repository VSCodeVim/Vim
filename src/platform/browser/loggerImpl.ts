import { IConfiguration } from '../../configuration/iconfiguration';
import { ILogger } from 'src/platform/common/logger';

/**
 * Displays VSCode message to user
 */
export class VsCodeMessage implements ILogger {
  actionMessages = ['Dismiss', 'Suppress Errors'];
  private prefix: string;
  configuration?: IConfiguration;

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
    if (this.configuration && this.configuration.debug.silent) {
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
        throw Error(`Unsupported log level ${info.level}`);
    }

    showMessage(`${this.prefix}: ${info.message}`, ...this.actionMessages);
  }

  public configChanged(configuration: IConfiguration): void {
    this.configuration = configuration;
  }
}

export class LoggerImpl {
  static get(prefix: string): ILogger {
    return new VsCodeMessage(prefix);
  }
}
