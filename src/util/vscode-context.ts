import * as vscode from 'vscode';

export class VsCodeContextImpl {
  contextMap: { [key: string]: any } = {};

  public async Set(key: string, value: any): Promise<void> {
    const prev = this.Get(key);
    if (!prev || prev !== value) {
      this.contextMap[key] = value;
      return vscode.commands.executeCommand('setContext', key, value);
    }
  }

  public Get(key: string): any {
    return this.contextMap[key];
  }
}

export let VsCodeContext = new VsCodeContextImpl();
