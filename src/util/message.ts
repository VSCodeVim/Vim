import * as vscode from 'vscode';

export class Message {
  public static async ShowInfo(message: string): Promise<{}> {
    return vscode.window.showInformationMessage(message) as {};
  }

  public static async ShowError(message: string): Promise<{}> {
    return vscode.window.showErrorMessage(message) as {};
  }
}
