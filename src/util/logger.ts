import * as vscode from 'vscode';
import { configuration } from '../configuration/configuration';

export interface ILogger {
  error(errorMessage: string): void;
  debug(debugMessage: string): void;
  warn(warnMessage: string): void;
  verbose(verboseMessage: string): void;
}

/**
 * Displays VSCode message to user
 */
export class VsCodeMessage implements ILogger {

  actionMessages = ['Dismiss', 'Suppress Errors'];

  constructor(
    private prefix: string
  ) {

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
  }
}

export class Logger {
  static mapping: Map<string, ILogger> = new Map<string, ILogger>();
  static get(prefix: string): ILogger {
    if (Logger.mapping.has(prefix)) {
      return Logger.mapping.get(prefix)!;
    }

    const logger = new VsCodeMessage(prefix);
    Logger.mapping.set(prefix, logger);
    return logger;
  }
}
