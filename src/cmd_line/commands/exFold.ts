import { all, optWhitespace, Parser } from 'parsimmon';
import * as vscode from 'vscode';
import { FoldingRange } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { VimError } from '../../error';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
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

  constructor(inner: string) {
    super();
    this.inner = inner;
  }

  private isLineVisible(editor: vscode.TextEditor, line: number): boolean {
    return editor.visibleRanges.some((r) => r.start.line <= line && line <= r.end.line);
  }

  /**
   * Heuristic (provider folds only): treat fold as "open" if its body line (start+1)
   * is visible after ensuring the header line is in the viewport.
   */
  private async isProviderFoldOpen(editor: vscode.TextEditor, range: RangePoint): Promise<boolean> {
    const headerLine = range.start;
    const bodyLine = Math.min(range.start + 1, range.end);
    editor.revealRange(
      new vscode.Range(headerLine, 0, headerLine, 0),
      vscode.TextEditorRevealType.InCenterIfOutsideViewport,
    );
    // allow visibleRanges to update
    await new Promise((resolve) => setTimeout(resolve, 0));
    return this.isLineVisible(editor, bodyLine);
  }

  private async getFold(vimState: VimState): Promise<RangePoint[]> {
    const ranges = await vscode.commands.executeCommand<unknown>(
      this.commandName,
      vimState.editor.document.uri,
    );
    if (!Array.isArray(ranges)) {
      return [];
    }
    return (ranges as FoldingRange[]).map((it) => ({
      start: it.start,
      end: it.end,
    }));
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
      // Only treat parse errors as "unsupported inner command".
      throw VimError.FolddUnsupportedArgument(this.folddType, this.inner);
    }

    // command type check (not part of parse try/catch)
    const isWhitelisted = folddCommandWhiteList.some((Cmd) => command instanceof Cmd);
    if (!isWhitelisted) {
      throw VimError.FolddUnsupportedArgument(this.folddType, this.inner);
    }

    const rangePoints = await this.getFold(vimState);
    for (const range of rangePoints) {
      const isOpen = await this.isProviderFoldOpen(vimState.editor, range);

      // For `folddoopen`: only apply the inner command to folds that are currently open.
      // If this fold is closed, skip it.
      if (this.folddType === 'folddoopen' && !isOpen) {
        continue;
      }
      // For `folddoclosed`: only apply the inner command to folds that are currently closed.
      // If this fold is open, skip it.
      if (this.folddType === 'folddoclosed' && isOpen) {
        continue;
      }

      // pass every fold area to line range
      await command.executeWithRange(
        vimState,
        new LineRange(
          new Address({ type: 'number', num: range.start + 1 }),
          ',',
          new Address({ type: 'number', num: range.end + 1 }),
        ),
      );
    }
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
      // Only treat parse errors as "unsupported inner command".
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

    // Coverage diff array over [outerStart, outerEnd] (0-based, inclusive).
    // For each eligible fold intersection [a,b], we do:
    //   diff[a] += 1; diff[b+1] -= 1
    // Then during the emit scan:
    //   cover(i) = sum(diff[0..i])
    // cover(i) > 0 means line (outerStart+i) belongs to the union of eligible intersections.
    const len = outerEnd - outerStart + 1;
    const diff = new Array<number>(len + 1).fill(0);

    const rangePoints = await this.getFold(vimState);
    for (const fold of rangePoints) {
      // Quick intersect check first.
      const interStart = Math.max(fold.start, outerStart);
      const interEnd = Math.min(fold.end, outerEnd);
      if (interStart > interEnd) {
        continue;
      }

      const isOpen = await this.isProviderFoldOpen(vimState.editor, fold);

      if (this.folddType === 'folddoopen' && !isOpen) {
        continue;
      }
      if (this.folddType === 'folddoclosed' && isOpen) {
        continue;
      }

      // Add this intersection [interStart, interEnd] into the union coverage.
      diff[interStart - outerStart] += 1;
      diff[interEnd - outerStart + 1] -= 1; // +1 makes it inclusive
    }

    // Emit merged segments (maximal contiguous ranges) where cover > 0.
    // Each segment is executed once via command.executeWithRange.
    let cover = 0;
    let segStart: number | undefined;
    for (let i = 0; i < len; i++) {
      cover += diff[i];

      if (cover > 0 && segStart === undefined) {
        segStart = outerStart + i;
      } else if (cover <= 0 && segStart !== undefined) {
        const segEnd = outerStart + i - 1;
        await command.executeWithRange(
          vimState,
          new LineRange(
            new Address({ type: 'number', num: segStart + 1 }),
            ',',
            new Address({ type: 'number', num: segEnd + 1 }),
          ),
        );
        segStart = undefined;
      }
    }

    if (segStart !== undefined) {
      await command.executeWithRange(
        vimState,
        new LineRange(
          new Address({ type: 'number', num: segStart + 1 }),
          ',',
          new Address({ type: 'number', num: outerEnd + 1 }),
        ),
      );
    }

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
