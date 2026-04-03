import { Position } from 'vscode';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
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
    await vimState.historyTracker.goBackHistoryStep();
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
    await vimState.historyTracker.goBackHistoryStepsOnLine();
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
    await vimState.historyTracker.goForwardHistoryStep();
  }
}
