import { optWhitespace, Parser, seq, whitespace } from 'parsimmon';
import { Position } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { numberParser } from '../../vimscript/parserUtils';
import { Pattern, PatternMatch, SearchDirection } from '../../vimscript/pattern';

export class CursorCommand extends ExCommand {
  public static readonly CURSOR_HERE = '[$]{0}';
  public override isRepeatableWithDot: boolean = false;
  private readonly count: number | undefined; // undefined mean all matches.
  private readonly pattern: Pattern;
  public static readonly argParser: Parser<CursorCommand> = optWhitespace
    .then(
      seq(
        numberParser.skip(whitespace).fallback(-1),
        Pattern.parser({ direction: SearchDirection.Forward })
      )
    )
    .map(([c, sp]) => new CursorCommand(c, sp));

  constructor(count: number, pattern: Pattern) {
    super();
    this.count = count === -1 ? undefined : count;
    this.pattern = pattern;
  }

  cursorFromMatches(matches: PatternMatch[]): Cursor[] {
    const pattern = this.pattern;

    const matchToPosition = pattern.patternString.includes(CursorCommand.CURSOR_HERE)
      ? (match: PatternMatch): Position[] => {
          const groupBetweenCursorRegex = new RegExp(
            pattern.patternString
              .split(CursorCommand.CURSOR_HERE)
              .slice(undefined, -1)
              .map((s) => `(${s})`)
              .join('')
          );
          const groupedMatches = groupBetweenCursorRegex.exec(match.groups[0]);
          const cursorPositions =
            groupedMatches?.slice(1).reduce((acc: Position[], v): Position[] => {
              const pos = acc[acc.length - 1] ?? match.range.start;
              return [...acc, pos.advancePositionByText(v)];
            }, []) ?? [];
          return cursorPositions;
        }
      : (match: PatternMatch): Position[] => {
          return [match.range.start];
        };

    return matches.flatMap(matchToPosition).map((p) => new Cursor(p, p));
  }

  async execute(vimState: VimState): Promise<void> {
    const allMatches = this.pattern.allMatches(vimState, {
      fromPosition: vimState.editor.selection.active,
      maxResults: this.count,
    });
    vimState.cursors = this.cursorFromMatches(allMatches);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const allMatches = this.pattern.allMatches(vimState, {
      lineRange: range,
      maxResults: this.count,
    });
    vimState.cursors = this.cursorFromMatches(allMatches);
  }
}
