import * as TransportStream from 'winston-transport';
import * as vscode from 'vscode';
import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';
import { configuration } from '../configuration/configuration';

/**
 * Implementation of Winston transport
 * Displays VS Code message to user
 */
class VsCodeMessage extends TransportStream {
  actionMessages = ['Dismiss', 'Suppress Errors'];

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

    let selectedAction = await showMessage(info.message, ...this.actionMessages);
    if (selectedAction === 'Suppress Errors') {
      vscode.window.showInformationMessage(
        'Ignorance is bliss; temporarily suppressing log messages. For more permanence, please configure `vim.debug.suppress`.'
      );
      configuration.debug.silent = true;
    }

    if (callback) {
      callback();
    }
  }
}

export const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new ConsoleForElectron({
      level: configuration.debug.loggingLevelForConsole,
      silent: configuration.debug.silent,
    }),
    new VsCodeMessage({
      level: configuration.debug.loggingLevelForAlert,
    }),
  ],
});
