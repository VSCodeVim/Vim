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

  async execute(vimState: VimState): Promise<void> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    if (this.register) {
      vimState.recordedState.registerName = this.register;
    }

    await new YankOperator().run(
      vimState,
      vimState.cursorStartPosition.getLineBegin(),
      vimState.cursorStopPosition.getLineEnd()
    );
  }

  async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    if (this.register) {
      vimState.recordedState.registerName = this.register;
    }

    const [start, end] = range.resolve(vimState);
    await new YankOperator().run(
      vimState,
      new Position(start, 0),
      new Position(end, 0).getLineEnd()
    );
  }
}
