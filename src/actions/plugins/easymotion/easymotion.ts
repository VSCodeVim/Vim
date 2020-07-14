import * as vscode from 'vscode';

import { Position } from './../../../common/motion/position';
import { configuration } from './../../../configuration/configuration';
import { TextEditor } from './../../../textEditor';
import { EasyMotionSearchAction } from './easymotion.cmd';
import { MarkerGenerator } from './markerGenerator';
import { Mode } from '../../../mode/mode';

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
  private fade: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    textDecoration: `none;
    filter: grayscale(1);`,
  });
  private hide: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    // because opacity isn't enough, vscode blinking █ cursor
    // would still reveal the hidden character
    opacity: `0;
    visibility: hidden;
    margin: 0 ${configuration.easymotionMarkerMargin / 2}px;`,
  });

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
  public previousMode: Mode;

  constructor() {
    this._markers = [];
    this.visibleMarkers = [];
    this.decorations = [];
  }

  /**
   * Create and cache decoration types for different marker lengths
   */
  public static getDecorationType(
    length: number,
    decorations?: vscode.DecorationRenderOptions
  ): vscode.TextEditorDecorationType {
    const cache = this.decorationTypeCache[length];
    if (cache) {
      return cache;
    } else {
      const type = vscode.window.createTextEditorDecorationType(decorations || {});

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

    editor.setDecorations(this.fade, []);
    editor.setDecorations(this.hide, []);
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
    return markers.filter((marker) => marker.name.startsWith(nail));
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
      const line = TextEditor.getLine(lineIdx).text;
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

  private getMarkerColor(
    customizedValue: string,
    themeColorId: string
  ): string | vscode.ThemeColor {
    if (customizedValue) {
      return customizedValue;
    } else {
      return new vscode.ThemeColor(themeColorId);
    }
  }

  private getEasymotionMarkerBackgroundColor() {
    return this.getMarkerColor(configuration.easymotionMarkerBackgroundColor, '#0000');
  }

  private getEasymotionMarkerForegroundColorOneChar() {
    return this.getMarkerColor(
      configuration.easymotionMarkerForegroundColorOneChar,
      'activityBarBadge.foreground'
    );
  }

  private getEasymotionMarkerForegroundColorTwoChar() {
    return this.getMarkerColor(
      configuration.easymotionMarkerForegroundColorTwoChar,
      'activityBarBadge.foreground'
    );
  }

  public updateDecorations() {
    this.clearDecorations();

    this.visibleMarkers = [];
    this.decorations = [];

    // Set the decorations for all the different marker lengths
    const editor = vscode.window.activeTextEditor!;
    const dimmingZones: vscode.Range[] = [];
    // Why this instead of `background-color` on the marker?
    // The easy fix would've been to let the user set the marker background to the same
    // color as the editor so it would hide the character behind, However this would require
    // the user to do more work, with this solution we temporarily hide the marked character
    // so no user specific setting is needed
    const hiddenChars: vscode.Range[] = [];
    const markers = this._markers
      .filter((m) => m.name.startsWith(this.accumulation))
      .sort((a, b) => (a.position.isBefore(b.position) ? -1 : 1));

    // Ignore markers that do not start with the accumulated depth level
    for (const marker of markers) {
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

      // Position should be offsetted by the length of the keystroke to prevent hiding behind the gutter
      // ^ is this still needed? it breaks with current implementation
      const charPos = pos.character;
      const range = new vscode.Range(pos.line, charPos, pos.line, charPos);

      //#region Hack (remove once backend handles this)

      /*
        This hack is here because the backend for easy motion reports two adjacent
        2 char markers resulting in a 4 char wide markers, this isn't what happens in
        original easymotion for instance: for doom
            - original reports d[m][m2]m where [m] is a marker and [m2] is secondary
            - here it reports d[m][m][m][m]m
        The reason this won't work with current impl is that it overflows resulting in
        one extra hidden character, hence the check below (until backend truely mimics original)

        if two consecutive 2 char markers, we only use the first char from the current marker
        and reduce the char substitution by 1. Once backend properly reports adjacent markers
        all instances of `trim` can be removed
      */
      let trim = 0;
      const next = markers[markers.indexOf(marker) + 1];

      if (next && next.position.character - pos.character === 1) {
        const nextKeystroke = next.name.substr(this.accumulation.length);

        if (keystroke.length > 1 && nextKeystroke.length > 1) {
          trim = -1;
        }
      }

      //#endregion

      const fontSize =
        configuration.easymotionMarkerFontSize || configuration.getConfiguration('editor').fontSize;
      const fontFamily =
        configuration.easymotionMarkerFontFamily ||
        configuration.getConfiguration('editor').fontFamily;
      const renderOptions: vscode.ThemableDecorationInstanceRenderOptions = {
        before: {
          contentText: trim === -1 ? keystroke.substring(0, 1) : keystroke,
          backgroundColor: this.getEasymotionMarkerBackgroundColor(),
          color: fontColor,
          width: `${keystroke.length * configuration.easymotionMarkerWidthPerChar}px;
          position: absolute;
          z-index: 1;
          margin: 0 ${configuration.easymotionMarkerMargin / 2}px;
          transform: translateX(-0.05ch);
          border-radius: 1px;
          font-family: ${fontFamily};
          font-size: ${fontSize}px;
          font-weight: ${configuration.easymotionMarkerFontWeight};`,
        },
      };

      hiddenChars.push(
        new vscode.Range(pos.line, pos.character, pos.line, pos.character + keystroke.length + trim)
      );

      if (configuration.easymotionDimBackground) {
        const dimPos =
          pos.getLineEndIncludingEOL().character - charPos === 1 ? pos.character : charPos;

        // This excludes markers from the dimming ranges by using them as anchors
        // each marker adds the range between it and previous marker to the dimming zone
        // except last marker after which the rest of document is dimmed
        //
        // example [m1] text that has multiple [m2] marks
        // |<------    |<----------------------     ---->|
        if (dimmingZones.length === 0) {
          dimmingZones.push(new vscode.Range(0, 0, pos.line, dimPos));
        } else {
          const prevDimPos = dimmingZones[dimmingZones.length - 1];

          dimmingZones.push(
            new vscode.Range(prevDimPos.end.line, prevDimPos.end.character, pos.line, dimPos)
          );
        }
      }

      this.decorations[keystroke.length].push({
        range,
        renderOptions: {
          dark: renderOptions,
          light: renderOptions,
        },
      });

      this.visibleMarkers.push(marker);
    }

    // for the last marker dim till document end
    if (configuration.easymotionDimBackground) {
      dimmingZones.push(
        new vscode.Range(
          markers[markers.length - 1].position,
          new Position(editor.document.lineCount, Number.MAX_VALUE)
        )
      );
    }

    for (let j = 1; j < this.decorations.length; j++) {
      if (this.decorations[j]) {
        editor.setDecorations(EasyMotion.getDecorationType(j), this.decorations[j]);
      }
    }

    editor.setDecorations(this.hide, hiddenChars);

    if (configuration.easymotionDimBackground) {
      editor.setDecorations(this.fade, dimmingZones);
    }
  }
}

export namespace EasyMotion {
  export interface Marker {
    name: string;
    position: Position;
  }

  export class Match {
    public position: Position;
    public readonly text: string;
    public readonly index: number;

    constructor(position: Position, text: string, index: number) {
      this.position = position;
      this.text = text;
      this.index = index;
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
