import { Cursor } from 'src/common/motion/cursor';
import { Position } from 'vscode';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { BaseCommand, RegisterAction } from '../base';

@RegisterAction
class EnterVisualMode extends BaseCommand {
  modes = [Mode.Normal, Mode.VisualLine, Mode.VisualBlock];
  keys = ['v'];
  override isCompleteAction = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.Normal && vimState.recordedState.count > 1) {
      vimState.cursorStopPosition = position.getRight(vimState.recordedState.count - 1);
    }
    await vimState.setCurrentMode(Mode.Visual);
  }
}

@RegisterAction
class ExitVisualMode extends BaseCommand {
  modes = [Mode.Visual];
  keys = ['v'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class EnterVisualLineMode extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  keys = ['V'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.Normal && vimState.recordedState.count > 1) {
      vimState.cursorStopPosition = position.getDown(vimState.recordedState.count - 1);
    }
    await vimState.setCurrentMode(Mode.VisualLine);
  }
}

@RegisterAction
class ExitVisualLineMode extends BaseCommand {
  modes = [Mode.VisualLine];
  keys = ['V'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class EnterVisualBlockMode extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-v>'], ['<C-q>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.Normal && vimState.recordedState.count > 1) {
      vimState.cursorStopPosition = position.getRight(vimState.recordedState.count - 1);
    }
    await vimState.setCurrentMode(Mode.VisualBlock);
  }
}

@RegisterAction
class ExitVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['<C-v>'], ['<C-q>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class RestoreVisualSelection extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'v'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const lastVisualSelection = vimState.lastVisualSelection;
    if (lastVisualSelection === undefined) {
      return;
    }

    let { start, end, mode } = lastVisualSelection;
    const isCurrentlyHandlingSecondaryCursor = this.multicursorIndex && this.multicursorIndex > 0;
    if (isCurrentlyHandlingSecondaryCursor) {
      const secondarySelection = this.getSecondarySelectionByMultiCursorIndex(
        this.multicursorIndex,
        lastVisualSelection.multiCursorIndexSecondaryCursorMap,
      );
      if (secondarySelection) {
        start = secondarySelection.start;
        end = secondarySelection.stop;
      }
    }
    if (mode !== Mode.Visual || !start.isEqual(end)) {
      if (end.line <= vimState.document.lineCount - 1) {
        if (mode === Mode.Visual && start.isBefore(end)) {
          end = end.getLeftThroughLineBreaks(true);
        }

        await vimState.setCurrentMode(mode);
        vimState.cursorStartPosition = start;
        vimState.cursorStopPosition = end;
      }
    }
  }

  getSecondarySelectionByMultiCursorIndex(
    multiCursorIndex: number | undefined,
    multiCursorIndexSecondaryCursorMap: Map<number, Cursor> | undefined,
  ): Cursor | undefined {
    if (!multiCursorIndex) {
      return undefined;
    }
    if (!multiCursorIndexSecondaryCursorMap) {
      return undefined;
    }
    return multiCursorIndexSecondaryCursorMap.get(multiCursorIndex);
  }
}
