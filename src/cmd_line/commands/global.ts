// eslint-disable-next-line id-denylist
import { Parser, all, optWhitespace, regexp, seq } from 'parsimmon';
import { Position } from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange, Address } from '../../vimscript/lineRange';
import { Pattern, SearchDirection } from '../../vimscript/pattern';
import { exCommandParser } from '../../vimscript/exCommandParser';
import { DeleteCommand } from './delete';
import { MoveCommand } from './move';
import { SubstituteCommand } from './substitute';

export interface IGlobalCommandArguments {
  pattern: Pattern;
  command: string;
  inverse: boolean;
}

export class GlobalCommand extends ExCommand {
  public static readonly argParser: Parser<GlobalCommand> = optWhitespace.then(
    regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(
        Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
        // Command is everything remaining (Pattern.parser consumes the delimiter)
        all,
      ).map(([pattern, command]) => new GlobalCommand({ pattern, command, inverse: false })),
    ),
  );

  // Parser for :g! commands (inverse global)
  public static readonly gInverseArgParser: Parser<GlobalCommand> = optWhitespace.then(
    regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(
        Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
        // Command is everything remaining (Pattern.parser consumes the delimiter)
        all,
      ).map(([pattern, command]) => new GlobalCommand({ pattern, command, inverse: true })),
    ),
  );

  // Parser for :v[global] commands (inverse global)
  public static readonly vArgParser: Parser<GlobalCommand> = optWhitespace.then(
    regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(
        Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
        // Command is everything remaining (Pattern.parser consumes the delimiter)
        all,
      ).map(([pattern, command]) => new GlobalCommand({ pattern, command, inverse: true })),
    ),
  );

  private readonly arguments: IGlobalCommandArguments;

  constructor(args: IGlobalCommandArguments) {
    super();
    this.arguments = args;
  }

  public override neovimCapable(): boolean {
    return false;
  }

  async execute(vimState: VimState): Promise<void> {
    // Default range is entire document (1,$)
    const entireDocumentRange = new LineRange(
      new Address({ type: 'number', num: 1 }),
      ',',
      new Address({ type: 'last_line' }),
    );
    await this.executeWithRange(vimState, entireDocumentRange);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    // Get the resolved line range
    const resolvedRange = range.resolve(vimState);

    // Find all pattern matches within the specified range
    const matches = this.arguments.pattern.allMatches(vimState, {
      lineRange: range,
    });

    // Extract unique line numbers from pattern matches
    const matchingLines = new Set<number>();
    for (const match of matches) {
      // Add all lines that the match spans
      for (let line = match.range.start.line; line <= match.range.end.line; line++) {
        // Only include lines within our resolved range (convert to 0-based indexing)
        if (line >= resolvedRange.start && line <= resolvedRange.end) {
          matchingLines.add(line);
        }
      }
    }

    // Handle inverse logic for :g! and :v commands
    let linesToProcess: Set<number>;
    if (this.arguments.inverse) {
      // For inverse commands, collect all lines NOT in the match set
      linesToProcess = new Set<number>();
      for (let line = resolvedRange.start; line <= resolvedRange.end; line++) {
        if (!matchingLines.has(line)) {
          linesToProcess.add(line);
        }
      }
    } else {
      // For normal commands, use the matching lines
      linesToProcess = matchingLines;
    }

    // Convert to sorted array for sequential processing
    const sortedLines = Array.from(linesToProcess).sort((a, b) => a - b);

    // Handle default command (print) when no command is specified
    let commandToExecute = this.arguments.command.trim();
    if (commandToExecute === '') {
      commandToExecute = 'p';
    }

    // Track line number adjustments and execution context
    const executionContext = {
      lineOffset: 0,
      originalLineCount: vimState.document.lineCount,
      processedLines: 0,
      lastProcessedLine: -1,
      // Track which original line numbers have been processed to handle edge cases
      processedOriginalLines: new Set<number>(),
    };

    // Execute the command on each marked line sequentially
    for (const originalLineNumber of sortedLines) {
      // Skip if we've already processed this original line (can happen with complex commands)
      if (executionContext.processedOriginalLines.has(originalLineNumber)) {
        continue;
      }

      // Adjust line number based on previous modifications
      const currentLineNumber = originalLineNumber + executionContext.lineOffset;

      // Skip if line no longer exists due to previous deletions
      if (currentLineNumber < 0 || currentLineNumber >= vimState.document.lineCount) {
        continue;
      }

      // Position cursor at the current line for command execution
      vimState.cursorStopPosition = new Position(currentLineNumber, 0);
      vimState.cursorStartPosition = new Position(currentLineNumber, 0);

      // Store line count before command execution
      const lineCountBefore = vimState.document.lineCount;

      try {
        // Parse the command string using existing exCommandParser
        const parseResult = exCommandParser.parse(`:${commandToExecute}`);

        if (parseResult.status === false) {
          // If parsing fails, try to handle it as a simple command
          throw new Error(`Invalid command: ${commandToExecute}`);
        }

        const { command: parsedCommand, lineRange: commandRange } = parseResult.value;

        // Execute the parsed command
        if (commandRange) {
          // If the command has its own range, execute with that range
          await parsedCommand.executeWithRange(vimState, commandRange);
        } else {
          // Execute on the current line
          const currentLineRange = new LineRange(
            new Address({ type: 'number', num: currentLineNumber + 1 }),
          );
          await parsedCommand.executeWithRange(vimState, currentLineRange);
        }

        // Calculate line count change after command execution
        const lineCountAfter = vimState.document.lineCount;
        const lineCountChange = lineCountAfter - lineCountBefore;

        // Update line offset and tracking based on command type and line count changes
        this.updateLineTracking(
          parsedCommand,
          commandToExecute,
          lineCountChange,
          currentLineNumber,
          executionContext,
        );

        // Mark this original line as processed
        executionContext.processedOriginalLines.add(originalLineNumber);
        executionContext.processedLines++;
        executionContext.lastProcessedLine = Math.max(
          0,
          Math.min(currentLineNumber, vimState.document.lineCount - 1),
        );
      } catch (error) {
        // Stop execution on command errors and propagate the error
        throw error;
      }
    }

    // Position cursor at the last affected line after completion
    if (
      executionContext.lastProcessedLine >= 0 &&
      executionContext.lastProcessedLine < vimState.document.lineCount
    ) {
      vimState.cursorStopPosition = new Position(executionContext.lastProcessedLine, 0);
      vimState.cursorStartPosition = new Position(executionContext.lastProcessedLine, 0);
    }
  }

  /**
   * Updates line tracking based on the executed command and its effects on the document
   */
  private updateLineTracking(
    parsedCommand: ExCommand,
    commandString: string,
    lineCountChange: number,
    currentLineNumber: number,
    executionContext: {
      lineOffset: number;
      originalLineCount: number;
      processedLines: number;
      lastProcessedLine: number;
      processedOriginalLines: Set<number>;
    },
  ): void {
    // Handle different command types and their line count effects
    if (parsedCommand instanceof DeleteCommand || commandString.startsWith('d')) {
      // Delete commands: lines are removed, subsequent lines move up
      executionContext.lineOffset += lineCountChange; // lineCountChange will be negative for deletions
    } else if (parsedCommand instanceof MoveCommand || commandString.startsWith('m')) {
      // Move commands: complex line rearrangement
      // The line count change tells us how many lines were added/removed at the destination
      executionContext.lineOffset += lineCountChange;
    } else if (parsedCommand instanceof SubstituteCommand || commandString.startsWith('s')) {
      // Substitute commands: can add or remove lines based on replacement text
      executionContext.lineOffset += lineCountChange;
    } else if (commandString.startsWith('t') || commandString.startsWith('co')) {
      // Copy commands: lines are added, subsequent lines move down
      executionContext.lineOffset += lineCountChange; // lineCountChange will be positive for copies
    } else if (commandString.startsWith('i') || commandString.startsWith('a')) {
      // Insert/append commands: lines are added
      executionContext.lineOffset += lineCountChange;
    } else {
      // For other commands (like print, normal mode commands), track any line count changes
      // This handles edge cases where commands might unexpectedly modify line count
      executionContext.lineOffset += lineCountChange;
    }

    // Handle edge cases where lines are deleted or moved in complex ways
    if (lineCountChange < 0) {
      // Lines were deleted - we need to be more careful about subsequent line processing
      // If we deleted multiple lines, we need to account for that in our tracking
      const linesDeleted = Math.abs(lineCountChange);

      // Mark additional original lines as processed if they were deleted
      // This prevents trying to process lines that no longer exist
      for (let j = 1; j <= linesDeleted; j++) {
        const deletedOriginalLine = currentLineNumber - executionContext.lineOffset + j;
        if (deletedOriginalLine >= 0) {
          executionContext.processedOriginalLines.add(deletedOriginalLine);
        }
      }
    }
  }
}
