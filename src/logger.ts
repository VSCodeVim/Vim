import * as vscode from 'vscode';

class LoggerImpl implements vscode.Disposable {
  private _channel: vscode.OutputChannel;

  constructor() {
    this._channel = vscode.window.createOutputChannel("vscodevim");
  }

  public debug(message?: string): void {
    this.emitMessage(message);
  }

  public error(message?: string, friendlyMessage?: string): void {
    this.emitMessage(message);
    vscode.window.showErrorMessage(`Error: ${friendlyMessage} || ${message}`);
  }

  private emitMessage(message?: string) {
    if (message === undefined) {
      message = "";
    }

    let now: Date = new Date();
    let time: Array<String> = [ String(now.getHours()), String(now.getMinutes()), String(now.getSeconds())];
    for (let i in time) {
      if ( Number(time[i]) < 10 ) {
        time[i] = "0" + time[i];
      }
    }

    this._channel.appendLine(`${time.join(':')} - ${message}`);
  }

  dispose() {
    this._channel.dispose();
  }
}

export let Logger = new LoggerImpl();
