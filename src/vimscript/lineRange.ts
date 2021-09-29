import { alt, any, optWhitespace, Parser, regexp, seq, string, succeed } from 'parsimmon';
import { Position, Range } from 'vscode';
import { ErrorCode, VimError } from '../error';
import { globalState } from '../state/globalState';
import { SearchDirection, SearchState } from '../state/searchState';
import { VimState } from '../state/vimState';
import { numberParser } from './parserUtils';

/**
 * Specifies the start or end of a line range.
 * See :help {address}
 */
type LineSpecifier =
  | {
      // {number}
      type: 'number';
      num: number;
    }
  | {
      // .
      type: 'current_line';
    }
  | {
      // $
      type: 'last_line';
    }
  | {
      // %
      type: 'entire_file';
    }
  | {
      // *
      type: 'last_visual_range';
    }
  | {
      // 't
      type: 'mark';
      mark: string;
    }
  | {
      // /{pattern}[/]
      type: 'pattern_next';
      pattern: string;
    }
  | {
      // ?{pattern}[?]
      type: 'pattern_prev';
      pattern: string;
    }
  | {
      // \/
      type: 'last_search_pattern_next';
    }
  | {
      // \?
      type: 'last_search_pattern_prev';
    }
  | {
      // \&
      type: 'last_substitute_pattern_next';
    };

const lineSpecifierParser: Parser<LineSpecifier> = alt(
  numberParser.map((num) => {
    return { type: 'number', num };
  }),
  string('.').result({ type: 'current_line' }),
  string('$').result({ type: 'last_line' }),
  string('%').result({ type: 'entire_file' }),
  string('*').result({ type: 'last_visual_range' }),
  string("'")
    .then(any)
    .map((mark) => {
      return { type: 'mark', mark };
    }),
  // TODO: pattern_next
  // TODO: pattern_prev
  string('\\/').result({ type: 'last_search_pattern_next' }),
  string('\\?').result({ type: 'last_search_pattern_prev' }),
  string('\\&').result({ type: 'last_substitute_pattern_next' })
);

const offsetParser: Parser<number> = alt(
  string('+').then(numberParser.fallback(1)),
  string('-')
    .then(numberParser.fallback(1))
    .map((num) => -num),
  numberParser
)
  .skip(optWhitespace)
  .atLeast(1)
  .map((nums) => nums.reduce((x, y) => x + y, 0));

export class Address {
  public readonly specifier: LineSpecifier;
  public readonly offset: number;

  constructor(specifier: LineSpecifier, offset?: number) {
    this.specifier = specifier;
    this.offset = offset ?? 0;
  }

  public static parser: Parser<Address> = alt(
    seq(lineSpecifierParser.skip(optWhitespace), offsetParser.fallback(0)),
    seq(succeed({ type: 'current_line' as const }), offsetParser)
  ).map(([specifier, offset]) => {
    return new Address(specifier, offset);
  });

  public resolve(vimState: VimState, side: 'left' | 'right'): number {
    const line = (() => {
      switch (this.specifier.type) {
        case 'number':
          return this.specifier.num ? this.specifier.num - 1 : 0;
        case 'current_line':
          return vimState.cursorStopPosition.line;
        case 'last_line':
          return vimState.document.lineCount - 1;
        case 'entire_file':
          return vimState.document.lineCount - 1;
        case 'last_visual_range':
          const res =
            side === 'left'
              ? vimState.lastVisualSelection?.start.line
              : vimState.lastVisualSelection?.end.line;
          if (res === undefined) {
            throw VimError.fromCode(ErrorCode.MarkNotSet);
          }
          return res;
        case 'mark':
          const mark = vimState.historyTracker.getMark(this.specifier.mark);
          if (!mark || (mark.document && mark.document !== vimState.document)) {
            throw VimError.fromCode(ErrorCode.MarkNotSet);
          }
          return mark.position.line;
        case 'pattern_next':
          throw new Error('Using a pattern in a line range is not yet supported'); // TODO
        case 'pattern_prev':
          throw new Error('Using a pattern in a line range is not yet supported'); // TODO
        case 'last_search_pattern_next':
          if (!globalState.searchState) {
            throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
          }
          const nextMatch = globalState.searchState.getNextSearchMatchPosition(
            vimState.editor,
            vimState.cursorStopPosition,
            SearchDirection.Forward
          );
          if (nextMatch === undefined) {
            // TODO: throw proper errors for nowrapscan
            throw VimError.fromCode(ErrorCode.PatternNotFound);
          }
          return nextMatch.pos.line;
        case 'last_search_pattern_prev':
          if (!globalState.searchState) {
            throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
          }
          const prevMatch = globalState.searchState.getNextSearchMatchPosition(
            vimState.editor,
            vimState.cursorStopPosition,
            SearchDirection.Backward
          );
          if (prevMatch === undefined) {
            // TODO: throw proper errors for nowrapscan
            throw VimError.fromCode(ErrorCode.PatternNotFound);
          }
          return prevMatch.pos.line;
        case 'last_substitute_pattern_next':
          if (!globalState.substituteState) {
            throw VimError.fromCode(ErrorCode.NoPreviousSubstituteRegularExpression);
          }
          const searchState = new SearchState(
            SearchDirection.Forward,
            vimState.cursorStopPosition,
            globalState.substituteState.searchPattern,
            {},
            vimState.currentMode
          );
          const match = searchState.getNextSearchMatchPosition(
            vimState.editor,
            vimState.cursorStopPosition
          );
          if (match === undefined) {
            // TODO: throw proper errors for nowrapscan
            throw VimError.fromCode(ErrorCode.PatternNotFound);
          }
          return match.pos.line;
        default:
          const guard: never = this.specifier;
          throw new Error('Got unexpected LineSpecifier.type');
      }
    })();
    const result = line + this.offset;
    if (result < 0) {
      throw VimError.fromCode(ErrorCode.InvalidRange);
    }
    return result;
  }
}

export class LineRange {
  private readonly start: Address;
  private readonly end: Address;
  public readonly separator: ',' | ';';

  constructor(start: Address, end?: Address, separator?: ',' | ';') {
    this.start = start;
    this.end = end ?? start;
    this.separator = separator ?? ',';
  }

  public static parser: Parser<LineRange> = seq(
    Address.parser.skip(optWhitespace),
    seq(
      alt(string(','), string(';')).skip(optWhitespace),
      Address.parser.fallback(new Address({ type: 'current_line' }))
    ).fallback(undefined)
  ).map(([start, sepEnd]) => {
    if (sepEnd) {
      const [sep, end] = sepEnd;
      return new LineRange(start, end, sep);
    }
    return new LineRange(start, start);
  });

  public resolve(vimState: VimState): { start: number; end: number } | undefined {
    // TODO: *,4 is not a valid range

    if (this.end.specifier.type === 'entire_file') {
      return { start: 0, end: vimState.document.lineCount - 1 };
    } else if (this.end.specifier.type === 'last_visual_range') {
      if (vimState.lastVisualSelection === undefined) {
        throw VimError.fromCode(ErrorCode.MarkNotSet);
      }
      return {
        start: vimState.lastVisualSelection.start.line,
        end: vimState.lastVisualSelection.end.line,
      };
    }

    const left = this.start.resolve(vimState, 'left');
    if (this.separator === ';') {
      vimState.cursorStartPosition = vimState.cursorStopPosition = new Position(left, 0);
    }
    const right = this.end.resolve(vimState, 'right');
    if (left > right) {
      // Reverse the range to keep start < end
      // NOTE: Vim generally makes you confirm before doing this, but we do it automatically.
      return {
        start: this.end.resolve(vimState, 'left'),
        end: this.start.resolve(vimState, 'right'),
      };
    } else {
      return {
        start: this.start.resolve(vimState, 'left'),
        end: this.end.resolve(vimState, 'right'),
      };
    }
  }

  public resolveToRange(vimState: VimState): Range {
    const { start, end } = this.resolve(vimState)!;
    return new Range(new Position(start, 0), new Position(end, 0).getLineEnd());
  }
}
