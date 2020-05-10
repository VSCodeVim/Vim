import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { Position, PositionDiff } from './../common/motion/position';
import { Mode } from './../mode/mode';
import { TextEditor } from './../textEditor';

export enum SearchDirection {
  Forward = 1,
  Backward = -1,
}

/**
 * State involved with beginning a search (/).
 */
export class SearchState {
  private static readonly MAX_SEARCH_RANGES = 1000;

  private static readonly specialCharactersRegex = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;
  private static readonly caseOverrideRegex = /\\[Cc]/g;
  private static readonly notEscapedSlashRegex = /(?<=[^\\])\//g;
  private static readonly notEscapedQuestionMarkRegex = /(?<=[^\\])\?/g;
  private static readonly searchOffsetBeginRegex = /b(\+-)?[0-9]*/;
  private static readonly searchOffsetEndRegex = /e(\+-)?[0-9]*/;

  public readonly previousMode: Mode;
  public readonly searchDirection: SearchDirection;
  public readonly cursorStartPosition: Position;

  /**
   * Every range in the document that matches the search string.
   */
  public get matchRanges(): vscode.Range[] {
    return this._matchRanges;
  }
  private _matchRanges: vscode.Range[] = [];

  private _cachedDocumentVersion: number;
  private _cachedDocumentName: String;

  /**
   * Whether the needle should be interpreted as a regular expression
   */
  private readonly isRegex: boolean;

  /**
   * The string being searched for
   */
  private needle = '';

  // How to adjust the cursor's position after going to a match
  // Some examples:
  //   /abc/3 will jump to the third character after finding abc
  //   /abc/b-2 will go 2 characters to the left after finding abc
  //   /abc/e2 will go 2 characters to the right from the end of abc after finding it
  // TODO: support the ; offset (see http://vimdoc.sourceforge.net/htmldoc/pattern.html)
  private offset?: {
    type: 'line' | 'beginning' | 'end';
    num: number;
  };

  /**
   * The raw string being searched for, including both the needle and search offset
   */
  private _searchString = '';
  public get searchString(): string {
    return this._searchString;
  }

  public set searchString(search: string) {
    if (this._searchString !== search) {
      this._searchString = search;

      const oldNeedle = this.needle;
      this.needle = search;
      this.offset = undefined;

      const needleSegments =
        this.searchDirection === SearchDirection.Backward
          ? search.split(SearchState.notEscapedQuestionMarkRegex)
          : search.split(SearchState.notEscapedSlashRegex);
      if (needleSegments.length > 1) {
        this.needle = needleSegments[0];
        const num = Number(needleSegments[1]);
        if (isNaN(num)) {
          if (SearchState.searchOffsetBeginRegex.test(needleSegments[1])) {
            this.offset = {
              type: 'beginning',
              num: Number(needleSegments[1].slice(1)),
            };
          } else if (SearchState.searchOffsetEndRegex.test(needleSegments[1])) {
            this.offset = {
              type: 'end',
              num: Number(needleSegments[1].slice(1)),
            };
          }
        } else {
          this.offset = {
            type: 'line',
            num: num,
          };
        }
      }

      if (this.needle !== oldNeedle) {
        this._recalculateSearchRanges({ forceRecalc: true });
      }
    }
  }

  private _recalculateSearchRanges({ forceRecalc }: { forceRecalc?: boolean } = {}): void {
    if (this.needle === '' || vscode.window.activeTextEditor === undefined) {
      return;
    }

    const document = vscode.window.activeTextEditor.document;

    // checking if the tab that is worked on has changed, or the file version has changed
    const shouldRecalculate =
      TextEditor.isActive &&
      (this._cachedDocumentName !== document.fileName ||
        this._cachedDocumentVersion !== document.version ||
        forceRecalc);

    if (shouldRecalculate) {
      // Calculate and store all matching ranges
      this._cachedDocumentVersion = document.version;
      this._cachedDocumentName = document.fileName;
      this._matchRanges = [];

      /*
       * Decide whether the search is case sensitive.
       * If ignorecase is false, the search is case sensitive.
       * If ignorecase is true, the search should be case insensitive.
       * If both ignorecase and smartcase are true, the search is case sensitive only when the search string contains UpperCase character.
       */
      let ignorecase = configuration.ignorecase;
      if (ignorecase && configuration.smartcase && /[A-Z]/.test(this.needle)) {
        ignorecase = false;
      }

      let searchRE = this.needle;
      const ignorecaseOverride = this.needle.match(SearchState.caseOverrideRegex);
      if (ignorecaseOverride) {
        // Vim strips all \c's but uses the behavior of the first one.
        searchRE = this.needle.replace(SearchState.caseOverrideRegex, '');
        ignorecase = ignorecaseOverride[0][1] === 'c';
      }

      if (!this.isRegex) {
        searchRE = this.needle.replace(SearchState.specialCharactersRegex, '\\$&');
      }

      const regexFlags = ignorecase ? 'gim' : 'gm';

      let regex: RegExp;
      try {
        regex = new RegExp(searchRE, regexFlags);
      } catch (err) {
        // Couldn't compile the regexp, try again with special characters escaped
        searchRE = this.needle.replace(SearchState.specialCharactersRegex, '\\$&');
        regex = new RegExp(searchRE, regexFlags);
      }
      // We store the entire text file as a string inside text, and run the
      // regex against it many times to find all of our matches.
      const text = document.getText();
      const selection = vscode.window.activeTextEditor!.selection;
      const startOffset = document.offsetAt(selection.active);
      regex.lastIndex = startOffset;

      let result: RegExpExecArray | null;
      let wrappedOver = false;
      while (true) {
        result = regex.exec(text);

        // We need to wrap around to the back if we reach the end.
        if (result) {
          this._matchRanges.push(
            new vscode.Range(
              document.positionAt(result.index),
              document.positionAt(result.index + result[0].length)
            )
          );

          if (this._matchRanges.length >= SearchState.MAX_SEARCH_RANGES) {
            break;
          }

          if (result.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        } else if (!wrappedOver) {
          regex.lastIndex = 0;
          wrappedOver = true;
        } else {
          break;
        }
      }

      this._matchRanges.sort((x, y) => (x.start.isBefore(y.start) ? -1 : 1));
    }
  }

  /**
   * The position of the next search.
   * match == false if there is no match.
   *
   * Pass in -1 as direction to reverse the direction we search.
   */
  public getNextSearchMatchPosition(
    startPosition: Position,
    direction = SearchDirection.Forward
  ): { pos: Position; match: boolean; index: number } | undefined {
    const nextMatch = this.getNextSearchMatchRange(startPosition, direction);
    if (nextMatch === undefined) {
      return undefined;
    }
    const { start, end, match, index } = nextMatch;

    let pos = start;
    if (this.offset) {
      if (this.offset.type === 'line') {
        pos = start.add(PositionDiff.newBOLDiff(this.offset.num));
      } else if (this.offset.type === 'beginning') {
        pos = start.getOffsetThroughLineBreaks(this.offset.num);
      } else if (this.offset.type === 'end') {
        pos = end.getOffsetThroughLineBreaks(this.offset.num - 1);
      }
    }

    return { pos, match, index };
  }

  /**
   * The position of the next search.
   * match == false if there is no match.
   *
   * Pass in -1 as direction to reverse the direction we search.
   *
   * end is exclusive; which means the index is start + matchedString.length
   */
  public getNextSearchMatchRange(
    startPosition: Position,
    direction = SearchDirection.Forward
  ): { start: Position; end: Position; match: boolean; index: number } | undefined {
    this._recalculateSearchRanges();

    if (this._matchRanges.length === 0) {
      // TODO(bell)
      return { start: startPosition, end: startPosition, match: false, index: -1 };
    }

    const effectiveDirection = (direction * this.searchDirection) as SearchDirection;

    if (effectiveDirection === SearchDirection.Forward) {
      for (const [index, matchRange] of this._matchRanges.entries()) {
        if (matchRange.start.isAfter(startPosition)) {
          return {
            start: Position.FromVSCodePosition(matchRange.start),
            end: Position.FromVSCodePosition(matchRange.end),
            match: true,
            index,
          };
        }
      }
      // We've hit the bottom of the file. Wrap around if configured to do so, or return undefined.
      // TODO(bell)
      if (configuration.wrapscan) {
        const range = this._matchRanges[0];
        return {
          start: Position.FromVSCodePosition(range.start),
          end: Position.FromVSCodePosition(range.end),
          match: true,
          index: 0,
        };
      } else {
        return undefined;
      }
    } else {
      for (const [index, matchRange] of this._matchRanges.slice(0).reverse().entries()) {
        if (matchRange.end.isBeforeOrEqual(startPosition)) {
          return {
            start: Position.FromVSCodePosition(matchRange.start),
            end: Position.FromVSCodePosition(matchRange.end),
            match: true,
            index: this._matchRanges.length - index - 1,
          };
        }
      }

      // We've hit the top of the file. Wrap around if configured to do so, or return undefined.
      // TODO(bell)
      if (configuration.wrapscan) {
        const range = this._matchRanges[this._matchRanges.length - 1];
        return {
          start: Position.FromVSCodePosition(range.start),
          end: Position.FromVSCodePosition(range.end),
          match: true,
          index: this._matchRanges.length - 1,
        };
      } else {
        return undefined;
      }
    }
  }

  public getSearchMatchRangeOf(
    pos: Position
  ): { start: Position; end: Position; match: boolean; index: number } {
    this._recalculateSearchRanges();

    if (this._matchRanges.length === 0) {
      // TODO(bell)
      return { start: pos, end: pos, match: false, index: -1 };
    }

    for (let [index, matchRange] of this._matchRanges.entries()) {
      if (matchRange.start.isBeforeOrEqual(pos) && matchRange.end.isAfter(pos)) {
        return {
          start: Position.FromVSCodePosition(matchRange.start),
          end: Position.FromVSCodePosition(matchRange.end),
          match: true,
          index,
        };
      }
    }

    // TODO(bell)
    return { start: pos, end: pos, match: false, index: -1 };
  }

  constructor(
    direction: SearchDirection,
    startPosition: Position,
    searchString = '',
    { isRegex = false } = {},
    currentMode: Mode
  ) {
    this.searchDirection = direction;
    this.cursorStartPosition = startPosition;
    this.isRegex = isRegex;
    this.searchString = searchString;
    this.previousMode = currentMode;
  }
}
