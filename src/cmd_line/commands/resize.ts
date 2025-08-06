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

  async execute(): Promise<void> {
    const { direction, value, absoluteValue } = this.arguments;

    // Handle absolute resize
    if (absoluteValue !== undefined) {
      // VSCode doesn't support setting absolute window heights
      vscode.window.showInformationMessage(
        `VSCode doesn't support setting exact row heights. Use relative resize (+/-) instead.`,
      );
      return;
    }

    // Handle relative resize
    if (direction && value !== undefined) {
      const command =
        direction === '+'
          ? 'workbench.action.increaseViewHeight'
          : 'workbench.action.decreaseViewHeight';

      // Use runCommands for better performance with multiple executions
      if (value > 1) {
        const commands = Array(value).fill(command);
        await vscode.commands.executeCommand('runCommands', { commands });
      } else {
        await vscode.commands.executeCommand(command);
      }
      return;
    }

    // TODO: Default behavior (no arguments) - toggle panel to maximize editor height
  }
}
