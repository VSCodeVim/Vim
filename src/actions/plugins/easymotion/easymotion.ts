import * as vscode from 'vscode';
import { Position } from './../../../common/motion/position';
import { Configuration } from './../../../configuration/configuration';
import { TextEditor } from './../../../textEditor';

export class EasyMotion {
  /**
   * Refers to the accumulated keys for depth navigation
   */
  public accumulation = '';

  /**
   * Array of all markers and decorations
   */
  private markers: EasyMotion.Marker[];
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
  private static svgCache: { [code: string]: vscode.Uri } = {};
  private static cachedBackgroundColor: string = '';
  private static cachedOneFontColor: string = '';
  private static cachedTwoFontColor: string = '';
  private static cachedWidthPerChar: number = -1;
  private static cachedHeight: number = -1;

  /**
   * The key sequence for marker name generation
   */
  public static keyTable = [
    'a',
    's',
    'd',
    'g',
    'h',
    'k',
    'l',
    'q',
    'w',
    'e',
    'r',
    't',
    'y',
    'u',
    'i',
    'o',
    'p',
    'z',
    'x',
    'c',
    'v',
    'b',
    'n',
    'm',
    'f',
    'j',
  ];

  /**
   * Mode to return to after attempting easymotion
   */
  public previousMode: number;

  constructor() {
    this.markers = [];
    this.visibleMarkers = [];
    this.decorations = [];
  }

  /**
   * Generate a marker following a sequence for the name and depth levels
   */
  public static generateMarker(
    index: number,
    length: number,
    position: Position,
    markerPosition: Position
  ): EasyMotion.Marker | null {
    const keyTable = EasyMotion.keyTable;
    let availableKeyTable = keyTable.slice();

    // Depth table should always include a ;
    const keyDepthTable = [';'];
    let totalSteps = 0;

    if (length >= keyTable.length) {
      const totalRemainder = Math.max(length - keyTable.length, 0);
      totalSteps = Math.floor(totalRemainder / keyTable.length);

      Array(Math.min(totalSteps, 26))
        .forEach(() => keyDepthTable.push(availableKeyTable.pop()!));
    }

    let prefix = '';
    if (index >= availableKeyTable.length) {
      // Length of available keys before reset and ";"
      const oldLength = availableKeyTable.length;
      // The index that remains after taking away the first-level depth markers
      const remainder = index - availableKeyTable.length;

      // ";" can be used as the last marker key, when inside a marker with depth. Reset to available keys and add ";"
      availableKeyTable = keyTable.slice();
      availableKeyTable.push(';');

      // Depth index counts down instead of up
      const inverted = length - oldLength - 1 - remainder;
      const steps = Math.floor(inverted / availableKeyTable.length);

      // Add the key to the prefix
      if (steps > keyDepthTable.length - 1) {
        return null;
      } else {
        prefix += keyDepthTable[steps];

        // Check if we're on the last depth level
        if (steps >= totalSteps) {
          // Return the proper key for this index
          return new EasyMotion.Marker(
            prefix + availableKeyTable[remainder % availableKeyTable.length],
            markerPosition
          );
        } else {
          // Return the proper index for depths earlier than the last one, including prefix
          const num =
            (availableKeyTable.length - 1 - inverted % availableKeyTable.length) %
            availableKeyTable.length;
          return new EasyMotion.Marker(prefix + availableKeyTable[num], markerPosition);
        }
      }
    } else {
      // Return the last key in the marker, including prefix
      return new EasyMotion.Marker(
        prefix + availableKeyTable[index % availableKeyTable.length],
        markerPosition
      );
    }
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
          width: `${width}px`,
        },
      });

      this.decorationTypeCache[length] = type;

      return type;
    }
  }

  /**
   * Create and cache the SVG data URI for different marker codes and colors
   */
  private static getSvgDataUri(
    code: string,
    backgroundColor: string | undefined = 'black',
    fontFamily: string | undefined = 'Consolas',
    fontColor: string | undefined = 'white',
    fontSize: string | undefined = '14',
    fontWeight: string | undefined = 'normal'
  ): vscode.Uri {
    // Clear cache if the backgroundColor or fontColor has changed
    if (this.cachedBackgroundColor !== backgroundColor) {
      this.svgCache = {};
      this.cachedBackgroundColor = backgroundColor;
    }

    if (this.cachedOneFontColor !== Configuration.easymotionMarkerForegroundColorOneChar) {
      this.svgCache = {};
      this.cachedOneFontColor = Configuration.easymotionMarkerForegroundColorOneChar;
    }

    if (this.cachedTwoFontColor !== Configuration.easymotionMarkerForegroundColorTwoChar) {
      this.svgCache = {};
      this.cachedTwoFontColor = Configuration.easymotionMarkerForegroundColorTwoChar;
    }

    const widthPerChar = Configuration.easymotionMarkerWidthPerChar;
    const width = code.length * widthPerChar + 1;
    const height = Configuration.easymotionMarkerHeight;

    if (this.cachedWidthPerChar !== widthPerChar || this.cachedHeight !== height) {
      this.svgCache = {};
      this.cachedWidthPerChar = width;
      this.cachedHeight = height;
    }

    const cache = this.svgCache[code];
    if (cache) {
      return cache;
    } else {
      const uri = vscode.Uri.parse(
        `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ` +
        `${height}" height="${height}" width="${width}"><rect width="${width}" height="${height}" rx="2" ry="2" ` +
        `style="fill: ${backgroundColor}"></rect><text font-family="${fontFamily}" font-size="${fontSize}" ` +
        `font-weight="${fontWeight}" fill="${fontColor}" x="1" y="${Configuration.easymotionMarkerYOffset}">${code}</text></svg>`
      );

      this.svgCache[code] = uri;

      return uri;
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
    this.markers = [];
    this.visibleMarkers = [];
  }

  public addMarker(marker: EasyMotion.Marker) {
    this.markers.push(marker);
  }

  public getMarker(index: number): EasyMotion.Marker {
    return this.markers[index];
  }

  /**
   * Find markers beginning with a string
   */
  public findMarkers(nail: string, visible = true): EasyMotion.Marker[] {
    const markers = visible ? this.visibleMarkers : this.markers;
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
    const regex = typeof search === 'string'
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

  public updateDecorations() {
    this.clearDecorations();

    this.visibleMarkers = [];
    this.decorations = [];

    // Ignore markers that do not start with the accumulated depth level
    for (const marker of this.markers.filter(m => m.name.startsWith(this.accumulation))) {
      const pos = marker.position;
      // Get keys after the depth we're at
      const keystroke = marker.name.substr(this.accumulation.length);

      if (!this.decorations[keystroke.length]) {
        this.decorations[keystroke.length] = [];
      }

      const fontColor =
        keystroke.length > 1
          ? Configuration.easymotionMarkerForegroundColorTwoChar
          : Configuration.easymotionMarkerForegroundColorOneChar;

      const renderOptions: vscode.ThemableDecorationInstanceRenderOptions = {
        after: {
          contentIconPath: EasyMotion.getSvgDataUri(
            keystroke,
            Configuration.easymotionMarkerBackgroundColor,
            Configuration.easymotionMarkerFontFamily,
            fontColor,
            Configuration.easymotionMarkerFontSize,
            Configuration.easymotionMarkerFontWeight
          ),
        }
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
