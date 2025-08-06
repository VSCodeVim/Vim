import { Parser, all, optWhitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { FileCommand } from './file';
import * as vscode from 'vscode';

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
 * :vertical resize 80          - Set current window width to approximately 80 columns
 * :vertical resize             - Toggle window width maximization
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

  public override neovimCapable(): boolean {
    return true;
  }

  async execute(vimState: VimState): Promise<void> {
    const command = this.arguments.command.trim();

    if (!command) {
      // If no command is provided, just set the flag (though this is uncommon)
      vimState.isVerticalSplitModifier = true;
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
      }

      // Execute width resize commands
      if (absoluteValue !== undefined) {
        // For absolute values, use evenEditorWidths as approximation
        await vscode.commands.executeCommand('workbench.action.evenEditorWidths');
      } else if (direction && value !== undefined) {
        const resizeCommand =
          direction === '+'
            ? 'workbench.action.increaseViewWidth'
            : 'workbench.action.decreaseViewWidth';

        // Execute the command multiple times based on the value
        for (let i = 0; i < value; i++) {
          await vscode.commands.executeCommand(resizeCommand);
        }
      }

      return;
    }

    // For other commands, set the flag and let them handle it
    // (This is a fallback for commands we don't explicitly handle)
    vimState.isVerticalSplitModifier = true;
  }
}
