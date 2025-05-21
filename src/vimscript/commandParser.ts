import { ExCommand } from './exCommand';
import { VimState } from '../state/vimState';
import { LineRange } from './lineRange';
import { StatusBar } from '../statusBar';
import { ErrorCode, VimError } from '../error';
import { DeleteCommand } from '../cmd_line/commands/delete';
import { Parser } from 'parsimmon';

export interface CommandDefinition {
  name: string;
  parser: Parser<ExCommand>;
}

export class CommandParser {
  private static commands: CommandDefinition[] = [];

  static registerCommand(name: string, parser: Parser<ExCommand>) {
    this.commands.push({ name, parser });
  }

  static findCommand(cmdName: string): CommandDefinition | undefined {
    // Handle single-letter commands like 'd' for delete
    if (cmdName === 'd') {
      return { name: 'delete', parser: DeleteCommand.argParser };
    }
    return this.commands.find((cmd) => cmd.name === cmdName);
  }

  static async executeCommand(
    vimState: VimState,
    cmdName: string,
    cmdArgs: string,
    range: LineRange,
  ): Promise<void> {
    const cmd = this.findCommand(cmdName);
    if (cmd) {
      try {
        const result = cmd.parser.tryParse(cmdArgs);
        if (result instanceof ExCommand) {
          await result.executeWithRange(vimState, range);
        } else {
          StatusBar.setText(vimState, 'Not an editor command', true);
        }
      } catch (e) {
        if (e instanceof VimError) {
          StatusBar.setText(vimState, e.toString(), true);
        } else {
          StatusBar.setText(vimState, `Error executing command: ${cmdName}`, true);
        }
      }
    } else {
      StatusBar.setText(vimState, `Unknown command: ${cmdName}`, true);
    }
  }
}
