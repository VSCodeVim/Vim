import { optWhitespace, Parser } from 'parsimmon';
import { Position, Range } from 'vscode';
import { PositionDiff } from '../../common/motion/position';
import { ErrorCode, VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';

export class MoveCommand extends ExCommand {
  public static readonly argParser: Parser<MoveCommand> = optWhitespace
    .then(Address.parser.fallback(undefined))
    .map((address) => new MoveCommand(address));

  private address?: Address;
  constructor(address?: Address) {
    super();
    this.address = address;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  private moveLines(vimState: VimState, sourceStart: number, sourceEnd: number) {
    const dest = this.address?.resolve(vimState, 'left', false);
    if (dest === undefined || dest < -1 || dest > vimState.document.lineCount) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.InvalidAddress));
      return;
    }

    if (sourceEnd < sourceStart) {
      [sourceStart, sourceEnd] = [sourceEnd, sourceStart];
    }
    /* make sure
    1. not move a range to the place inside itself.
    2. not move a range to the place right below or above itself, which leads to no change.
    */
    if (dest >= sourceStart && dest <= sourceEnd) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.InvalidAddress));
      return;
    }

    // copy
    const copiedText = vimState.document.getText(
      new Range(new Position(sourceStart, 0), new Position(sourceEnd, 0).getLineEnd()),
    );

    let text: string;
    let position: Position;
    if (dest === -1) {
      text = copiedText + '\n';
      position = new Position(0, 0);
    } else {
      text = '\n' + copiedText;
      position = new Position(dest, 0).getLineEnd();
    }

    const lines = copiedText.split('\n');
    let cursorPosition: Position;
    if (dest > sourceEnd) {
      // make the cursor position at the beginning of the endline.
      cursorPosition = new Position(Math.max(dest, 0), lines.at(-1)!.match(/\S/)?.index ?? 0);
    } else {
      cursorPosition = new Position(
        Math.max(dest + lines.length, 0),
        lines.at(-1)!.match(/\S/)?.index ?? 0,
      );
    }
    // delete
    let start = new Position(sourceStart, 0);
    let end = new Position(sourceEnd, 0).getLineEndIncludingEOL();

    if (sourceEnd < vimState.document.lineCount - 1) {
      end = end.getRightThroughLineBreaks();
    } else if (sourceStart > 0) {
      start = start.getLeftThroughLineBreaks();
    }
    vimState.recordedState.transformer.addTransformation({
      type: 'deleteRange',
      range: new Range(start, end),
      manuallySetCursorPositions: true,
    });

    // insert
    vimState.recordedState.transformer.insert(
      position,
      text,
      PositionDiff.exactPosition(cursorPosition),
    );
  }

  public async execute(vimState: VimState): Promise<void> {
    const line = vimState.cursors[0].stop.line;
    this.moveLines(vimState, line, line);
  }

  public override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { start, end } = range.resolve(vimState);
    this.moveLines(vimState, start, end);
  }
}
