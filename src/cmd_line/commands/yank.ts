// eslint-disable-next-line id-denylist
import { alt, any, optWhitespace, Parser, seq, whitespace } from 'parsimmon';
import { Position } from 'vscode';
import { YankOperator } from '../../actions/operator';
import { RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { numberParser } from '../../vimscript/parserUtils';

export interface YankCommandArguments {
  register?: string;
  count?: number;
}

export class YankCommand extends ExCommand {
  public static readonly argParser: Parser<YankCommand> = optWhitespace.then(
    alt(
      numberParser.map((count) => {
        return { register: undefined, count };
      }),
      // eslint-disable-next-line id-denylist
      seq(any.fallback(undefined), whitespace.then(numberParser).fallback(undefined)).map(
        ([register, count]) => {
          return { register, count };
        },
      ),
    ).map(
      ({ register, count }) =>
        new YankCommand({
          register,
          count,
        }),
    ),
  );

  private readonly arguments: YankCommandArguments;
  constructor(args: YankCommandArguments) {
    super();
    this.arguments = args;
  }

  private async yank(vimState: VimState, start: Position, end: Position) {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    if (this.arguments.register) {
      vimState.recordedState.registerName = this.arguments.register;
    }

    const cursorPosition = vimState.cursorStopPosition;

    await new YankOperator().run(vimState, start.getLineBegin(), end.getLineEnd());

    // YankOperator moves the cursor - undo that
    vimState.cursorStopPosition = cursorPosition;
  }

  async execute(vimState: VimState): Promise<void> {
    const linesToYank = this.arguments.count ?? 1;
    const startPosition = vimState.cursorStartPosition;
    const endPosition = linesToYank
      ? startPosition.getDown(linesToYank - 1).getLineEnd()
      : vimState.cursorStopPosition;
    await this.yank(vimState, startPosition, endPosition);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    /**
     * If a [cnt] and [range] is specified (e.g. :.+2y3), :yank [cnt] is called from
     * the end of the [range].
     * Ex. if two lines are VisualLine highlighted, :<,>y3 will :y3
     * from the end of the selected lines.
     */
    const { start, end } = range.resolve(vimState);
    if (this.arguments.count) {
      vimState.cursorStartPosition = new Position(end, 0);
      await this.execute(vimState);
      return;
    }

    await this.yank(vimState, new Position(start, 0), new Position(end, 0));
  }
}
