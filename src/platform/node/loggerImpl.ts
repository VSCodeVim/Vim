import * as TransportStream from 'winston-transport';
import * as vscode from 'vscode';
import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';
import { configuration } from '../../configuration/configuration';
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
  actionMessages = ['Dismiss', 'Suppress Errors'];

  constructor(options: VsCodeMessageOptions) {
    super(options);

    this.prefix = options.prefix;
  }

  public async log(info: { level: string; message: string }, callback: Function) {
    if (configuration.debug.silent) {
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
        throw 'Unsupported ' + info.level;
    }

    const message = `${this.prefix}: ${info.message}`;
    const selectedAction = await showMessage(message, ...this.actionMessages);
    if (selectedAction === 'Suppress Errors') {
      vscode.window.showInformationMessage(
        'Ignorance is bliss; temporarily suppressing log messages. For more permanence, please configure `vim.debug.silent`.'
      );
      configuration.debug.silent = true;
    }

    if (callback) {
      callback();
    }
  }
}

class NodeLogger implements ILogger {
  private _logger: winston.Logger;

  constructor(prefix: string) {
    this._logger = winston.createLogger({
      format: winston.format.simple(),
      level: 'debug', // filtering will be done at the transport level
      transports: [
        new ConsoleForElectron({
          level: configuration.debug.loggingLevelForConsole,
          silent: configuration.debug.silent,
          prefix: prefix,
        }),
        new VsCodeMessage({
          level: configuration.debug.loggingLevelForAlert,
          prefix: prefix,
        }),
      ],
    });
  }

  public error(errorMessage: string): void {
    this._logger.error(errorMessage);
  }

  public debug(debugMessage: string): void {
    this._logger.debug(debugMessage);
  }

  public warn(warnMessage: string): void {
    this._logger.warn(warnMessage);
  }

  public verbose(verboseMessage: string): void {
    this._logger.verbose(verboseMessage);
  }

  public configChanged() {
    this._logger.transports[0].level = configuration.debug.loggingLevelForConsole;
    this._logger.transports[0].silent = configuration.debug.silent;
    this._logger.transports[1].level = configuration.debug.loggingLevelForAlert;
  }
}

export class LoggerImpl {
  static get(prefix: string): ILogger {
    return new NodeLogger(prefix);
  }
}
