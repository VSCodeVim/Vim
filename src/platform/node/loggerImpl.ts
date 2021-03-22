import * as TransportStream from 'winston-transport';
import * as vscode from 'vscode';
import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';
import { IConfiguration } from '../../configuration/iconfiguration';
import { ILogger } from '../common/logger';

interface VsCodeMessageOptions extends TransportStream.TransportStreamOptions {
  prefix?: string;
}

/**
 * Implementation of Winston transport
 * Displays VSCode message to user
 */
class VsCodeMessage extends TransportStream {
  prefix?: string;
  configuration?: IConfiguration;
  actionMessages = ['Dismiss', 'Suppress Errors'];

  constructor(options: VsCodeMessageOptions) {
    super(options);

    this.prefix = options.prefix;
  }

  public async log(info: { level: string; message: string }, callback: () => void) {
    if (this.configuration && this.configuration.debug.silent) {
      return;
    }
    let showMessage: (message: string, ...items: string[]) => Thenable<string | undefined>;
    switch (info.level) {
      case 'error':
        showMessage = vscode.window.showErrorMessage;
        break;
      case 'warn':
        showMessage = vscode.window.showWarningMessage;
        break;
      case 'info':
      case 'verbose':
      case 'debug':
        showMessage = vscode.window.showInformationMessage;
        break;
      default:
        throw Error(`Unsupported log level ${info.level}`);
    }

    const message = `${this.prefix}: ${info.message}`;
    const selectedAction = await showMessage(message, ...this.actionMessages);
    if (selectedAction === 'Suppress Errors' && this.configuration) {
      vscode.window.showInformationMessage(
        'Ignorance is bliss; temporarily suppressing log messages. For more permanence, please configure `vim.debug.silent`.'
      );
      this.configuration.debug.silent = true;
    }

    if (callback) {
      callback();
    }
  }
}

class NodeLogger implements ILogger {
  private logger: winston.Logger;

  constructor(prefix: string) {
    this.logger = winston.createLogger({
      format: winston.format.simple(),
      level: 'debug', // filtering will be done at the transport level
      transports: [
        new ConsoleForElectron({
          level: 'error',
          silent: false,
          prefix,
        }),
        new VsCodeMessage({
          level: 'error',
          prefix,
        }),
      ],
    });
  }

  public error(errorMessage: string): void {
    this.logger.error(errorMessage);
  }

  public debug(debugMessage: string): void {
    this.logger.debug(debugMessage);
  }

  public warn(warnMessage: string): void {
    this.logger.warn(warnMessage);
  }

  public verbose(verboseMessage: string): void {
    this.logger.verbose(verboseMessage);
  }

  public configChanged(configuration: IConfiguration) {
    this.logger.transports[0].level = configuration.debug.loggingLevelForConsole;
    this.logger.transports[0].silent = configuration.debug.silent;
    this.logger.transports[1].level = configuration.debug.loggingLevelForAlert;
    (this.logger.transports[1] as VsCodeMessage).configuration = configuration;
  }
}

export class LoggerImpl {
  static get(prefix: string): ILogger {
    return new NodeLogger(prefix);
  }
}
