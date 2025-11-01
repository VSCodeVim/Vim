import { VimError } from '../../error';
import { StatusBar } from '../../statusBar';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { all, Parser, whitespace } from 'parsimmon';

export class VsCodeCommand extends ExCommand {
  public override isRepeatableWithDot = false;

  public static readonly argParser: Parser<VsCodeCommand> = whitespace
    .then(all)
    .map((command) => new VsCodeCommand(command));

  private command?: string;

  public constructor(command?: string) {
    super();
    this.command = command;
  }

  async execute(vimState: VimState): Promise<void> {
    if (!this.command) {
      StatusBar.displayError(vimState, VimError.ArgumentRequired());
      return;
    }
    await vscode.commands.executeCommand(this.command);
  }
}
