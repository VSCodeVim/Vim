// eslint-disable-next-line id-denylist
import { Parser, all, optWhitespace, regexp, seq } from 'parsimmon';
import { Position } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { VimError } from '../../error';
import { globalState } from '../../state/globalState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';
import { Pattern, PatternMatch, SearchDirection } from '../../vimscript/pattern';

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

  /**
   * Injected by exCommandParser.ts to avoid a circular import.
   * Parses and executes a single ex command string in the context of the given line.
   */
  public static runExCommand: (
    vimState: VimState,
    commandText: string,
    lineNumber: number,
  ) => Promise<void>;

  private static createParser(inverse: boolean): Parser<GlobalCommand> {
    return optWhitespace.then(
      regexp(/[^\w\s\\|"]/)
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
            throw VimError.InvalidExpression('');
          }),
        ),
    );
  }

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
    this.clearMultiCursorSelections(vimState);
    vimState.historyTracker.addChange(true);

    try {
      const resolvedRange = this.validateAndResolveRange(vimState, range);
      const pattern = this.resolvePattern();
      const matches = this.findPatternMatches(vimState, range, pattern);
      const matchingLines = this.extractMatchingLines(matches, resolvedRange);
      const linesToProcess = this.determineLinesToProcess(
        vimState,
        matchingLines,
        resolvedRange,
        pattern,
      );

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
      vimState.cursors = [new Cursor(currentPosition, currentPosition)];
      vimState.isFakeMultiCursor = false;
    }
  }

  private resolvePattern(): Pattern {
    if (this.arguments.pattern.patternString === '') {
      // Empty pattern: fall back to the last search pattern
      const prevSearchState = globalState.searchState;
      if (
        prevSearchState === undefined ||
        prevSearchState.searchString === '' ||
        prevSearchState.pattern === undefined
      ) {
        throw VimError.NoPreviousRegularExpression();
      }
      return prevSearchState.pattern;
    }
    return this.arguments.pattern;
  }

  private validateAndResolveRange(
    vimState: VimState,
    range: LineRange,
  ): { start: number; end: number } {
    let resolvedRange: { start: number; end: number };
    try {
      resolvedRange = range.resolve(vimState);
    } catch (_e) {
      throw VimError.InvalidRange();
    }

    if (
      resolvedRange.start < 0 ||
      resolvedRange.end >= vimState.document.lineCount ||
      resolvedRange.start > resolvedRange.end
    ) {
      throw VimError.InvalidRange();
    }

    return resolvedRange;
  }

  private findPatternMatches(
    vimState: VimState,
    range: LineRange,
    pattern: Pattern,
  ): PatternMatch[] {
    try {
      return pattern.allMatches(vimState, { lineRange: range });
    } catch (_e) {
      throw VimError.InvalidExpression('');
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
    pattern: Pattern,
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
        StatusBar.displayError(vimState, VimError.PatternNotFound(pattern.patternString));
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
        await this.executeCommand(vimState, commandToExecute, currentLineNumber);
        const lineCountChange = vimState.document.lineCount - lineCountBefore;

        this.updateLineTracking(lineCountChange, currentLineNumber, executionContext);

        this.updateExecutionContext(
          executionContext,
          originalLineNumber,
          currentLineNumber,
          vimState,
        );
      } catch (e) {
        this.handleCommandError(vimState, e, commandToExecute, currentLineNumber, executionContext);
        break;
      }
    }
  }

  private positionCursorAtLine(vimState: VimState, lineNumber: number): void {
    vimState.cursor = Cursor.atPosition(new Position(lineNumber, 0));
  }

  private async executeCommand(
    vimState: VimState,
    commandToExecute: string,
    currentLineNumber: number,
  ): Promise<void> {
    await GlobalCommand.runExCommand(vimState, commandToExecute, currentLineNumber);
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
    e: unknown,
    commandToExecute: string,
    currentLineNumber: number,
    executionContext: ExecutionContext,
  ): void {
    executionContext.lastProcessedLine = Math.max(
      0,
      Math.min(currentLineNumber, vimState.document.lineCount - 1),
    );

    if (e instanceof VimError) {
      StatusBar.displayError(vimState, e);
    } else {
      StatusBar.displayError(vimState, VimError.NotAnEditorCommand(commandToExecute));
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

    vimState.cursors = [new Cursor(finalPosition, finalPosition)];
  }

  /**
   * Updates line tracking based on the executed command and its effects on the document
   */
  private updateLineTracking(
    lineCountChange: number,
    currentLineNumber: number,
    executionContext: ExecutionContext,
  ): void {
    executionContext.lineOffset += lineCountChange;

    // If lines were deleted, mark the corresponding original lines as processed
    // to prevent trying to process lines that no longer exist
    if (lineCountChange < 0) {
      const linesDeleted = Math.abs(lineCountChange);
      for (let j = 1; j <= linesDeleted; j++) {
        const deletedOriginalLine = currentLineNumber - executionContext.lineOffset + j;
        if (deletedOriginalLine >= 0) {
          executionContext.processedOriginalLines.add(deletedOriginalLine);
        }
      }
    }
  }
}
