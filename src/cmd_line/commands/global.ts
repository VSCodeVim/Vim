import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { optWhitespace, Parser, regexp, string as parsimmonString, seqMap } from 'parsimmon';
import { LineRange } from '../../vimscript/lineRange';
import { ErrorCode, VimError } from '../../error';
import { StatusBar } from '../../statusBar';
import { Address } from '../../vimscript/lineRange';
import { CommandParser } from '../../vimscript/commandParser';
import { Logger } from '../../util/logger';
import * as vscode from 'vscode';
import { getDecorationsForSearchMatchRanges } from '../../util/decorationUtils';
import { decoration } from '../../configuration/decoration';

export class GlobalCommand extends ExCommand {
  public static readonly argParser: Parser<GlobalCommand> = optWhitespace
    .then(
      seqMap(
        parsimmonString('/'),
        regexp(/[^/]*/),
        parsimmonString('/'),
        optWhitespace.then(regexp(/.*/)),
        (slash1, pattern, slash2, command) => {
          Logger.info(`Global command parsed: pattern='${pattern}', command='${command.trim()}'`);
          return new GlobalCommand(pattern, command.trim());
        },
      ),
    )
    .desc('global command');

  private readonly pattern: string;
  private readonly command: string;
  // create a private map inserted with value

  constructor(pattern: string, command: string) {
    super();
    this.pattern = pattern;
    this.command = command;
    Logger.info(`Global command constructed: pattern='${pattern}', command='${command}'`);
  }

  async execute(vimState: VimState): Promise<void> {
    try {
      Logger.info(`Executing global command: pattern='${this.pattern}' command='${this.command}'`);
      const document = vimState.editor.document;
      const lines = document.getText().split('\n');
      const matchingLines: number[] = [];

      // Find lines matching the pattern
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (this.matchesPattern(line)) {
          matchingLines.push(i);
          Logger.info(`Line ${i + 1} matches pattern: ${line}`);
        }
      }

      Logger.info(`Found ${matchingLines.length} matching lines for pattern: ${this.pattern}`);

      // Execute command on matching lines (in reverse order for delete)
      const rangeList: LineRange[] = [];
      for (let i = matchingLines.length - 1; i >= 0; i--) {
        const line = matchingLines[i];
        const lineRange = new LineRange(
          new Address({ type: 'number', num: line + 1 }),
          undefined,
          new Address({ type: 'number', num: line + 1 }),
        );
        rangeList.push(lineRange);

        try {
          // Split command into name and args
          const [cmdName, ...cmdArgs] = this.command.split(/\s+/);
          const args = cmdArgs.join(' ');

          {
            if (this.command === 'd') {
              for (const currentRange of rangeList) {
                Logger.info(
                  `Executing command '${cmdName}' with args '${args}' on line ${line + 1}`,
                );
                // Use CommandParser to execute the command
                await CommandParser.executeCommand(vimState, cmdName, args, currentRange);
              }
            } else {
              Logger.info(`Command is not implemented yet or incorrect: ${this.command}`);
              StatusBar.setText(vimState, `Error executing global command: ${this.command}`, true);
            }
          }
        } catch (e) {
          if (e instanceof VimError) {
            Logger.error(`VimError executing command: ${e.toString()}`);
            StatusBar.setText(vimState, e.toString(), true);
          } else {
            Logger.error(`Error executing command on line ${line + 1}: ${e}`);
            StatusBar.setText(vimState, `Error executing command on line ${line + 1}`, true);
          }
        }
      }
    } catch (e) {
      Logger.error(`Global command error: ${e}`);
      if (e instanceof VimError) {
        StatusBar.setText(vimState, e.toString(), true);
      } else {
        StatusBar.setText(vimState, `Error executing global command: ${e}`, true);
      }
    }
  }

  private matchesPattern(line: string): boolean {
    try {
      const regex = new RegExp(this.pattern);
      return regex.test(line);
    } catch (e) {
      // If pattern is invalid regex, treat it as a literal string
      return line.includes(this.pattern);
    }
  }
}
