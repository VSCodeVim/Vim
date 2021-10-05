import { ErrorCode, VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { Scanner } from '../scanner';

export class GotoCommand extends ExCommand {
  public static parseArgs(args: string): GotoCommand {
    if (args.trim() === '') {
      return new GotoCommand();
    }

    const scanner = new Scanner(args);
    const offset = parseInt(scanner.nextWord(), 10);
    if (isNaN(offset)) {
      throw VimError.fromCode(ErrorCode.TrailingCharacters);
    }
    return new GotoCommand(offset);
  }

  private offset?: number;
  private constructor(offset?: number) {
    super();
    this.offset = offset;
  }

  private gotoOffset(vimState: VimState, offset: number) {
    vimState.cursorStopPosition = vimState.document.positionAt(offset);
  }

  public async execute(vimState: VimState): Promise<void> {
    this.gotoOffset(vimState, this.offset ?? 0);
  }

  public override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    if (this.offset === undefined) {
      this.offset = range.resolve(vimState)?.end ?? 0;
    }
    this.gotoOffset(vimState, this.offset);
  }
}
