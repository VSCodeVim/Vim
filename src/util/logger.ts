import * as TransportStream from 'winston-transport';
import * as vscode from 'vscode';
import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';
import { configuration } from '../configuration/configuration';

/**
 * Implementation of Winston transport
 * Displays VS Code informational message to user for error messages
 */
class InformationalMessage extends TransportStream {
  public log(info: { level: string; message: string }, callback: Function) {
    if (configuration.debug.showErrorMessages && info.level === 'error') {
      vscode.window.showErrorMessage(info.message, 'Dismiss');
    }

    if (callback) {
      callback();
    }
  }
}

export const logger = winston.createLogger({
  level: configuration.debug.loggingLevel,
  format: winston.format.simple(),
  transports: [new ConsoleForElectron(), new InformationalMessage()],
});
