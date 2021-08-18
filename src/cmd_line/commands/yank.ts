import { Position } from 'vscode';
import { YankOperator } from '../../actions/operator';
import { RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { CommandBase, LineRange } from '../node';
import { Scanner } from '../scanner';

export interface YankCommandArguments {
  linesToYank?: number;
  register?: string;
}

export class YankCommand extends CommandBase {
  private readonly arguments: YankCommandArguments;

  constructor(args: YankCommandArguments) {
    super();
    this.arguments = args;
  }

  public static parse(args: string): YankCommand {
    if (!args || !args.trim()) {
      return new YankCommand({});
    }
    /**
     * :y[ank] [register] [cnt]
     * :y[ank] [cnt] (if the first argument is a number)
     */
    const scanner = new Scanner(args);
    const arg1 = scanner.nextWord(); // [cnt] or [register]
    const arg2 = scanner.nextWord(); // [cnt] or EOF

    let register;
    let linesToYank;

    if (isNaN(+arg1)) {
      register = arg1;
      linesToYank = isNaN(+arg2) ? 1 : +arg2;
    } else {
      linesToYank = +arg1;
    }

    return new YankCommand({
      register,
      linesToYank,
    });
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
    const linesToYank = this.arguments.linesToYank;
    if (linesToYank === undefined) {
      return await this.yank(vimState, vimState.cursorStartPosition, vimState.cursorStopPosition);
    }
    const startPosition = vimState.cursorStartPosition;
    const endPosition = startPosition.getDown(linesToYank - 1).getLineEnd();
    await this.yank(vimState, startPosition, endPosition);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);
    await this.yank(vimState, new Position(start, 0), new Position(end, 0));
  }
}
