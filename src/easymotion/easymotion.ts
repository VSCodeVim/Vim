import * as vscode from "vscode";

import { Position } from './../motion/position';
import { VimState } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { TextEditor } from './../textEditor';

export class EasyMotion {
  private _vimState: VimState;

  public accumulation = "";

  private markers: EasyMotion.Marker[];
  private decorations: any[][] = [];

  private static specialCharactersRegex: RegExp = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;
  private static decorationTypeCache: vscode.TextEditorDecorationType[] = [];
  private static svgCache: { [code: string] : vscode.Uri } = {};

  public static keyTable = [
    "a", "s", "d", "g", "h", "k", "l", "q", "w", "e",
    "r", "t", "y", "u", "i", "o", "p", "z", "x", "c",
    "v", "b", "n", "m", "f", "j"
  ];

  constructor(vimState: VimState) {
    this._vimState = vimState;
  }

  public static generateMarker(index: number, length: number, position: Position, markerPosition: Position): EasyMotion.Marker {
    let keyTable = EasyMotion.keyTable;
    var availableKeyTable = keyTable.slice();
    var keyDepthTable = [";"];
    var totalSteps = 0;

    if (length >= keyTable.length) {
        var totalRemainder = Math.max(length - keyTable.length, 0);
        totalSteps = Math.floor(totalRemainder / keyTable.length);

        for (var i = 0; i < totalSteps; i++) {
            keyDepthTable.push(availableKeyTable.pop());
        }
    }

    var prefix = "";
    if (index >= availableKeyTable.length) {
        var oldLength = availableKeyTable.length;
        var remainder = index - availableKeyTable.length;

        availableKeyTable = keyTable.slice();
        availableKeyTable.push(";");

        var inverted = (length - oldLength - 1 - remainder);
        var steps = Math.floor((inverted) / availableKeyTable.length);

        prefix += keyDepthTable[steps];

        if (steps >= totalSteps) {
            return new EasyMotion.Marker(prefix + availableKeyTable[remainder % availableKeyTable.length], markerPosition);
        }

        var num = (availableKeyTable.length - 1 - inverted % availableKeyTable.length) % availableKeyTable.length;
        return new EasyMotion.Marker(prefix + availableKeyTable[num], markerPosition);
    }

    return new EasyMotion.Marker(prefix + availableKeyTable[index % availableKeyTable.length], markerPosition);
  }

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


  public enterMode() {
    this.accumulation = "";
    this._vimState.currentMode = ModeName.EasyMotionMode;
  }

  public exitMode() {
    this._vimState.currentMode = ModeName.Normal;

    this.accumulation = "";
    this.clearMarkers();
    this.clearDecorations();
  }

  public clearDecorations() {
    var editor = vscode.window.activeTextEditor;
    for (var i = 1; i <= this.decorations.length; i++) {
      editor.setDecorations(EasyMotion.getDecorationType(i), []);
    }
  }

  public clearMarkers() {
    this.markers = [];
  }

  public addMarker(marker: EasyMotion.Marker) {
    this.markers.push(marker);
  }

  public getMarker(index: number): EasyMotion.Marker {
    return this.markers[index];
  }

  public findMarkers(nail: string): EasyMotion.Marker[] {
    var markers: EasyMotion.Marker[] = [];
    for (var i = 0; i < this.markers.length; i++) {
      var marker = this.getMarker(i);

      if (marker.name.startsWith(nail)) {
        markers.push(this.getMarker(i));
      }
    }

    return markers;
  }

  public sortedSearch(position: Position, searchString = "", options: EasyMotion.SearchOptions = {}): EasyMotion.Match[] {
    let searchRE = searchString;
    if (!options.isRegex) {
      searchRE = searchString.replace(EasyMotion.specialCharactersRegex, "\\$&");
    }

    const regexFlags = "g";
    let regex: RegExp;
    try {
      regex = new RegExp(searchRE, regexFlags);
    } catch (err) {
      // Couldn't compile the regexp, try again with special characters escaped
      searchRE = searchString.replace(EasyMotion.specialCharactersRegex, "\\$&");
      regex = new RegExp(searchRE, regexFlags);
    }

    var matches: EasyMotion.Match[] = [];

    var cursorIndex = position.character;
    var prevMatch: EasyMotion.Match | undefined;

    var lineCount = TextEditor.getLineCount();
    var lineMin = options.min ? Math.max(options.min.line, 0) : 0;
    var lineMax = options.max ? Math.min(options.max.line + 1, lineCount) : lineCount;

    outer:
    for (let lineIdx = lineMin; lineIdx < lineMax; lineIdx++) {
      const line = TextEditor.getLineAt(new Position(lineIdx, 0)).text;
      var result = regex.exec(line);

      while (result) {
        if (matches.length >= 100) {
          break outer;
        }

        var matchIndex = result.index;
        if (options.useEnd) {
          matchIndex += result[0].length - 1;
        }
        let pos = new Position(lineIdx, matchIndex);

        if ((options.min && pos.isBefore(options.min)) ||
            (options.max && pos.isAfter(options.max)) ||
            Math.abs(pos.line - position.line) > 100) {

          result = regex.exec(line);
          continue;
        }

        if (!prevMatch || prevMatch.position.isBefore(position)) {
          cursorIndex = matches.length;
        }

        prevMatch = new EasyMotion.Match(
          pos,
          matches.length
        );

        if (pos.isEqual(position)) {
          result = regex.exec(line);
          continue;
        }

        matches.push(prevMatch);

        result = regex.exec(line);
      }
    }

    matches.sort((a: EasyMotion.Match, b: EasyMotion.Match): number => {
      var diffA = cursorIndex - a.index;
      var diffB = cursorIndex - b.index;

      var absDiffA = Math.abs(diffA);
      var absDiffB = Math.abs(diffB);

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


  public updateDecorations(position: Position) {
    this.clearDecorations();

    this.decorations = [];
    for (var i = 0; i < this.markers.length; i++) {
      var marker = this.getMarker(i);

      if (!marker.name.startsWith(this.accumulation)) {
        continue;
      }

      var pos = marker.position;
      var keystroke = marker.name.substr(this.accumulation.length);

      let fontColor = keystroke.length > 1 ? "orange" : "red";

      if (!this.decorations[keystroke.length]) {
        this.decorations[keystroke.length] = [];
      }

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
    }

    var editor = vscode.window.activeTextEditor;
    for (var j = 1; j < this.decorations.length; j++) {
      editor.setDecorations(EasyMotion.getDecorationType(j), this.decorations[j]);
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
    private _index: number;

    constructor(position: Position, index: number) {
      this._position = position;
      this._index = index;
    }

    public get position(): Position {
      return this._position;
    }

    public get index(): number {
      return this._index;
    }
  }

  export interface SearchOptions {
    min?: Position;
    max?: Position;
    isRegex?: boolean;
    useEnd?: boolean;
  }
}