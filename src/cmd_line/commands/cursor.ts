import { optWhitespace, Parser, seq, whitespace } from "parsimmon";
import { Position } from "vscode";
import { Cursor } from "../../common/motion/cursor";
import { VimState } from "../../state/vimState";
import { ExCommand } from "../../vimscript/exCommand";
import { numberParser } from "../../vimscript/parserUtils";
import { Pattern, PatternMatch, SearchDirection } from "../../vimscript/pattern"


export class CursorCommand extends ExCommand {
  public static readonly CURSOR_HERE = "[$]{0}";
  public override isRepeatableWithDot: boolean = false;
  private readonly count: number | undefined; // undefined mean all matches.
  private readonly pattern: Pattern;
  public static readonly argParser: Parser<CursorCommand> = optWhitespace.
    then(
      seq(
        numberParser.skip(whitespace).fallback(-1),
        Pattern.parser({ direction: SearchDirection.Forward })
      )
    ).map(([c, sp]) => new CursorCommand(c, sp));

  constructor(count: number, pattern: Pattern) {
    super();
    this.count = count === -1 ? undefined : count;
    this.pattern = pattern;
  }

  async execute(vimState: VimState): Promise<void> {
    const allMatches = this.pattern.allMatches(vimState, { fromPosition: vimState.editor.selection.active, maxResults: this.count });
    const pattern = this.pattern;

    const matchToPosition = pattern.patternString.includes(CursorCommand.CURSOR_HERE) ?
      (match: PatternMatch): Position[] => {
        const splitted = pattern.patternString.split(CursorCommand.CURSOR_HERE).slice(undefined, -1);
        const positions = splitted.reduce((acc: Position[], curr) => {
          if (acc.length === 0) return [match.range.start.advancePositionByText(curr)];
          else return [...acc, acc[acc.length - 1].advancePositionByText(curr)];
        }, []);
        return positions;
      }
      : (match: PatternMatch): Position[] => {
        return [match.range.start];
      }

    vimState.cursors = allMatches.flatMap(matchToPosition).map(p => new Cursor(p, p));
  }

}