import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { CommandBase } from '../node';
import { Scanner } from '../scanner';

export class VsCodeCommand extends CommandBase {
  private command?: string;

  constructor(command?: string) {
    super();
    this.command = command;
  }

  public static parse(args: string): VsCodeCommand {
    const scanner = new Scanner(args);
    scanner.skipWhiteSpace();
    return new VsCodeCommand(scanner.isAtEof ? undefined : scanner.nextWord());
  }

  private async vsc() {
    await vscode.commands.executeCommand(this.command ?? '');
  }

  async execute(_vimState: VimState): Promise<void> {
    await this.vsc();
  }
}
