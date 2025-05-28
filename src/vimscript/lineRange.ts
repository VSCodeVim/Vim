// eslint-disable-next-line id-denylist
import { alt, any, optWhitespace, Parser, seq, string, succeed } from 'parsimmon';
import { Position, Range } from 'vscode';
import { ErrorCode, VimError } from '../error';
import { globalState } from '../state/globalState';
import { SearchState } from '../state/searchState';
import { VimState } from '../state/vimState';
import { numberParser } from './parserUtils';
import { Pattern, SearchDirection } from './pattern';

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
      pattern: Pattern;
    }
  | {
      // ?{pattern}[?]
      type: 'pattern_prev';
      pattern: Pattern;
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

const lineSpecifierParser: Parser<LineSpecifier> = alt<LineSpecifier>(
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
  string('/')
    .then(Pattern.parser({ direction: SearchDirection.Forward }))
    .map((pattern) => {
      return {
        type: 'pattern_next',
        pattern,
      };
    }),
  string('?')
    .then(Pattern.parser({ direction: SearchDirection.Backward }))
    .map((pattern) => {
      return {
        type: 'pattern_prev',
        pattern,
      };
    }),
  string('\\/').result({ type: 'last_search_pattern_next' }),
  string('\\?').result({ type: 'last_search_pattern_prev' }),
  string('\\&').result({ type: 'last_substitute_pattern_next' }),
);

const offsetParser: Parser<number> = alt(
  string('+').then(numberParser.fallback(1)),
  string('-')
    .then(numberParser.fallback(1))
    .map((num) => -num),
  numberParser,
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
    seq(succeed({ type: 'current_line' as const }), offsetParser),
  ).map(([specifier, offset]) => {
    return new Address(specifier, offset);
  });

  public resolve(vimState: VimState, side: 'left' | 'right', boundsCheck = true): number {
    const line = (() => {
      switch (this.specifier.type) {
        case 'number':
          if (boundsCheck) {
            return this.specifier.num ? this.specifier.num - 1 : 0;
          } else {
            return this.specifier.num - 1;
          }
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
          if (!mark || (mark.isUppercaseMark && mark.document !== vimState.document)) {
            throw VimError.fromCode(ErrorCode.MarkNotSet);
          }
          return mark.position.line;
        case 'pattern_next':
          const m = this.specifier.pattern.nextMatch(
            vimState.document,
            vimState.cursorStopPosition,
          );
          if (m === undefined) {
            // TODO: throw proper errors for nowrapscan
            throw VimError.fromCode(
              ErrorCode.PatternNotFound,
              this.specifier.pattern.patternString,
            );
          } else {
            return m.start.line;
          }
        case 'pattern_prev':
          throw new Error('Using a backward pattern in a line range is not yet supported'); // TODO
        case 'last_search_pattern_next':
          if (!globalState.searchState) {
            throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
          }
          const nextMatch = globalState.searchState.getNextSearchMatchPosition(
            vimState,
            vimState.cursorStopPosition,
            SearchDirection.Forward,
          );
          if (nextMatch === undefined) {
            // TODO: throw proper errors for nowrapscan
            throw VimError.fromCode(
              ErrorCode.PatternNotFound,
              globalState.searchState.searchString,
            );
          }
          return nextMatch.pos.line;
        case 'last_search_pattern_prev':
          if (!globalState.searchState) {
            throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
          }
          const prevMatch = globalState.searchState.getNextSearchMatchPosition(
            vimState,
            vimState.cursorStopPosition,
            SearchDirection.Backward,
          );
          if (prevMatch === undefined) {
            // TODO: throw proper errors for nowrapscan
            throw VimError.fromCode(
              ErrorCode.PatternNotFound,
              globalState.searchState.searchString,
            );
          }
          return prevMatch.pos.line;
        case 'last_substitute_pattern_next':
          if (!globalState.substituteState) {
            throw VimError.fromCode(ErrorCode.NoPreviousSubstituteRegularExpression);
          }
          const searchState = globalState.substituteState.searchPattern
            ? new SearchState(
                SearchDirection.Forward,
                vimState.cursorStopPosition,
                globalState.substituteState.searchPattern.patternString,
                {},
              )
            : undefined;
          const match = searchState?.getNextSearchMatchPosition(
            vimState,
            vimState.cursorStopPosition,
          );
          if (match === undefined) {
            // TODO: throw proper errors for nowrapscan
            throw VimError.fromCode(ErrorCode.PatternNotFound, searchState?.searchString);
          }
          return match.pos.line;
        default:
          const guard: never = this.specifier;
          throw new Error('Got unexpected LineSpecifier.type');
      }
    })();
    const result = line + this.offset;
    if (boundsCheck && (result < 0 || result > vimState.document.lineCount)) {
      throw VimError.fromCode(ErrorCode.InvalidRange);
    }
    return result;
  }

  public toString(): string {
    switch (this.specifier.type) {
      case 'number':
        return this.specifier.num.toString();
      case 'current_line':
        return '.';
      case 'last_line':
        return '$';
      case 'entire_file':
        return '%';
      case 'last_visual_range':
        return '*';
      case 'mark':
        return `'${this.specifier.mark}`;
      case 'pattern_next':
        return `/${this.specifier.pattern}/`;
      case 'pattern_prev':
        return `?${this.specifier.pattern}?`;
      case 'last_search_pattern_next':
        return '\\/';
      case 'last_search_pattern_prev':
        return '\\?';
      case 'last_substitute_pattern_next':
        return '\\&';
      default:
        const guard: never = this.specifier;
        throw new Error('Got unexpected LineSpecifier.type');
    }
  }
}

export class LineRange {
  private readonly start: Address;
  private readonly end?: Address;
  public readonly separator?: ',' | ';';

  constructor(start: Address, separator?: ',' | ';', end?: Address) {
    this.start = start;
    this.end = end;
    this.separator = separator;
  }

  public static parser: Parser<LineRange> = alt(
    seq(
      // with the start line
      Address.parser.skip(optWhitespace),
      seq(
        alt(string(','), string(';')).skip(optWhitespace),
        Address.parser.fallback(undefined),
      ).fallback(undefined),
    ).map(([start, sepEnd]) => {
      if (sepEnd) {
        const [sep, end] = sepEnd;
        return new LineRange(start, sep, end);
      }
      return new LineRange(start);
    }),
    seq(
      // without the start line
      alt(string(','), string(';')).skip(optWhitespace),
      Address.parser.fallback(undefined),
    ).map((sepEnd) => {
      const [sep, end] = sepEnd;
      return new LineRange(new Address({ type: 'current_line' }), sep, end);
    }),
  );

  public resolve(vimState: VimState): { start: number; end: number } {
    // TODO: *,4 is not a valid range
    const end = this.end ?? this.start;

    if (end.specifier.type === 'entire_file') {
      return { start: 0, end: vimState.document.lineCount - 1 };
    } else if (end.specifier.type === 'last_visual_range') {
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
    const right = end.resolve(vimState, 'right');
    if (left > right) {
      // Reverse the range to keep start < end
      // NOTE: Vim generally makes you confirm before doing this, but we do it automatically.
      return {
        start: end.resolve(vimState, 'left'),
        end: this.start.resolve(vimState, 'right'),
      };
    } else {
      return {
        start: left,
        end: end.resolve(vimState, 'right'),
      };
    }
  }

  public resolveToRange(vimState: VimState): Range {
    const { start, end } = this.resolve(vimState);
    return new Range(new Position(start, 0), new Position(end, 0).getLineEnd());
  }

  public toString(): string {
    return `${this.start.toString()}${this.separator ?? ''}${this.end?.toString() ?? ''}`;
  }
}
