import { Parser, succeed } from 'parsimmon';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export class TerminalCommand extends ExCommand {
  public static readonly argParser: Parser<TerminalCommand> = succeed(new TerminalCommand());

  async execute(vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.createTerminalEditor');
  }
}
