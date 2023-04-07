import { Position } from 'vscode';
import { BaseCommand, RegisterAction } from '../../base';
import { VimState } from '../../../state/vimState';
import { Mode } from '../../../mode/mode';
import { Marker } from './Marker';
import { getLeapInstance } from './leap';

@RegisterAction
export class MoveLeapAction extends BaseCommand {
  modes = [Mode.LeapMode];
  keys = ['<character>'];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const searchString = this.keysPressed[0];
    if (!searchString) return;
    const leap = getLeapInstance();

    const marker = leap.findMarkerByName(searchString);
    if (marker) {
      await this.handleDirectFoundMarker(marker, vimState);
    } else if (leap.isPrefixOfMarker(searchString)) {
      this.handleIsPrefixOfMarker(searchString, vimState);
    } else {
      await this.handleNoFoundMarker(vimState);
    }
  }

  private async handleDirectFoundMarker(marker: Marker, vimState: VimState) {
    const leap = getLeapInstance();
    leap.cleanupMarkers();
    leap.changeCursorStopPosition(marker.matchPosition);
    await vimState.setCurrentMode(leap.previousMode);
  }

  private async handleIsPrefixOfMarker(searchString: string, vimState: VimState) {
    const leap = getLeapInstance();
    leap.keepMarkersByPrefix(searchString);
    leap.deletePrefixOfMarkers();
  }

  private async handleNoFoundMarker(vimState: VimState) {
    const leap = getLeapInstance();
    leap.cleanupMarkers();
    await vimState.setCurrentMode(leap.previousMode);
  }
}

@RegisterAction
class CommandEscLeapMode extends BaseCommand {
  modes = [Mode.LeapMode];
  keys = ['<Esc>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const leap = getLeapInstance();
    leap.cleanupMarkers();
    await vimState.setCurrentMode(leap.previousMode);
  }
}

@RegisterAction
class CommandEscLeapPrepareMode extends BaseCommand {
  modes = [Mode.LeapPrepareMode];
  keys = ['<Esc>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const leap = getLeapInstance();
    leap.cleanupMarkers();
    await vimState.setCurrentMode(leap.previousMode);
  }
}
