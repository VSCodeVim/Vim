import { Mode } from '../../../mode/mode';
import { Match } from './match';
import { Marker, createMarker, generateMarkerNames } from './Marker';
import { VimState } from '../../../state/vimState';
import { LeapAction } from './LeapAction';
import { Position } from 'vscode';

export enum LeapSearchDirection {
  Forward = -1,
  Backward = 1,
}

export class Leap {
  markers: Marker[] = [];
  vimState: VimState;
  previousMode!: Mode;
  isRepeatLastSearch: boolean = false;
  direction?: LeapSearchDirection;
  leapAction?: LeapAction;
  firstSearchString?: string;

  constructor(vimState: VimState) {
    this.vimState = vimState;
  }

  public createMarkers(matches: Match[]) {
    this.markers = matches.map((match) => {
      return createMarker(match, this.vimState.editor);
    });

    this.setMarkersName();

    return this.markers;
  }

  private setMarkersName() {
    const map: { [key: string]: Marker[] } = {};

    this.markers.forEach((marker) => {
      const key = marker.searchString;
      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(marker);
    });

    Object.keys(map).forEach((key) => {
      const group = map[key];
      const markerNames = generateMarkerNames(group.length);
      group.forEach((marker, index) => {
        marker.label = markerNames[index];
      });
    });
  }

  public findMarkerByName(name: string) {
    return this.markers.find((marker: Marker) => {
      return marker.label === name;
    });
  }

  public findMarkersBySearchString(searchString: string) {
    return this.markers.filter((marker) => {
      return marker.searchString === searchString;
    });
  }

  public keepMarkersByPrefix(prefix: string) {
    this.markers = this.markers
      .map((marker) => {
        if (marker.prefix !== prefix) marker.dispose();
        return marker;
      })
      .filter((marker) => {
        return marker.prefix === prefix;
      });
  }

  public keepMarkersBySearchString(searchString: string) {
    this.markers = this.markers
      .map((marker) => {
        if (marker.searchString !== searchString) marker.dispose();
        return marker;
      })
      .filter((marker) => {
        return marker.searchString === searchString;
      });
  }

  public deletePrefixOfMarkers() {
    this.markers.forEach((marker: Marker) => {
      marker.deletePrefix();
      marker.update();
    });
  }

  public isPrefixOfMarker(character: string) {
    return this.markers.some((marker) => {
      return marker.prefix === character;
    });
  }

  public cleanupMarkers() {
    if (this.markers.length === 0) return;
    this.markers.forEach((marker) => {
      marker.dispose();
    });

    this.markers = [];
  }

  public showMarkers() {
    this.markers.forEach((marker) => {
      marker.show();
    });
  }

  public changeCursorStopPosition(position: Position) {
    const isVisualModel =
      this.vimState.leap.previousMode === Mode.Visual ||
      this.vimState.leap.previousMode === Mode.VisualLine ||
      this.vimState.leap.previousMode === Mode.VisualBlock;

    if (isVisualModel) {
      if (this.vimState.leap.direction === LeapSearchDirection.Backward) {
        let line;
        let character;
        const isFirstCharacter = position.character === 0;
        if (isFirstCharacter) {
          line = position.line - 1;
          character = this.vimState.editor.document.lineAt(position.line - 1).range.end.character;
        } else {
          line = position.line;
          character = position.character - 1;
        }
        this.vimState.cursorStopPosition = new Position(line, character);
      } else {
        this.vimState.cursorStopPosition = new Position(position.line, position.character + 2);
      }
    } else {
      this.vimState.cursorStopPosition = position;
    }
  }
}

export function createLeap(
  vimState: VimState,
  direction: LeapSearchDirection = LeapSearchDirection.Backward,
  firstSearchString: string = ''
) {
  const leap = new Leap(vimState);
  leap.direction = direction;
  leap.firstSearchString = firstSearchString;

  return leap;
}
