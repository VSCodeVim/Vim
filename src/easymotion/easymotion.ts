import * as vscode from "vscode";

import { Position } from './../motion/position';
import { TextEditor } from './../textEditor';

export class EasyMotion {
  /**
   * Refers to the accumulated keys for depth navigation
   */
  public accumulation = "";

  /**
   * Array of all markers and decorations
   */
  private markers: EasyMotion.Marker[];
  private visibleMarkers: EasyMotion.Marker[]; // Array of currently showing markers
  private decorations: any[][];

  /**
   * TODO: For future motions
   */
  private static specialCharactersRegex: RegExp = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;

  /**
   * Caches for decorations
   */
  private static decorationTypeCache: vscode.TextEditorDecorationType[] = [];
  private static svgCache: { [code: string] : vscode.Uri } = {};

  /**
   * The key sequence for marker name generation
   */
  public static keyTable = [
    "a", "s", "d", "g", "h", "k", "l", "q", "w", "e",
    "r", "t", "y", "u", "i", "o", "p", "z", "x", "c",
    "v", "b", "n", "m", "f", "j"
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
  public static generateMarker(index: number, length: number, position: Position, markerPosition: Position): EasyMotion.Marker {
    let keyTable = EasyMotion.keyTable;
    var availableKeyTable = keyTable.slice();

    // Depth table should always include a ;
    var keyDepthTable = [";"];
    var totalSteps = 0;

    if (length >= keyTable.length) {
        var totalRemainder = Math.max(length - keyTable.length, 0);
        totalSteps = Math.floor(totalRemainder / keyTable.length);

        for (var i = 0; i < totalSteps; i++) {
            keyDepthTable.push(availableKeyTable.pop()!);
        }
    }

    var prefix = "";
    if (index >= availableKeyTable.length) {
        // Length of available keys before reset and ";"
        var oldLength = availableKeyTable.length;
        // The index that remains after taking away the first-level depth markers
        var remainder = index - availableKeyTable.length;

        // ";" can be used as the last marker key, when inside a marker with depth. Reset to available keys and add ";"
        availableKeyTable = keyTable.slice();
        availableKeyTable.push(";");

        // Depth index counts down instead of up
        var inverted = (length - oldLength - 1 - remainder);
        var steps = Math.floor((inverted) / availableKeyTable.length);

        // Add the key to the prefix
        prefix += keyDepthTable[steps];

        // Check if we're on the last depth level
        if (steps >= totalSteps) {
            // Return the proper key for this index
            return new EasyMotion.Marker(prefix + availableKeyTable[remainder % availableKeyTable.length], markerPosition);
        }

        // Return the proper index for depths earlier than the last one, including prefix
        var num = (availableKeyTable.length - 1 - inverted % availableKeyTable.length) % availableKeyTable.length;
        return new EasyMotion.Marker(prefix + availableKeyTable[num], markerPosition);
    }

    // Return the last key in the marker, including prefix
    return new EasyMotion.Marker(prefix + availableKeyTable[index % availableKeyTable.length], markerPosition);
  }

  /**
   * Create and cache decoration types for different marker lengths
   */
  public static getDecorationType(length: number): vscode.TextEditorDecorationType {
    var cache = this.decorationTypeCache[length];
    if (cache) {
      return cache;
    }

    var width = length * 8;
    var type = vscode.window.createTextEditorDecorationType({
      after: {
        margin: `0 0 0 -${width}px`,
        height: `14px`,
        width: `${width}px`
      }
    });

    this.decorationTypeCache[length] = type;

    return type;
  }

  /**
   * Create and cache the SVG data URI for different marker codes and colors
   */
  private static getSvgDataUri(code: string, backgroundColor: string, fontColor: string): vscode.Uri {
      var cache = this.svgCache[code];
      if (cache) {
        return cache;
      }

      const width = code.length * 8 + 1;
      var uri = vscode.Uri.parse(
        `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ` +
        `13" height="14" width="${width}"><rect width="${width}" height="14" rx="2" ry="2" ` +
        `style="fill: ${backgroundColor};"></rect><text font-family="Consolas" font-size="14px" ` +
        `fill="${fontColor}" x="1" y="10">${code}</text></svg>`);

      this.svgCache[code] = uri;

      return uri;
  }

  /**
   * Clear all decorations
   */
  public clearDecorations() {
    var editor = vscode.window.activeTextEditor!;
    for (var i = 1; i <= this.decorations.length; i++) {
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
    var arr = visible ? this.visibleMarkers : this.markers;
    var markers: EasyMotion.Marker[] = [];
    for (var i = 0; i < arr.length; i++) {
      var marker = arr[i];

      if (marker.name.startsWith(nail)) {
        markers.push(marker);
      }
    }

    return markers;
  }

  /**
   * Search and sort using the index of a match compared to the index of position (usually the cursor)
   */
  public sortedSearch(position: Position, search: string | RegExp = "", options: EasyMotion.SearchOptions = {}): EasyMotion.Match[] {
    let regex: RegExp;
    if (typeof search === "string") {
      // Regex needs to be escaped
      regex = new RegExp(search.replace(EasyMotion.specialCharactersRegex, "\\$&"), "g");
    } else {
      regex = search;
    }

    var matches: EasyMotion.Match[] = [];

    // Cursor index refers to the index of the marker that is on or to the right of the cursor
    var cursorIndex = position.character;
    var prevMatch: EasyMotion.Match | undefined;

    // Calculate the min/max bounds for the search
    var lineCount = TextEditor.getLineCount();
    var lineMin = options.min ? Math.max(options.min.line, 0) : 0;
    var lineMax = options.max ? Math.min(options.max.line + 1, lineCount) : lineCount;

    outer:
    for (let lineIdx = lineMin; lineIdx < lineMax; lineIdx++) {
      const line = TextEditor.getLineAt(new Position(lineIdx, 0)).text;
      var result = regex.exec(line);

      while (result) {
        if (matches.length >= 1000) {
          break outer;
        }

        let pos = new Position(lineIdx, result.index);

        // Check if match is within bounds
        if ((options.min && pos.isBefore(options.min)) ||
            (options.max && pos.isAfter(options.max)) ||
            Math.abs(pos.line - position.line) > 100) { // Stop searching after 100 lines in both directions

          result = regex.exec(line);
          continue;
        }

        // Update cursor index to the marker on the right side of the cursor
        if (!prevMatch || prevMatch.position.isBefore(position)) {
          cursorIndex = matches.length;
        }

        prevMatch = new EasyMotion.Match(
          pos,
          result[0],
          matches.length
        );

        // Matches on the cursor position should be ignored
        if (pos.isEqual(position)) {
          result = regex.exec(line);
          continue;
        }

        matches.push(prevMatch);

        result = regex.exec(line);
      }
    }

    // Sort by the index distance from the cursor index
    matches.sort((a: EasyMotion.Match, b: EasyMotion.Match): number => {
      var diffA = cursorIndex - a.index;
      var diffB = cursorIndex - b.index;

      var absDiffA = Math.abs(diffA);
      var absDiffB = Math.abs(diffB);

      // Prioritize the matches on the right side of the cursor index
      if (a.index < cursorIndex) {
        absDiffA -= 0.5;
      }
      if (b.index < cursorIndex) {
        absDiffB -= 0.5;
      }

      return absDiffA - absDiffB;
    });

    return matches;
  }


  public updateDecorations() {
    this.clearDecorations();

    this.visibleMarkers = [];
    this.decorations = [];
    for (var i = 0; i < this.markers.length; i++) {
      var marker = this.getMarker(i);

      // Ignore markers that do not start with the accumulated depth level
      if (!marker.name.startsWith(this.accumulation)) {
        continue;
      }

      var pos = marker.position;
      // Get keys after the depth we're at
      var keystroke = marker.name.substr(this.accumulation.length);

      let fontColor = keystroke.length > 1 ? "orange" : "red";

      if (!this.decorations[keystroke.length]) {
        this.decorations[keystroke.length] = [];
      }

      // Position should be offsetted by the length of the keystroke to prevent hiding behind the gutter
      var charPos = pos.character + 1 + (keystroke.length - 1);
      this.decorations[keystroke.length].push({
        range: new vscode.Range(pos.line, charPos, pos.line, charPos),
        renderOptions: {
          dark: {
            after: {
              contentIconPath: EasyMotion.getSvgDataUri(keystroke, "black", fontColor)
            }
          },
          light: {
            after: {
              contentIconPath: EasyMotion.getSvgDataUri(keystroke, "black", "white")
            }
          }
        }
      });

      this.visibleMarkers.push(marker);
    }

    // Set the decorations for all the different marker lengths
    var editor = vscode.window.activeTextEditor!;
    for (var j = 1; j < this.decorations.length; j++) {
      if (this.decorations[j]) {
        editor.setDecorations(EasyMotion.getDecorationType(j), this.decorations[j]);
      }
    }
  }
}

export module EasyMotion {
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
  }

  export interface SearchOptions {
    min?: Position; // The minimum bound of the search
    max?: Position; // The maximum bound of the search
  }
}