import { ErrorCode, VimError } from '../../error';
import { StatusBar } from '../../statusBar';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { CommandBase } from '../node';
import { Scanner } from '../scanner';

export class VsCodeCommand extends CommandBase {
  public override readonly acceptsRange = false;

  private command?: string;
  private constructor(command?: string) {
    super();
    this.command = command;
  }

  public static parse(args: string): VsCodeCommand {
    const scanner = new Scanner(args);
    scanner.skipWhiteSpace();
    return new VsCodeCommand(scanner.isAtEof ? undefined : scanner.nextWord());
  }

  async execute(vimState: VimState): Promise<void> {
    if (!this.command) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.ArgumentRequired));
      return;
    }
    await vscode.commands.executeCommand(this.command);
  }
}
