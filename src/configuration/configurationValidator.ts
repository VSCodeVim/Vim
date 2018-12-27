import * as vscode from 'vscode';

class ConfigurationValidator {
  private map: Map<string, boolean>;

  public async initialize(): Promise<void> {
    this.map = new Map(
      (await vscode.commands.getCommands(true)).map(x => [x, true] as [string, boolean])
    );
  }

  public isCommandValid(command: string): boolean {
    if (command.startsWith(':')) {
      return true;
    }

    return this.map.get(command) || false;
  }
}

export let configurationValidator = new ConfigurationValidator();
