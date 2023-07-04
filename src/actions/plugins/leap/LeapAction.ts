import { Mode } from '../../../mode/mode';
import { BaseCommand, RegisterAction } from '../../base';
import { Position } from 'vscode';
import { VimState } from '../../../state/vimState';
import { configuration } from '../../../configuration/configuration';
import { LeapSearchDirection, getLeapInstance, initLeap } from './leap';
import { getMatches, generateMarkerRegex, generatePrepareRegex } from './match';
import { StatusBar } from '../../../statusBar';
import { Marker } from './Marker';
import { VimError, ErrorCode } from '../../../error';

@RegisterAction
export class LeapPrepareAction extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [
    ['s', '<character>'],
    ['S', '<character>'],
  ];

  public override doesActionApply(vimState: VimState, keysPressed: string[]) {
    return super.doesActionApply(vimState, keysPressed) && configuration.leap.enable;
  }

  public override async exec(cursorPosition: Position, vimState: VimState): Promise<void> {
    if (!configuration.leap.enable) return;

    if (this.keysPressed[1] === '\n') {
      this.execRepeatLastSearch(vimState);
    } else {
      await this.execPrepare(cursorPosition, vimState);
    }
  }

  private async execPrepare(cursorPosition: Position, vimState: VimState) {
    initLeap(vimState);

    const direction = this.getDirection();
    const firstSearchString = this.keysPressed[1];

    const leap = getLeapInstance();
    leap.direction = direction;
    leap.firstSearchString = firstSearchString;
    leap.searchMode = this.keysPressed[0];

    leap.createMarkers(
      getMatches(generatePrepareRegex(firstSearchString), direction, cursorPosition, vimState)
    );

    leap.showMarkers();
    await vimState.setCurrentMode(Mode.LeapPrepareMode);
  }

  private execRepeatLastSearch(vimState: VimState) {
    const leap = getLeapInstance();
    if (leap.leapAction) {
      leap.isRepeatLastSearch = true;
      leap.direction = this.getDirection();
      leap.leapAction.fire();
    } else {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.LeapNoPreviousSearch));
    }
  }

  protected getDirection() {
    if (configuration.leap.bidirectionalSearch) {
      return LeapSearchDirection.Bidirectional;
    }
    return this.keysPressed[0] === 's' ? LeapSearchDirection.Backward : LeapSearchDirection.Forward;
  }
}

@RegisterAction
export class LeapVisualPrepareAction extends LeapPrepareAction {
  override modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  override keys = [
    ['x', '<character>'],
    ['X', '<character>'],
  ];

  override getDirection() {
    if (configuration.leap.bidirectionalSearch) {
      return LeapSearchDirection.Bidirectional;
    }
    return this.keysPressed[0] === 'x' ? LeapSearchDirection.Backward : LeapSearchDirection.Forward;
  }
}
@RegisterAction
export class LeapAction extends BaseCommand {
  modes = [Mode.LeapPrepareMode];
  keys = ['<character>'];
  override isJump = true;
  private vimState!: VimState;
  private searchString: string = '';
  public override async exec(cursorPosition: Position, vimState: VimState): Promise<void> {
    if (!configuration.leap.enable) return;
    this.vimState = vimState;
    const leap = getLeapInstance();
    this.searchString = leap.firstSearchString + this.keysPressed[0];
    const markers: Marker[] = this.getMarkers(cursorPosition);

    if (markers.length === 0) {
      await this.handleNoFoundMarkers();
      return;
    }

    // When the leapAction is executed, it needs to be logged
    // This is to repeat the last search command
    // As long as it is recorded, it means that the search was successfully executed once.
    // As long as the search has been executed successfully, it will be ok when we execute "repeat last search".
    leap.leapAction = this;

    if (markers.length === 1) {
      await this.handleOneMarkers(markers[0]);
      return;
    }

    await this.handleMultipleMarkers();
  }

  private async handleMultipleMarkers() {
    getLeapInstance().keepMarkersBySearchString(this.searchString);
    await this.vimState.setCurrentMode(Mode.LeapMode);
  }

  private async handleOneMarkers(marker: Marker) {
    const leap = getLeapInstance();
    leap.changeCursorStopPosition(marker.matchPosition);
    leap.cleanupMarkers();
    await this.vimState.setCurrentMode(leap.previousMode);
  }

  private async handleNoFoundMarkers() {
    StatusBar.displayError(
      this.vimState,
      VimError.fromCode(ErrorCode.LeapNoFoundSearchString, this.searchString)
    );
    const leap = getLeapInstance();
    leap.cleanupMarkers();
    await this.vimState.setCurrentMode(leap.previousMode);
  }

  private getMarkers(cursorPosition: Position) {
    const leap = getLeapInstance();

    if (leap.isRepeatLastSearch) {
      const matches = getMatches(
        generateMarkerRegex(this.searchString),
        leap.direction!,
        cursorPosition,
        this.vimState
      );
      leap.createMarkers(matches);
      leap.showMarkers();
      return leap.markers;
    } else {
      return leap.findMarkersBySearchString(this.searchString);
    }
  }

  public fire() {
    this.exec(this.vimState.cursorStopPosition, this.vimState);
  }
}
