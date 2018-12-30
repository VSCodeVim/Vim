import * as vscode from 'vscode';

/**
 * Wrapper around VS Code's `setContext`.
 * The API call takes several milliseconds to seconds to complete,
 * so let's cache the values and only call the API when necessary.
 */
class VsCodeContextImpl {
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
