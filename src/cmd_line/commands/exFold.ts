import { all, optWhitespace, Parser } from 'parsimmon';
import * as vscode from 'vscode';
import { FoldingRange } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { VimError } from '../../error';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { Logger } from '../../util/logger';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';
import { ExCommandLine } from '../commandLine';
import { NormalCommand } from './normal';
import { SubstituteCommand } from './substitute';

abstract class AbstractExFoldCommand extends ExCommand {
  abstract commandName: string;
  abstract direction: 'up' | 'down';

  override async execute(vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand(this.commandName, {
      direction: this.direction,
      levels: 1,
    });
    await vimState.setCurrentMode(Mode.Normal);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { start, end } = range.resolveToRange(vimState);

    vimState.recordedState.transformer.vscodeCommand(this.commandName, {
      selectionLines: Array.from({ length: end.line - start.line + 1 }, (_, i) => start.line + i),
      direction: this.direction,
      levels: 1,
    });
    await vimState.setCurrentMode(Mode.Normal);
  }
}

export class ExFoldCommand extends ExCommand {
  readonly commandName = 'editor.createFoldingRangeFromSelection';

  override execute(vimState: VimState): Promise<void> {
    throw VimError.FoldRequiredRange();
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const previousSelections = vimState.lastVisualSelection;
    const { start, end } = range.resolveToRange(vimState);
    vimState.editor.selection = new vscode.Selection(start, end);
    await vscode.commands.executeCommand(this.commandName);
    vimState.lastVisualSelection = previousSelections;
    vimState.cursors = [Cursor.atPosition(start)];
    await vimState.setCurrentMode(Mode.Normal);
    return Promise.resolve();
  }
}

export class ExFoldcloseCommand extends AbstractExFoldCommand {
  readonly commandName = 'editor.fold';
  readonly direction = 'up' as const;
}

export class ExFoldopenCommand extends AbstractExFoldCommand {
  readonly commandName = 'editor.unfold';
  readonly direction = 'down' as const;
}

type RangePoint = {
  start: number;
  end: number;
};

const folddCommandWhiteList = [SubstituteCommand, NormalCommand];

abstract class AbstractExFolddCommand extends ExCommand {
  abstract folddType: 'folddoopen' | 'folddoclosed';
  readonly inner: string;
  private readonly commandName = 'vscode.executeFoldingRangeProvider';

  private makeLineRange(startLineZeroBased: number, endLineZeroBased: number): LineRange {
    return new LineRange(
      new Address({ type: 'number', num: startLineZeroBased + 1 }),
      ',',
      new Address({ type: 'number', num: endLineZeroBased + 1 }),
    );
  }

  /**
   * Execute an inner Ex command over [start, end] (0-based, inclusive).
   * - Swallows error so folddoopen/folddoclosed can continue.
   */
  private async executeInnerWithRange(
    vimState: VimState,
    command: ExCommand,
    startLineZeroBased: number,
    endLineZeroBased: number,
  ): Promise<void> {
    try {
      await command.executeWithRange(
        vimState,
        this.makeLineRange(startLineZeroBased, endLineZeroBased),
      );
    } catch (err) {
      Logger.error(err instanceof Error ? err.message : String(err));
    }
  }

  constructor(inner: string) {
    super();
    this.inner = inner;
  }

  private isLineVisible(editor: vscode.TextEditor, line: number): boolean {
    return editor.visibleRanges.some((r) => r.start.line <= line && line <= r.end.line);
  }

  /**
   * Currently, VSCode does not provide a direct API to determine the folding state of a region.
   * Therefore, i use revealRange as a workaround to infer whether a fold is open.
   * The caller of this method should optimize the queried ranges to minimize the number of calls.
   */
  private async isProviderFoldOpen(editor: vscode.TextEditor, range: RangePoint): Promise<boolean> {
    const headerLine = range.start;
    const bodyLine = Math.min(range.start + 1, range.end);
    const rangeToReveal = new vscode.Range(headerLine, 0, bodyLine, 0);
    // Ensure the editor has jumped to this range: set selection first so viewport focuses here.
    editor.selection = new vscode.Selection(rangeToReveal.start, rangeToReveal.end);
    editor.revealRange(rangeToReveal, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return this.isLineVisible(editor, bodyLine);
  }

  /** Returns raw folding ranges from the provider (no open/closed filtering). */
  private async getProviderFolds(vimState: VimState): Promise<RangePoint[]> {
    const ranges = await vscode.commands.executeCommand<unknown>(
      this.commandName,
      vimState.editor.document.uri,
    );
    if (!Array.isArray(ranges)) {
      return [];
    }
    return (ranges as FoldingRange[]).map((it) => ({ start: it.start, end: it.end }));
  }

  /**
   * folddoopen: run inner command on open folds, but exclude closed folds (and their nested).
   * folddoclosed: run on closed folds, exclude open folds.
   *
   * include: all "run on" ranges (open for folddoopen, closed for folddoclosed).
   * discardQueue: "exclude" ranges; only compare with last when enqueueing — if current is
   *   inside last, skip (keeps queue as maximal closed/open set, no nested children).
   * Execution: for each range in include, subtract discardQueue to get segments, then run.
   */
  private async getFoldWithDiscard(
    vimState: VimState,
  ): Promise<{ include: RangePoint[]; discardQueue: RangePoint[] }> {
    // Note: The folding regions returned by the VSCode API are ordered by nesting
    // from the outermost fold to the innermost fold.
    const ranges = await this.getProviderFolds(vimState);
    const include: RangePoint[] = [];
    const discardQueue: RangePoint[] = [];

    const isContainedIn = (a: RangePoint, b: RangePoint) => b.start <= a.start && a.end <= b.end;

    for (const range of ranges) {
      const isOpen = await this.isProviderFoldOpen(vimState.editor, range);
      const shouldDiscard =
        (this.folddType === 'folddoopen' && !isOpen) ||
        (this.folddType === 'folddoclosed' && isOpen);

      if (shouldDiscard) {
        const last = discardQueue[discardQueue.length - 1];
        if (last && isContainedIn(range, last)) continue;
        discardQueue.push(range);
        continue;
      }

      include.push(range);
    }

    return { include, discardQueue };
  }

  /** Subtract discard ranges from [a, b] (0-based inclusive), return disjoint segments. */
  private subtractDiscard(
    start: number,
    end: number,
    discardQueue: RangePoint[],
  ): Array<{ start: number; end: number }> {
    const holes = discardQueue
      .filter((d) => d.start <= end && d.end >= start)
      .map((d) => ({ start: Math.max(d.start, start), end: Math.min(d.end, end) }))
      .sort((x, y) => x.start - y.start);
    const segments: Array<{ start: number; end: number }> = [];
    let cur = start;
    for (const h of holes) {
      if (cur <= h.start - 1) {
        segments.push({ start: cur, end: h.start - 1 });
      }
      cur = Math.max(cur, h.end + 1);
    }
    if (cur <= end) {
      segments.push({ start: cur, end });
    }
    return segments;
  }

  override async execute(vimState: VimState): Promise<void> {
    if (this.inner === undefined || this.inner === '') {
      throw VimError.FolddRequiredArgument(this.folddType);
    }

    let command: ExCommand;
    try {
      const parsed = ExCommandLine.parser.tryParse(this.inner);
      command = parsed.command;
    } catch (err) {
      throw VimError.FolddUnsupportedArgument(this.folddType, this.inner);
    }

    // command type check
    const isWhitelisted = folddCommandWhiteList.some((Cmd) => command instanceof Cmd);
    if (!isWhitelisted) {
      throw VimError.FolddUnsupportedArgument(this.folddType, this.inner);
    }

    const { include, discardQueue } = await this.getFoldWithDiscard(vimState);
    for (const range of include) {
      const segments = this.subtractDiscard(range.start, range.end, discardQueue);
      for (const seg of segments) {
        await this.executeInnerWithRange(vimState, command, seg.start, seg.end);
      }
    }
    vimState.cursors = [Cursor.atPosition(vimState.editor.selection.active)];
    return Promise.resolve();
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    if (this.inner === undefined || this.inner === '') {
      throw VimError.FolddRequiredArgument(this.folddType);
    }

    let command: ExCommand;
    try {
      const parsed = ExCommandLine.parser.tryParse(this.inner);
      command = parsed.command;
    } catch (err) {
      throw VimError.FolddUnsupportedArgument(this.folddType, this.inner);
    }

    // command type check
    const isWhitelisted = folddCommandWhiteList.some((Cmd) => command instanceof Cmd);
    if (!isWhitelisted) {
      throw VimError.FolddUnsupportedArgument(this.folddType, this.inner);
    }

    const { start: outerStart, end: outerEnd } = range.resolve(vimState);
    if (outerStart > outerEnd) {
      return Promise.resolve();
    }

    const { include, discardQueue } = await this.getFoldWithDiscard(vimState);
    const len = outerEnd - outerStart + 1;
    // Use the difference algorithm to calculate which lines within the specified range are affected by the fold.
    const diff = new Array<number>(len + 1).fill(0);

    // Build a difference array over [outerStart, outerEnd]: for each segment [interStart, interEnd]
    // we do diff[interStart] += 1 and diff[interEnd+1] -= 1. A prefix sum then gives "how many
    // segments cover this line", so one scan merges overlapping/adjacent segments without sorting.
    for (const r of include) {
      const segments = this.subtractDiscard(r.start, r.end, discardQueue);
      for (const seg of segments) {
        const interStart = Math.max(seg.start, outerStart);
        const interEnd = Math.min(seg.end, outerEnd);
        if (interStart > interEnd) continue;
        diff[interStart - outerStart] += 1;
        diff[interEnd - outerStart + 1] -= 1;
      }
    }

    // Emit merged segments: cover = prefix sum of diff; when cover 0→>0 we start a segment,
    // when cover >0→0 we end it and run the inner command on that range.
    let cover = 0;
    let segStart: number | undefined;
    for (let i = 0; i < len; i++) {
      cover += diff[i];

      if (cover > 0 && segStart === undefined) {
        segStart = outerStart + i;
      } else if (cover <= 0 && segStart !== undefined) {
        const segEnd = outerStart + i - 1;
        await this.executeInnerWithRange(vimState, command, segStart, segEnd);
        segStart = undefined;
      }
    }

    if (segStart !== undefined) {
      await this.executeInnerWithRange(vimState, command, segStart, outerEnd);
    }
    vimState.cursors = [Cursor.atPosition(vimState.editor.selection.active)];
    return Promise.resolve();
  }
}

export class ExFolddoopenCommand extends AbstractExFolddCommand {
  override folddType: 'folddoopen' | 'folddoclosed' = 'folddoopen';
  public static readonly argParser: Parser<ExFolddoopenCommand> = optWhitespace
    .then(all)
    .map((inner) => new ExFolddoopenCommand(inner.trim()));

  constructor(innerCommand: string) {
    super(innerCommand);
  }
}

export class ExFolddoclosedCommand extends AbstractExFolddCommand {
  override folddType: 'folddoopen' | 'folddoclosed' = 'folddoclosed';
  public static readonly argParser: Parser<ExFolddoclosedCommand> = optWhitespace
    .then(all)
    .map((inner) => new ExFolddoclosedCommand(inner.trim()));

  constructor(innerCommand: string) {
    super(innerCommand);
  }
}
