import * as vscode from 'vscode';

enum LoggingLevel {
  Error = 0,
  Warn = 1,
  Debug = 2,
}

class LoggerImpl implements vscode.Disposable {
  private _channel: vscode.OutputChannel;

  constructor() {
    this._channel = vscode.window.createOutputChannel('vscodevim');
  }

  public debug(message?: string): void {
    this.emitMessage(LoggingLevel.Debug, message);
  }

  public error(message?: string, friendlyMessage?: string): void {
    this.emitMessage(LoggingLevel.Error, message);
    vscode.window.showErrorMessage(`Error: ${friendlyMessage} || ${message}`);
  }

  private emitMessage(loggingLevel: LoggingLevel, message?: string) {
    if (message === undefined) {
      return;
    }

    message = `${LoggerImpl.getNow()} - ${message}`;

    this._channel.appendLine(message);

    switch (loggingLevel) {
      case LoggingLevel.Error:
        console.error(message);
        break;
      case LoggingLevel.Warn:
        console.warn(message);
        break;
      case LoggingLevel.Debug:
        console.log(message);
        break;
    }
  }

  private static getNow(): string {
    const now = new Date();
    let time = [String(now.getHours()), String(now.getMinutes()), String(now.getSeconds())];
    for (let i = 0; i < time.length; i++) {
      if (Number(time[i]) < 10) {
        time[i] = '0' + time[i];
      }
    }

    return time.join(':');
  }

  dispose() {
    this._channel.dispose();
  }
}

export let Logger = new LoggerImpl();
