import { Parser, optWhitespace, seq, regexp, alt } from 'parsimmon';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export interface IResizeCommandArguments {
  direction?: '+' | '-';
  value?: number;
  absoluteValue?: number;
}

/**
 * Implements :resize command
 * The :resize command is used to change the height of the current window
 *
 * Examples:
 * :resize 20      - set window height to 20 rows
 * :resize +5      - increase window height by 5 rows
 * :resize -3      - decrease window height by 3 rows
 */
export class ResizeCommand extends ExCommand {
  public static readonly argParser: Parser<ResizeCommand> = seq(
    optWhitespace,
    alt(
      // Parse absolute values like ":resize 20"
      regexp(/\d+/).map((num) => ({ absoluteValue: parseInt(num, 10) })),
      // Parse relative values like ":resize +5" or ":resize -3"
      seq(regexp(/[+-]/), regexp(/\d+/)).map(([direction, num]) => ({
        direction: direction as '+' | '-',
        value: parseInt(num, 10),
      })),
      // Empty args defaults to maximize
      optWhitespace.map(() => ({})),
    ),
  ).map(([, args]) => new ResizeCommand(args));

  private readonly arguments: IResizeCommandArguments;

  constructor(args: IResizeCommandArguments) {
    super();
    this.arguments = args;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  async execute(vimState: VimState): Promise<void> {
    const { direction, value, absoluteValue } = this.arguments;

    // Handle absolute resize
    if (absoluteValue !== undefined) {
      // VSCode doesn't have direct API for setting absolute window size
      // We'll use the editor group commands for better control
      if (absoluteValue === 0) {
        // Instead of minimizing other editors, maximize current editor height
        await vscode.commands.executeCommand('workbench.action.maximizeEditor');
      } else {
        // For absolute values, we approximate by using evenEditorHeights
        await vscode.commands.executeCommand('workbench.action.evenEditorHeights');
      }
      return;
    }

    // Handle relative resize
    if (direction && value !== undefined) {
      const command =
        direction === '+'
          ? 'workbench.action.increaseViewHeight'
          : 'workbench.action.decreaseViewHeight';

      // Execute the command multiple times based on the value
      for (let i = 0; i < value; i++) {
        await vscode.commands.executeCommand(command);
      }
      return;
    }

    // Default behavior (no arguments) - toggle editor height maximization
    await vscode.commands.executeCommand('workbench.action.maximizeEditor');
  }
}
