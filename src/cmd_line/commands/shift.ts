import { Position, Selection } from 'vscode';

import { optWhitespace, Parser, seq, string } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';
import { numberParser } from '../../vimscript/parserUtils';
import { PositionDiff } from '../../common/motion/position';

export type ShiftDirection = '>' | '<';
export type ShiftArgs = {
  dir: '>' | '<';
  depth: number;
  numLines: number | undefined;
};

export class ShiftCommand extends ExCommand {
  public static readonly argParser = (dir: '>' | '<'): Parser<ShiftCommand> =>
    optWhitespace
      .then(
        seq(
          // `:>>>` indents 3 times `shiftwidth`
          string(dir)
            .many()
            .map((shifts) => shifts.length + 1)
            .skip(optWhitespace),
          // `:> 2` indents 2 lines
          numberParser.fallback(undefined),
        ),
      )
      .map(([depth, numLines]) => new ShiftCommand({ dir, depth, numLines }));

  private args: ShiftArgs;
  constructor(args: ShiftArgs) {
    super();
    this.args = args;
  }

  public async execute(vimState: VimState): Promise<void> {
    this.executeWithRange(vimState, new LineRange(new Address({ type: 'current_line' })));
  }

  public override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    let { start, end } = range.resolve(vimState);
    if (this.args.numLines !== undefined) {
      start = end;
      end = start + this.args.numLines;
    }

    vimState.editor.selection = new Selection(new Position(start, 0), new Position(end, 0));
    for (let i = 0; i < this.args.depth; i++) {
      if (this.args.dir === '>') {
        vimState.recordedState.transformer.vscodeCommand('editor.action.indentLines');
      } else if (this.args.dir === '<') {
        vimState.recordedState.transformer.vscodeCommand('editor.action.outdentLines');
      }
    }

    vimState.recordedState.transformer.moveCursor(PositionDiff.startOfLine());
  }
}
