import * as vscode from 'vscode';

import { Position } from './../../../common/motion/position';
import { Configuration } from './../../../configuration/configuration';
import { TextEditor } from './../../../textEditor';
import { EasyMotionSearchAction } from './easymotion.cmd';
import { MarkerGenerator } from './markerGenerator';

export class EasyMotion {
  /**
   * Refers to the accumulated keys for depth navigation
   */
  public accumulation = '';

  public searchAction: EasyMotionSearchAction;

  /**
   * Array of all markers and decorations
   */
  private _markers: EasyMotion.Marker[];
  private visibleMarkers: EasyMotion.Marker[]; // Array of currently showing markers
  private decorations: vscode.DecorationOptions[][];

  /**
   * TODO: For future motions
   */
  private static specialCharactersRegex: RegExp = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;

  /**
   * Caches for decorations
   */
  private static decorationTypeCache: vscode.TextEditorDecorationType[] = [];

  public get markers() {
    return this._markers;
  }

  /**
   * Mode to return to after attempting easymotion
   */
  public previousMode: number;

  constructor() {
    this._markers = [];
    this.visibleMarkers = [];
    this.decorations = [];
  }

  public static createMarkerGenerator(matchesCount: number): MarkerGenerator {
    return new MarkerGenerator(matchesCount);
  }

  /**
   * Create and cache decoration types for different marker lengths
   */
  public static getDecorationType(length: number): vscode.TextEditorDecorationType {
    const cache = this.decorationTypeCache[length];
    if (cache) {
      return cache;
    } else {
      const width = length * 8;
      const type = vscode.window.createTextEditorDecorationType({
        after: {
          margin: `0 0 0 -${width}px`,
          height: `14px`,
          // This is a tricky part. Set position and z-index property along with width
          // to bring markers to front
          width: `${width}px; position:absoulute; z-index:99;`,
        },
      });

      this.decorationTypeCache[length] = type;

      return type;
    }
  }

  /**
   * Clear all decorations
   */
  public clearDecorations() {
    const editor = vscode.window.activeTextEditor!;
    for (let i = 1; i <= this.decorations.length; i++) {
      editor.setDecorations(EasyMotion.getDecorationType(i), []);
    }
  }

  /**
   * Clear all markers
   */
  public clearMarkers() {
    this._markers = [];
    this.visibleMarkers = [];
  }

  public addMarker(marker: EasyMotion.Marker) {
    this._markers.push(marker);
  }

  public getMarker(index: number): EasyMotion.Marker {
    return this._markers[index];
  }

  /**
   * Find markers beginning with a string
   */
  public findMarkers(nail: string, onlyVisible: boolean): EasyMotion.Marker[] {
    const markers = onlyVisible ? this.visibleMarkers : this._markers;
    return markers.filter(marker => marker.name.startsWith(nail));
  }

  /**
   * Search and sort using the index of a match compared to the index of position (usually the cursor)
   */
  public sortedSearch(
    position: Position,
    search: string | RegExp = '',
    options: EasyMotion.SearchOptions = {}
  ): EasyMotion.Match[] {
    const regex =
      typeof search === 'string'
        ? new RegExp(search.replace(EasyMotion.specialCharactersRegex, '\\$&'), 'g')
        : search;

    const matches: EasyMotion.Match[] = [];

    // Cursor index refers to the index of the marker that is on or to the right of the cursor
    let cursorIndex = position.character;
    let prevMatch: EasyMotion.Match | undefined;

    // Calculate the min/max bounds for the search
    const lineCount = TextEditor.getLineCount();
    const lineMin = options.min ? Math.max(options.min.line, 0) : 0;
    const lineMax = options.max ? Math.min(options.max.line + 1, lineCount) : lineCount;

    outer: for (let lineIdx = lineMin; lineIdx < lineMax; lineIdx++) {
      const line = TextEditor.getLineAt(new Position(lineIdx, 0)).text;
      let result = regex.exec(line);

      while (result) {
        if (matches.length >= 1000) {
          break outer;
        } else {
          const pos = new Position(lineIdx, result.index);

          // Check if match is within bounds
          if (
            (options.min && pos.isBefore(options.min)) ||
            (options.max && pos.isAfter(options.max)) ||
            Math.abs(pos.line - position.line) > 100
          ) {
            // Stop searching after 100 lines in both directions
            result = regex.exec(line);
          } else {
            // Update cursor index to the marker on the right side of the cursor
            if (!prevMatch || prevMatch.position.isBefore(position)) {
              cursorIndex = matches.length;
            }
            // Matches on the cursor position should be ignored
            if (pos.isEqual(position)) {
              result = regex.exec(line);
            } else {
              prevMatch = new EasyMotion.Match(pos, result[0], matches.length);
              matches.push(prevMatch);
              result = regex.exec(line);
            }
          }
        }
      }
    }

    // Sort by the index distance from the cursor index
    matches.sort((a: EasyMotion.Match, b: EasyMotion.Match): number => {
      const absDiffA = computeAboluteDiff(a.index);
      const absDiffB = computeAboluteDiff(b.index);
      return absDiffA - absDiffB;

      function computeAboluteDiff(matchIndex: number) {
        const absDiff = Math.abs(cursorIndex - matchIndex);
        // Prioritize the matches on the right side of the cursor index
        return matchIndex < cursorIndex ? absDiff - 0.5 : absDiff;
      }
    });

    return matches;
  }

  private themeColorApiSupported(): boolean {
    // Theme color is available from version 1.12.
    const vscodeVersionAsNumber = parseInt(vscode.version.replace(/\./g, ''), 10);
    return vscodeVersionAsNumber >= 1120;
  }

  private getMarkerColor(
    customizedValue: string,
    defaultValue: string | vscode.ThemeColor,
    themeColorId: string
  ): string | vscode.ThemeColor {
    if (!this.themeColorApiSupported()) {
      return customizedValue || defaultValue;
    } else {
      if (customizedValue) {
        return customizedValue;
      } else {
        return new vscode.ThemeColor(themeColorId);
      }
    }
  }

  private getEasymotionMarkerBackgroundColor() {
    return this.getMarkerColor(
      Configuration.easymotionMarkerBackgroundColor,
      '#000',
      'activityBarBadge.background'
    );
  }

  private getEasymotionMarkerForegroundColorOneChar() {
    return this.getMarkerColor(
      Configuration.easymotionMarkerForegroundColorOneChar,
      '#f00',
      'activityBarBadge.foreground'
    );
  }

  private getEasymotionMarkerForegroundColorTwoChar() {
    return this.getMarkerColor(
      Configuration.easymotionMarkerForegroundColorTwoChar,
      '#ffa500',
      'activityBarBadge.foreground'
    );
  }

  public updateDecorations() {
    this.clearDecorations();

    this.visibleMarkers = [];
    this.decorations = [];

    // Ignore markers that do not start with the accumulated depth level
    for (const marker of this._markers.filter(m => m.name.startsWith(this.accumulation))) {
      const pos = marker.position;
      // Get keys after the depth we're at
      const keystroke = marker.name.substr(this.accumulation.length);

      if (!this.decorations[keystroke.length]) {
        this.decorations[keystroke.length] = [];
      }

      const fontColor =
        keystroke.length > 1
          ? this.getEasymotionMarkerForegroundColorTwoChar()
          : this.getEasymotionMarkerForegroundColorOneChar();

      const renderOptions: vscode.ThemableDecorationInstanceRenderOptions = {
        after: {
          contentText: keystroke,
          backgroundColor: this.getEasymotionMarkerBackgroundColor(),
          height: `${Configuration.easymotionMarkerHeight}px`,
          width: `${keystroke.length * Configuration.easymotionMarkerWidthPerChar}px`,
          color: fontColor,
          textDecoration: `none;
          font-family: ${Configuration.easymotionMarkerFontFamily};
          font-size: ${Configuration.easymotionMarkerFontSize}px;
          font-weight: ${Configuration.easymotionMarkerFontWeight};
          position: absolute;
          z-index: 99;
          bottom: ${Configuration.easymotionMarkerYOffset}px`,
        },
      };
      // Position should be offsetted by the length of the keystroke to prevent hiding behind the gutter
      const charPos = pos.character + 1 + (keystroke.length - 1);
      this.decorations[keystroke.length].push({
        range: new vscode.Range(pos.line, charPos, pos.line, charPos),
        renderOptions: {
          dark: renderOptions,
          light: renderOptions,
        },
      });

      this.visibleMarkers.push(marker);
    }

    // Set the decorations for all the different marker lengths
    const editor = vscode.window.activeTextEditor!;
    for (let j = 1; j < this.decorations.length; j++) {
      if (this.decorations[j]) {
        editor.setDecorations(EasyMotion.getDecorationType(j), this.decorations[j]);
      }
    }
  }
}

export namespace EasyMotion {
  export class Marker {
    private _name: string;
    private _position: Position;

    constructor(name: string, position: Position) {
      this._name = name;
      this._position = position;
    }

    public get name(): string {
      return this._name;
    }

    public get position(): Position {
      return this._position;
    }
  }

  export class Match {
    private _position: Position;
    private _text: string;
    private _index: number;

    constructor(position: Position, text: string, index: number) {
      this._position = position;
      this._text = text;
      this._index = index;
    }

    public get position(): Position {
      return this._position;
    }

    public get text(): string {
      return this._text;
    }

    public get index(): number {
      return this._index;
    }

    public set position(position: Position) {
      this._position = position;
    }

    public toRange(): vscode.Range {
      return new vscode.Range(this.position, this.position.translate(0, this.text.length));
    }
  }

  export interface SearchOptions {
    /**
     * The minimum bound of the search
     */
    min?: Position;

    /**
     * The maximum bound of the search
     */
    max?: Position;
  }
}
