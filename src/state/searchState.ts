import { Position, Range } from 'vscode';

import { configuration } from '../configuration/configuration';
import { Pattern, SearchDirection, SearchOffset, searchStringParser } from '../vimscript/pattern';
import { VimState } from './vimState';

/**
 * State involved with beginning a search (/).
 */
export class SearchState {
  constructor(
    direction: SearchDirection,
    startPosition: Position,
    searchString = '',
    { ignoreSmartcase = false } = {}
  ) {
    this._searchString = searchString;

    const result = searchStringParser({ direction, ignoreSmartcase }).parse(searchString);
    const { pattern, offset } = result.status
      ? result.value
      : { pattern: undefined, offset: undefined };
    this.pattern = pattern;
    this.offset = offset;

    this.cursorStartPosition = startPosition;
    this.ignoreSmartcase = ignoreSmartcase;
  }

  private _searchString: string;
  public pattern?: Pattern;
  private offset?: SearchOffset;

  public readonly cursorStartPosition: Position;

  public get searchString(): string {
    return this._searchString;
  }
  public set searchString(str: string) {
    this._searchString = str;
    const result = searchStringParser({
      direction: this.direction,
      ignoreSmartcase: this.ignoreSmartcase,
    }).parse(str);
    const { pattern, offset } = result.status
      ? result.value
      : { pattern: undefined, offset: undefined };
    if (pattern?.patternString !== this.pattern?.patternString) {
      this.pattern = pattern;
      this.matchRanges.clear();
    }
    this.offset = offset;
  }

  public get direction(): SearchDirection {
    // TODO: Defaulting to forward is wrong - I think storing the direction in the pattern is a mistake
    return this.pattern?.direction ?? SearchDirection.Forward;
  }

  /**
   * Every range in the document that matches the search string.
   *
   * This might not be 100% complete - @see Pattern::MAX_SEARCH_RANGES
   */
  public getMatchRanges(vimState: VimState): Range[] {
    return this.recalculateSearchRanges(vimState);
  }
  private matchRanges: Map<string, { version: number; ranges: Range[] }> = new Map();

  /**
   * If true, an all-lowercase needle will not be treated as case-insensitive, even if smartcase is enabled.
   * This is used for [g]* and [g]#.
   */
  private readonly ignoreSmartcase: boolean;

  private recalculateSearchRanges(vimState: VimState): Range[] {
    if (this.searchString === '' || this.pattern === undefined) {
      return [];
    }

    const document = vimState.document;

    const cached = this.matchRanges.get(document.fileName);
    if (cached?.version === document.version) {
      return cached.ranges;
    }

    // TODO: It's weird to use the active selection for this...
    const matchRanges = this.pattern
      .allMatches(vimState, { fromPosition: vimState.editor.selection.active })
      .map((match) => match.range);

    this.matchRanges.set(document.fileName, {
      version: document.version,
      ranges: matchRanges,
    });

    return matchRanges;
  }

  /**
   * @returns The start of the next match range, after applying the search offset
   */
  public getNextSearchMatchPosition(
    vimState: VimState,
    startPosition: Position,
    direction = SearchDirection.Forward
  ): { pos: Position; index: number } | undefined {
    const nextMatch = this.getNextSearchMatchRange(vimState, startPosition, direction);
    if (nextMatch === undefined) {
      return undefined;
    }
    const { range, index } = nextMatch;

    return { pos: this.offset ? this.offset.apply(range) : range.start, index };
  }

  /**
   * @returns The next match range from the given position and its rank in the document's matches
   *
   * @param direction If `SearchDirection.Backward`, this will search in the opposite of the pattern's direction
   *
   * NOTE: This method does not take the search offset into account
   */
  public getNextSearchMatchRange(
    vimState: VimState,
    fromPosition: Position,
    direction = SearchDirection.Forward
  ): { range: Range; index: number } | undefined {
    const matchRanges = this.recalculateSearchRanges(vimState);

    if (matchRanges.length === 0) {
      return undefined;
    }

    const effectiveDirection = (direction * this.direction) as SearchDirection;

    if (effectiveDirection === SearchDirection.Forward) {
      for (const [index, range] of matchRanges.entries()) {
        if (range.start.isAfter(fromPosition)) {
          return {
            range,
            index,
          };
        }
      }
      // We've hit the bottom of the file. Wrap around if configured to do so, or return undefined.
      if (configuration.wrapscan) {
        const range = matchRanges[0];
        return {
          range,
          index: 0,
        };
      } else {
        return undefined;
      }
    } else {
      for (const [index, range] of matchRanges.slice(0).reverse().entries()) {
        if (range.end.isBeforeOrEqual(fromPosition)) {
          return {
            range,
            index: matchRanges.length - index - 1,
          };
        }
      }

      // We've hit the top of the file. Wrap around if configured to do so, or return undefined.
      if (configuration.wrapscan) {
        const range = matchRanges[matchRanges.length - 1];
        return {
          range,
          index: matchRanges.length - 1,
        };
      } else {
        return undefined;
      }
    }
  }

  /**
   * @returns the match range which contains the given Position, or undefined if none exists
   */
  public findContainingMatchRange(
    vimState: VimState,
    pos: Position
  ): { range: Range; index: number } | undefined {
    const matchRanges = this.recalculateSearchRanges(vimState);

    if (matchRanges.length === 0) {
      return undefined;
    }

    for (const [index, range] of matchRanges.entries()) {
      if (range.start.isBeforeOrEqual(pos) && range.end.isAfter(pos)) {
        return {
          range,
          index,
        };
      }
    }

    return undefined;
  }
}
