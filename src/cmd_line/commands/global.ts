// eslint-disable-next-line id-denylist
import { Parser, all, optWhitespace, regexp, seq } from 'parsimmon';
import { Position } from 'vscode';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { Cursor } from '../../common/motion/cursor';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange, Address } from '../../vimscript/lineRange';
import { Pattern, SearchDirection, PatternMatch } from '../../vimscript/pattern';
import { exCommandParser } from '../../vimscript/exCommandParser';
import { DeleteCommand } from './delete';
import { MoveCommand } from './move';
import { SubstituteCommand } from './substitute';
import { ErrorCode, VimError } from '../../error';
import { StatusBar } from '../../statusBar';

export interface IGlobalCommandArguments {
  pattern: Pattern;
  command: string;
  inverse: boolean;
}

interface ExecutionContext {
  lineOffset: number;
  originalLineCount: number;
  processedLines: number;
  lastProcessedLine: number;
  processedOriginalLines: Set<number>;
}

export class GlobalCommand extends ExCommand {
  public static readonly argParser: Parser<GlobalCommand> = GlobalCommand.createParser(false);

  public static readonly vArgParser: Parser<GlobalCommand> = GlobalCommand.createParser(true);

  private static createParser(inverse: boolean): Parser<GlobalCommand> {
    return optWhitespace.then(
      regexp(/[^\w\s\\|"]{1}/)
        .chain((delimiter) =>
          seq(
            Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
            // Command is everything remaining (Pattern.parser consumes the delimiter)
            all,
          ).map(([pattern, command]) => new GlobalCommand({ pattern, command, inverse })),
        )
        .or(
          // Handle case where no delimiter is provided - this should be an error
          all.map(() => {
            throw VimError.fromCode(ErrorCode.InvalidExpression);
          }),
        ),
    );
  }

  private readonly arguments: IGlobalCommandArguments;

  constructor(args: IGlobalCommandArguments) {
    super();

    // Validate pattern is not empty (Requirement 6.1)
    if (!args.pattern || args.pattern.patternString === '') {
      throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
    }

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
    this.clearMultiCursorSelections(vimState);
    vimState.historyTracker.addChange(true);

    try {
      const resolvedRange = this.validateAndResolveRange(vimState, range);
      const matches = this.findPatternMatches(vimState, range);
      const matchingLines = this.extractMatchingLines(matches, resolvedRange);
      const linesToProcess = this.determineLinesToProcess(vimState, matchingLines, resolvedRange);

      if (linesToProcess.size === 0) {
        return;
      }

      const sortedLines = Array.from(linesToProcess).sort((a, b) => a - b);
      const commandToExecute = this.getCommandToExecute();
      const executionContext = this.createExecutionContext(vimState);

      await this.executeCommandOnLines(vimState, sortedLines, commandToExecute, executionContext);
      this.positionFinalCursor(vimState, sortedLines, executionContext);
    } finally {
      vimState.historyTracker.finishCurrentStep();
    }
  }

  private clearMultiCursorSelections(vimState: VimState): void {
    if (vimState.isMultiCursor) {
      const currentPosition = vimState.cursorStopPosition;
      vimState.editor.selections = [new vscode.Selection(currentPosition, currentPosition)];
      vimState.cursors = [new Cursor(currentPosition, currentPosition)];
      vimState.isFakeMultiCursor = false;
    }
  }

  private validateAndResolveRange(
    vimState: VimState,
    range: LineRange,
  ): { start: number; end: number } {
    let resolvedRange: { start: number; end: number };
    try {
      resolvedRange = range.resolve(vimState);
    } catch (error) {
      throw VimError.fromCode(ErrorCode.InvalidRange);
    }

    if (
      resolvedRange.start < 0 ||
      resolvedRange.end >= vimState.document.lineCount ||
      resolvedRange.start > resolvedRange.end
    ) {
      throw VimError.fromCode(ErrorCode.InvalidRange);
    }

    return resolvedRange;
  }

  private findPatternMatches(vimState: VimState, range: LineRange): PatternMatch[] {
    try {
      return this.arguments.pattern.allMatches(vimState, { lineRange: range });
    } catch (error) {
      throw VimError.fromCode(ErrorCode.InvalidExpression);
    }
  }

  private extractMatchingLines(
    matches: PatternMatch[],
    resolvedRange: { start: number; end: number },
  ): Set<number> {
    const matchingLines = new Set<number>();
    for (const match of matches) {
      for (let line = match.range.start.line; line <= match.range.end.line; line++) {
        if (line >= resolvedRange.start && line <= resolvedRange.end) {
          matchingLines.add(line);
        }
      }
    }
    return matchingLines;
  }

  private determineLinesToProcess(
    vimState: VimState,
    matchingLines: Set<number>,
    resolvedRange: { start: number; end: number },
  ): Set<number> {
    if (this.arguments.inverse) {
      const linesToProcess = new Set<number>();
      for (let line = resolvedRange.start; line <= resolvedRange.end; line++) {
        if (!matchingLines.has(line)) {
          linesToProcess.add(line);
        }
      }
      return linesToProcess;
    } else {
      if (matchingLines.size === 0) {
        StatusBar.displayError(
          vimState,
          VimError.fromCode(ErrorCode.PatternNotFound, this.arguments.pattern.patternString),
        );
      }
      return matchingLines;
    }
  }

  private getCommandToExecute(): string {
    const command = this.arguments.command.trim();
    return command === '' ? 'p' : command;
  }

  private createExecutionContext(vimState: VimState): ExecutionContext {
    return {
      lineOffset: 0,
      originalLineCount: vimState.document.lineCount,
      processedLines: 0,
      lastProcessedLine: -1,
      processedOriginalLines: new Set<number>(),
    };
  }

  private async executeCommandOnLines(
    vimState: VimState,
    sortedLines: number[],
    commandToExecute: string,
    executionContext: ExecutionContext,
  ): Promise<void> {
    for (const originalLineNumber of sortedLines) {
      if (executionContext.processedOriginalLines.has(originalLineNumber)) {
        continue;
      }

      const currentLineNumber = originalLineNumber + executionContext.lineOffset;
      if (currentLineNumber < 0 || currentLineNumber >= vimState.document.lineCount) {
        continue;
      }

      this.positionCursorAtLine(vimState, currentLineNumber);
      const lineCountBefore = vimState.document.lineCount;

      try {
        const parsedCommand = await this.executeCommand(
          vimState,
          commandToExecute,
          currentLineNumber,
        );
        const lineCountChange = vimState.document.lineCount - lineCountBefore;

        this.updateLineTracking(
          parsedCommand,
          commandToExecute,
          lineCountChange,
          currentLineNumber,
          executionContext,
        );

        this.updateExecutionContext(
          executionContext,
          originalLineNumber,
          currentLineNumber,
          vimState,
        );
      } catch (error) {
        this.handleCommandError(
          vimState,
          error,
          commandToExecute,
          currentLineNumber,
          executionContext,
        );
        break;
      }
    }
  }

  private positionCursorAtLine(vimState: VimState, lineNumber: number): void {
    vimState.cursor = Cursor.atPosition(new Position(lineNumber, 0));
    vimState.editor.selection = new vscode.Selection(position, position);
  }

  private async executeCommand(
    vimState: VimState,
    commandToExecute: string,
    currentLineNumber: number,
  ): Promise<ExCommand> {
    const parseResult = exCommandParser.parse(`:${commandToExecute}`);

    if (parseResult.status === false) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.NotAnEditorCommand, commandToExecute),
      );
      throw new Error('Command parsing failed');
    }

    const { command: parsedCommand, lineRange: commandRange } = parseResult.value;

    if (commandRange) {
      await parsedCommand.executeWithRange(vimState, commandRange);
    } else {
      const currentLineRange = new LineRange(
        new Address({ type: 'number', num: currentLineNumber + 1 }),
      );
      await parsedCommand.executeWithRange(vimState, currentLineRange);
    }

    return parsedCommand;
  }

  private updateExecutionContext(
    executionContext: ExecutionContext,
    originalLineNumber: number,
    currentLineNumber: number,
    vimState: VimState,
  ): void {
    executionContext.processedOriginalLines.add(originalLineNumber);
    executionContext.processedLines++;
    executionContext.lastProcessedLine = Math.max(
      0,
      Math.min(currentLineNumber, vimState.document.lineCount - 1),
    );
  }

  private handleCommandError(
    vimState: VimState,
    error: any,
    commandToExecute: string,
    currentLineNumber: number,
    executionContext: ExecutionContext,
  ): void {
    executionContext.lastProcessedLine = Math.max(
      0,
      Math.min(currentLineNumber, vimState.document.lineCount - 1),
    );

    if (error instanceof VimError) {
      StatusBar.displayError(vimState, error);
    } else {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.NotAnEditorCommand, commandToExecute),
      );
    }
  }

  private positionFinalCursor(
    vimState: VimState,
    sortedLines: number[],
    executionContext: ExecutionContext,
  ): void {
    let finalPosition: Position;

    if (
      executionContext.lastProcessedLine >= 0 &&
      executionContext.lastProcessedLine < vimState.document.lineCount
    ) {
      finalPosition = new Position(executionContext.lastProcessedLine, 0);
    } else if (sortedLines.length > 0) {
      const lastLineIndex = Math.min(
        sortedLines[sortedLines.length - 1],
        vimState.document.lineCount - 1,
      );
      finalPosition = new Position(lastLineIndex, 0);
    } else {
      finalPosition = vimState.cursorStopPosition;
    }

    vimState.cursorStopPosition = finalPosition;
    vimState.cursorStartPosition = finalPosition;
    vimState.editor.selection = new vscode.Selection(finalPosition, finalPosition);
    vimState.cursors = [new Cursor(finalPosition, finalPosition)];
    vimState.lastVisualSelection = undefined;
  }

  /**
   * Updates line tracking based on the executed command and its effects on the document
   */
  private updateLineTracking(
    parsedCommand: ExCommand | null,
    commandString: string,
    lineCountChange: number,
    currentLineNumber: number,
    executionContext: ExecutionContext,
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
