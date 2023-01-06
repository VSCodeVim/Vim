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

  private vimState!: VimState;
  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const searchString = this.keysPressed[0];
    if (!searchString) return;
    this.vimState = vimState;

    const marker = vimState.leap.findMarkerByName(searchString);
    if (marker) {
      await this.handleDirectFoundMarker(marker);
    } else if (vimState.leap.isPrefixOfMarker(searchString)) {
      this.handleIsPrefixOfMarker(searchString);
    } else {
      await this.handleNoFoundMarker();
    }
  }

  private async handleDirectFoundMarker(marker: Marker) {
    this.vimState.leap.cleanupMarkers();
    this.vimState.cursorStopPosition = marker.matchPosition;
    await this.vimState.setCurrentMode(this.vimState.leap.previousMode);
  }

  private async handleIsPrefixOfMarker(searchString: string) {
    this.vimState.leap.keepMarkersByPrefix(searchString);
    this.vimState.leap.deletePrefixOfMarkers();
  }

  private async handleNoFoundMarker() {
    this.vimState.leap.cleanupMarkers();
    await this.vimState.setCurrentMode(this.vimState.leap.previousMode);
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
