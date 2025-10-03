import { Parser, all, optWhitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { FileCommand } from './file';
import * as vscode from 'vscode';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';

export interface IVerticalCommandArguments {
  /** The command following :vertical (e.g., "split", "new filename", "resize +5") */
  command: string;
}

/**
 * Implements :vertical command
 * The :vertical command modifier forces the following command to be executed
 * in a vertical split manner instead of horizontal.
 *
 * Currently supported commands:
 * - split: Create vertical split instead of horizontal split
 * - new: Create new file in vertical split instead of horizontal split
 * - resize: Adjust window width instead of height
 *
 * Examples:
 * :vertical split              - Create vertical split of current file
 * :vertical split filename     - Create vertical split and open filename
 * :vertical new                - Create vertical split with new untitled file
 * :vertical new filename       - Create vertical split with new file named filename
 * :vertical resize +5          - Increase current window width by 5 columns
 * :vertical resize -3          - Decrease current window width by 3 columns
 *
 * Note: For other commands (like help), :vertical sets a modifier flag that
 * compatible commands can check, but many commands are not yet implemented
 * in this Vim extension.
 */
export class VerticalCommand extends ExCommand {
  public static readonly argParser: Parser<VerticalCommand> = optWhitespace
    .then(all)
    .map((command) => new VerticalCommand({ command }));

  private readonly arguments: IVerticalCommandArguments;

  constructor(args: IVerticalCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    const command = this.arguments.command.trim();

    if (!command) {
      // :vertical without a command is not meaningful
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.ArgumentRequired));
      return;
    }

    // Handle specific commands that we know support vertical modification
    if (command === 'split' || command.startsWith('split ')) {
      // Parse as a split command but force vertical behavior
      const splitArgs = command.substring(5).trim(); // Remove 'split'
      let fileCommand: FileCommand;

      if (splitArgs === '') {
        // :vertical split (no file)
        fileCommand = new FileCommand({ name: 'vsplit', opt: [] });
      } else {
        // :vertical split filename
        fileCommand = new FileCommand({ name: 'vsplit', opt: [], file: splitArgs });
      }

      await fileCommand.execute(vimState);
      return;
    }

    if (command === 'new' || command.startsWith('new ')) {
      // Parse as a new command but force vertical behavior
      const newArgs = command.substring(3).trim(); // Remove 'new'
      let fileCommand: FileCommand;

      if (newArgs === '') {
        // :vertical new (no file)
        fileCommand = new FileCommand({ name: 'vnew', opt: [] });
      } else {
        // :vertical new filename
        fileCommand = new FileCommand({ name: 'vnew', opt: [], file: newArgs });
      }

      await fileCommand.execute(vimState);
      return;
    }

    if (command === 'resize' || command.startsWith('resize ')) {
      // Handle :vertical resize - change window width instead of height
      const resizeArgs = command.substring(6).trim(); // Remove 'resize'

      // Parse resize arguments
      let direction: '+' | '-' | undefined;
      let value: number | undefined;
      let absoluteValue: number | undefined;

      if (resizeArgs === '') {
        // :vertical resize (no args) - maximize width
        // Use editor group commands instead of panel commands
        await vscode.commands.executeCommand('workbench.action.toggleEditorWidths');
        return;
      }

      // Parse arguments
      const match = resizeArgs.match(/^([+-]?)(\d+)$/);
      if (match) {
        const [, dir, num] = match;
        if (dir) {
          direction = dir as '+' | '-';
          value = parseInt(num, 10);
        } else {
          absoluteValue = parseInt(num, 10);
        }
      } else {
        // Invalid argument (e.g., non-numeric or unexpected chars)
        StatusBar.displayError(
          vimState,
          VimError.fromCode(ErrorCode.InvalidArgument474, resizeArgs),
        );
        return;
      }

      // Execute width resize commands
      if (absoluteValue !== undefined) {
        // VSCode doesn't support setting absolute window widths
        StatusBar.setText(
          vimState,
          `VSCode doesn't support setting exact column widths. Use relative resize (+/-) instead.`,
        );
        return;
      } else if (direction && value !== undefined) {
        // A value of 0 should be a no-op
        if (value === 0) {
          return;
        }
        const resizeCommand =
          direction === '+'
            ? 'workbench.action.increaseViewWidth'
            : 'workbench.action.decreaseViewWidth';

        // Use runCommands for better performance with multiple executions
        if (value > 1) {
          const commands = Array(value).fill(resizeCommand);
          await vscode.commands.executeCommand('runCommands', { commands });
        } else {
          await vscode.commands.executeCommand(resizeCommand);
        }
      }

      return;
    }

    // For other commands that we don't explicitly support
    StatusBar.displayError(
      vimState,
      VimError.fromCode(ErrorCode.NotAnEditorCommand, `vertical ${command}`),
    );
  }
}
