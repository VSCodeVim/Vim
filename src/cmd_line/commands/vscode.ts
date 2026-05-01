import { all, Parser, whitespace } from 'parsimmon';
import * as vscode from 'vscode';
import { VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export class VsCodeCommand extends ExCommand {
  public static readonly argParser: Parser<VsCodeCommand> = whitespace
    .then(all)
    .map((command) => new VsCodeCommand(command));

  private command: string;

  public constructor(command: string) {
    super();
    this.command = command;
    if (!this.command) {
      throw VimError.ArgumentRequired();
    }
  }

  async execute(vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand(this.command);
  }
}
