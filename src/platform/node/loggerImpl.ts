import * as TransportStream from 'winston-transport';
import * as vscode from 'vscode';
import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';
import { configuration } from '../../configuration/configuration';

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

    let message = info.message;
    if (this.prefix) {
      message = this.prefix + ': ' + message;
    }

    let selectedAction = await showMessage(message, ...this.actionMessages);
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

export class LoggerImpl {
  static get(prefix?: string): winston.Logger {
    return winston.createLogger({
      format: winston.format.simple(),
      transports: [
        // TODO: update these when configuration changes
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
}
