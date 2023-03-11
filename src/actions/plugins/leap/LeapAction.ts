import { Mode } from '../../../mode/mode';
import { BaseCommand, KeypressState, RegisterAction } from '../../base';
import { Position } from 'vscode';
import { VimState } from '../../../state/vimState';
import { configuration } from '../../../configuration/configuration';
import { LeapSearchDirection, createLeap } from './leap';
import {
  getMatches,
  generateMarkerRegex,
  generatePrepareRegex,
  getBidirectionalSearchMatches,
} from './match';
import { StatusBar } from '../../../statusBar';
import { Marker } from './Marker';
import { VimError, ErrorCode } from '../../../error';
import { Match } from './match';

@RegisterAction
export class LeapPrepareAction extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [
    ['s', '<character>'],
    ['S', '<character>'],
  ];

  public override doesActionApply(vimState: VimState, keysPressed: string[]) {
    return super.doesActionApply(vimState, keysPressed) && configuration.leap;
  }

  public override async exec(cursorPosition: Position, vimState: VimState): Promise<void> {
    if (!configuration.leap) return;

    if (this.keysPressed[1] === '\n' && !configuration.leapBidirectionalSearch) {
      this.execRepeatLastSearch(vimState);
    } else {
      await this.execPrepare(cursorPosition, vimState);
    }
  }

  private async execPrepare(cursorPosition: Position, vimState: VimState) {
    const direction = this.getDirection();
    const firstSearchString = this.keysPressed[1];

    const leap = createLeap(vimState, direction, firstSearchString);
    leap.searchMode = this.keysPressed[0];
    vimState.leap = leap;
    vimState.leap.previousMode = vimState.currentMode;

    let matches: Match[] = [];
    if (configuration.leapBidirectionalSearch) {
      matches = getBidirectionalSearchMatches(
        generatePrepareRegex(firstSearchString),
        cursorPosition,
        vimState.document,
        vimState.editor.visibleRanges[0]
      );
    } else {
      matches = getMatches(
        generatePrepareRegex(firstSearchString),
        direction,
        cursorPosition,
        vimState.document,
        vimState.editor.visibleRanges[0]
      );
    }

    vimState.leap.createMarkers(matches);
    vimState.leap.showMarkers();
    await vimState.setCurrentMode(Mode.LeapPrepareMode);
  }

  private execRepeatLastSearch(vimState: VimState) {
    if (vimState.leap?.leapAction) {
      vimState.leap.isRepeatLastSearch = true;
      vimState.leap.direction = this.getDirection();
      vimState.leap.leapAction.fire();
    } else {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.LeapNoPreviousSearch));
    }
  }

  protected getDirection() {
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
    if (!configuration.leap) return;
    this.vimState = vimState;
    this.searchString = vimState.leap.firstSearchString + this.keysPressed[0];
    const markers: Marker[] = this.getMarkers(cursorPosition);

    if (markers.length === 0) {
      await this.handleNoFoundMarkers();
      return;
    }

    // When the leapAction is executed, it needs to be logged
    // This is to repeat the last search command
    // As long as it is recorded, it means that the search was successfully executed once.
    // As long as the search has been executed successfully, it will be ok when we execute "repeat last search".
    vimState.leap.leapAction = this;

    if (markers.length === 1) {
      await this.handleOneMarkers(markers[0]);
      return;
    }

    await this.handleMultipleMarkers();
  }
  private async handleMultipleMarkers() {
    this.vimState.leap.keepMarkersBySearchString(this.searchString);
    await this.vimState.setCurrentMode(Mode.LeapMode);
  }

  private async handleOneMarkers(marker: Marker) {
    this.vimState.leap.changeCursorStopPosition(marker.matchPosition);
    this.vimState.leap.cleanupMarkers();
    await this.vimState.setCurrentMode(this.vimState.leap.previousMode);
  }

  private async handleNoFoundMarkers() {
    StatusBar.displayError(
      this.vimState,
      VimError.fromCode(ErrorCode.LeapNoFoundSearchString, this.searchString)
    );
    this.vimState.leap.cleanupMarkers();
    await this.vimState.setCurrentMode(this.vimState.leap.previousMode);
  }

  private getMarkers(cursorPosition: Position) {
    if (this.vimState.leap.isRepeatLastSearch) {
      const matches = getMatches(
        generateMarkerRegex(this.searchString),
        this.vimState.leap.direction!,
        cursorPosition,
        this.vimState.document,
        this.vimState.editor.visibleRanges[0]
      );
      this.vimState.leap.createMarkers(matches);
      this.vimState.leap.showMarkers();
      return this.vimState.leap.markers;
    } else {
      return this.vimState.leap.findMarkersBySearchString(this.searchString);
    }
  }

  public fire() {
    this.exec(this.vimState.cursorStopPosition, this.vimState);
  }
}
