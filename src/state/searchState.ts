import * as vscode from 'vscode';
import { Position } from 'vscode';

import { configuration } from '../configuration/configuration';
import { PositionDiff } from './../common/motion/position';
import { Mode } from './../mode/mode';

export enum SearchDirection {
  Forward = 1,
  Backward = -1,
}

// Older browsers don't support lookbehind - in this case, use an inferior regex rather than crashing
let supportsLookbehind = true;
try {
  // tslint:disable-next-line
  new RegExp('(?<=x)');
} catch {
  supportsLookbehind = false;
}

/**
 * State involved with beginning a search (/).
 */
export class SearchState {
  private static readonly MAX_SEARCH_RANGES = 1000;

  private static readonly specialCharactersRegex = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;
  private static readonly caseOverrideRegex = /\\[Cc]/g;
  private static readonly notEscapedSlashRegex = supportsLookbehind
    ? new RegExp('(?<=[^\\\\])\\/', 'g')
    : /\//g;
  private static readonly notEscapedQuestionMarkRegex = supportsLookbehind
    ? new RegExp('(?<=[^\\\\])\\?', 'g')
    : /\?/g;
  private static readonly searchOffsetBeginRegex = /b(\+-)?[0-9]*/;
  private static readonly searchOffsetEndRegex = /e(\+-)?[0-9]*/;

  public readonly previousMode: Mode;
  public readonly searchDirection: SearchDirection;
  public readonly cursorStartPosition: Position;

  /**
   * Every range in the document that matches the search string.
   */
  public getMatchRanges(editor: vscode.TextEditor): vscode.Range[] {
    return this.recalculateSearchRanges(editor);
  }
  private matchRanges: Map<string, { version: number; ranges: vscode.Range[] }> = new Map();

  /**
   * Whether the needle should be interpreted as a regular expression
   */
  private readonly isRegex: boolean;

  /**
   * If true, an all-lowercase needle will not be treated as case-insensitive, even if smartcase is enabled.
   * This is used for [g]* and [g]#.
   */
  private readonly ignoreSmartcase: boolean;

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
            num,
          };
        }
      }

      if (this.needle !== oldNeedle) {
        // Invalidate all cached results
        this.matchRanges.clear();

        this._needleRegex = undefined;
      }
    }
  }

  private _needleRegex: RegExp | undefined;
  private get needleRegex(): RegExp {
    if (this._needleRegex) {
      return this._needleRegex;
    }

    /*
     * Decide whether the search is case sensitive.
     * If ignorecase is false, the search is case sensitive.
     * If ignorecase is true, the search should be case insensitive.
     * If both ignorecase and smartcase are true, the search is case sensitive only when the search string contains UpperCase character.
     */
    let ignorecase = configuration.ignorecase;
    if (
      ignorecase &&
      configuration.smartcase &&
      !this.ignoreSmartcase &&
      /[A-Z]/.test(this.needle)
    ) {
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

    try {
      this._needleRegex = new RegExp(searchRE, regexFlags);
    } catch (err) {
      // Couldn't compile the regexp, try again with special characters escaped
      searchRE = this.needle.replace(SearchState.specialCharactersRegex, '\\$&');
      this._needleRegex = new RegExp(searchRE, regexFlags);
    }

    return this._needleRegex;
  }

  private recalculateSearchRanges(editor: vscode.TextEditor): vscode.Range[] {
    if (this.needle === '') {
      return [];
    }

    const document = editor.document;

    const cached = this.matchRanges.get(document.fileName);
    if (cached?.version === document.version) {
      return cached.ranges;
    }

    // We store the entire text file as a string inside text, and run the
    // regex against it many times to find all of our matches.
    const text = document.getText();
    const selection = editor.selection;
    const startOffset = document.offsetAt(selection.active);
    const regex = this.needleRegex;
    regex.lastIndex = startOffset;

    let result: RegExpExecArray | null;
    let wrappedOver = false;
    const matchRanges = [] as vscode.Range[];
    while (true) {
      result = regex.exec(text);

      if (result) {
        if (wrappedOver && result.index >= startOffset) {
          // We've found our first match again
          break;
        }

        matchRanges.push(
          new vscode.Range(
            document.positionAt(result.index),
            document.positionAt(result.index + result[0].length)
          )
        );

        if (matchRanges.length >= SearchState.MAX_SEARCH_RANGES) {
          break;
        }

        // This happens when you find a zero-length match
        if (result.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      } else if (!wrappedOver) {
        // We need to wrap around to the back if we reach the end.
        regex.lastIndex = 0;
        wrappedOver = true;
      } else {
        break;
      }
    }

    // TODO: we know the order of matches; this sort is lazy and could become a bottleneck if we increase the max # of matches
    matchRanges.sort((x, y) => (x.start.isBefore(y.start) ? -1 : 1));
    this.matchRanges.set(document.fileName, {
      version: document.version,
      ranges: matchRanges,
    });
    return matchRanges;
  }

  /**
   * The position of the next search.
   * match == false if there is no match.
   *
   * Pass in -1 as direction to reverse the direction we search.
   */
  public getNextSearchMatchPosition(
    editor: vscode.TextEditor,
    startPosition: Position,
    direction = SearchDirection.Forward
  ): { pos: Position; match: boolean; index: number } | undefined {
    const nextMatch = this.getNextSearchMatchRange(editor, startPosition, direction);
    if (nextMatch === undefined) {
      return undefined;
    }
    const { start, end, match, index } = nextMatch;

    let pos = start;
    if (this.offset) {
      if (this.offset.type === 'line') {
        pos = start.add(editor.document, PositionDiff.newBOLDiff(this.offset.num));
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
    editor: vscode.TextEditor,
    startPosition: Position,
    direction = SearchDirection.Forward
  ): { start: Position; end: Position; match: boolean; index: number } | undefined {
    const matchRanges = this.recalculateSearchRanges(editor);

    if (matchRanges.length === 0) {
      // TODO(bell)
      return { start: startPosition, end: startPosition, match: false, index: -1 };
    }

    const effectiveDirection = (direction * this.searchDirection) as SearchDirection;

    if (effectiveDirection === SearchDirection.Forward) {
      for (const [index, matchRange] of matchRanges.entries()) {
        if (matchRange.start.isAfter(startPosition)) {
          return {
            start: matchRange.start,
            end: matchRange.end,
            match: true,
            index,
          };
        }
      }
      // We've hit the bottom of the file. Wrap around if configured to do so, or return undefined.
      // TODO(bell)
      if (configuration.wrapscan) {
        const range = matchRanges[0];
        return {
          start: range.start,
          end: range.end,
          match: true,
          index: 0,
        };
      } else {
        return undefined;
      }
    } else {
      for (const [index, matchRange] of matchRanges.slice(0).reverse().entries()) {
        if (matchRange.end.isBeforeOrEqual(startPosition)) {
          return {
            start: matchRange.start,
            end: matchRange.end,
            match: true,
            index: matchRanges.length - index - 1,
          };
        }
      }

      // We've hit the top of the file. Wrap around if configured to do so, or return undefined.
      // TODO(bell)
      if (configuration.wrapscan) {
        const range = matchRanges[matchRanges.length - 1];
        return {
          start: range.start,
          end: range.end,
          match: true,
          index: matchRanges.length - 1,
        };
      } else {
        return undefined;
      }
    }
  }

  public getSearchMatchRangeOf(
    editor: vscode.TextEditor,
    pos: Position
  ): { start: Position; end: Position; match: boolean; index: number } {
    const matchRanges = this.recalculateSearchRanges(editor);

    if (matchRanges.length === 0) {
      // TODO(bell)
      return { start: pos, end: pos, match: false, index: -1 };
    }

    for (const [index, matchRange] of matchRanges.entries()) {
      if (matchRange.start.isBeforeOrEqual(pos) && matchRange.end.isAfter(pos)) {
        return {
          start: matchRange.start,
          end: matchRange.end,
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
    { isRegex = false, ignoreSmartcase = false } = {},
    currentMode: Mode
  ) {
    this.searchDirection = direction;
    this.cursorStartPosition = startPosition;
    this.isRegex = isRegex;
    this.ignoreSmartcase = ignoreSmartcase;
    this.searchString = searchString;
    this.previousMode = currentMode;
  }
}
