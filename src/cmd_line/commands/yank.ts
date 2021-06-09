import { Position } from 'vscode';
import { YankOperator } from '../../actions/operator';
import { RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { CommandBase, LineRange } from '../node';
import { Scanner } from '../scanner';

export class YankCommand extends CommandBase {
  private register?: string;

  constructor(register?: string) {
    super();
    this.register = register;
  }

  public static parse(args: string): YankCommand {
    const scanner = new Scanner(args);
    scanner.skipWhiteSpace();
    return new YankCommand(scanner.isAtEof ? undefined : scanner.nextWord());
  }

  private async yank(vimState: VimState, start: Position, end: Position) {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    if (this.register) {
      vimState.recordedState.registerName = this.register;
    }

    const cursorPosition = vimState.cursorStopPosition;

    await new YankOperator().run(vimState, start.getLineBegin(), end.getLineEnd());

    // YankOperator moves the cursor - undo that
    vimState.cursorStopPosition = cursorPosition;
  }

  async execute(vimState: VimState): Promise<void> {
    await this.yank(vimState, vimState.cursorStartPosition, vimState.cursorStopPosition);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);
    await this.yank(vimState, new Position(start, 0), new Position(end, 0));
  }
}
