import { Position } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { BaseCommand, RegisterAction } from '../base';

@RegisterAction
export class Undo extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['u'];
  // we support a count to undo by this setting
  override runsOnceForEachCountPrefix = true;
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const cursors = await vimState.historyTracker.goBackHistoryStep();

    if (cursors === undefined) {
      StatusBar.setText(vimState, 'Already at oldest change');
    } else {
      vimState.cursors = cursors;
    }
  }
}

@RegisterAction
class UndoOnLine extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['U'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const newPosition = await vimState.historyTracker.goBackHistoryStepsOnLine();

    if (newPosition !== undefined) {
      vimState.cursors = [Cursor.atPosition(newPosition)];
    }
  }
}

@RegisterAction
export class Redo extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<C-r>'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const cursors = await vimState.historyTracker.goForwardHistoryStep();

    if (cursors === undefined) {
      StatusBar.setText(vimState, 'Already at newest change');
    } else {
      vimState.cursors = cursors;
    }
  }
}
