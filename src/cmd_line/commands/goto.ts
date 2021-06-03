import { ErrorCode, VimError } from '../../error';
import { VimState } from '../../state/vimState';
import * as node from '../node';
import { Scanner } from '../scanner';

export class GotoCommand extends node.CommandBase {
  public static parse(args: string): GotoCommand {
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

  public async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    if (this.offset === undefined) {
      // TODO: this isn't perfect (% for instance), but does anyone care?
      this.offset = range.resolve(vimState, false)[1];
    }
    this.gotoOffset(vimState, this.offset);
  }
}
