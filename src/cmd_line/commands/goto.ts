import { optWhitespace, Parser } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import { numberParser } from '../../vimscript/parserUtils';

export class GotoCommand extends ExCommand {
  public static readonly argParser: Parser<GotoCommand> = optWhitespace
    .then(numberParser.fallback(undefined))
    .map((count) => new GotoCommand(count));

  private offset?: number;
  constructor(offset?: number) {
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
