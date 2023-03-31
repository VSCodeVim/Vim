import { Position } from 'vscode';
import { BaseCommand, RegisterAction } from '../../base';
import { VimState } from '../../../state/vimState';
import { Mode } from '../../../mode/mode';
import { Marker } from './Marker';

@RegisterAction
export class MoveLeapAction extends BaseCommand {
  modes = [Mode.LeapMode];
  keys = ['<character>'];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const searchString = this.keysPressed[0];
    if (!searchString) return;

    const marker = vimState.leap.findMarkerByName(searchString);
    if (marker) {
      await this.handleDirectFoundMarker(marker, vimState);
    } else if (vimState.leap.isPrefixOfMarker(searchString)) {
      this.handleIsPrefixOfMarker(searchString, vimState);
    } else {
      await this.handleNoFoundMarker(vimState);
    }
  }

  private async handleDirectFoundMarker(marker: Marker, vimState: VimState) {
    vimState.leap.cleanupMarkers();
    vimState.leap.changeCursorStopPosition(marker.matchPosition);
    await vimState.setCurrentMode(vimState.leap.previousMode);
  }

  private async handleIsPrefixOfMarker(searchString: string, vimState: VimState) {
    vimState.leap.keepMarkersByPrefix(searchString);
    vimState.leap.deletePrefixOfMarkers();
  }

  private async handleNoFoundMarker(vimState: VimState) {
    vimState.leap.cleanupMarkers();
    await vimState.setCurrentMode(vimState.leap.previousMode);
  }
}

@RegisterAction
class CommandEscLeapMode extends BaseCommand {
  modes = [Mode.LeapMode];
  keys = ['<Esc>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.leap.cleanupMarkers();
    await vimState.setCurrentMode(vimState.leap.previousMode);
  }
}

@RegisterAction
class CommandEscLeapPrepareMode extends BaseCommand {
  modes = [Mode.LeapPrepareMode];
  keys = ['<Esc>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.leap.cleanupMarkers();
    await vimState.setCurrentMode(vimState.leap.previousMode);
  }
}
