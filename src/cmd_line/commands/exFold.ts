import * as vscode from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';

abstract class AbstractExFoldCommand extends ExCommand {
  abstract commandName: string;

  override async execute(vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand(this.commandName, {
      direction: 'up',
      levels: 1,
    });
    await vimState.setCurrentMode(Mode.Normal);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { start, end } = range.resolveToRange(vimState);

    vimState.recordedState.transformer.vscodeCommand(this.commandName, {
      selectionLines: Array.from({ length: end.line - start.line + 1 }, (_, i) => start.line + i),
      direction: 'up',
      levels: 1,
    });
    await vimState.setCurrentMode(Mode.Normal);
  }
}

export class ExFoldCommand extends ExCommand {
  readonly commandName = 'editor.createFoldingRangeFromSelection';

  override execute(vimState: VimState): Promise<void> {
    // do nothing
    return Promise.resolve();
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
}

export class ExFoldopenCommand extends AbstractExFoldCommand {
  readonly commandName = 'editor.unfold';
}
