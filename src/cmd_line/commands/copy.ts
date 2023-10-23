import { optWhitespace, Parser } from 'parsimmon';
import { Position, Range } from 'vscode';
import { PositionDiff } from '../../common/motion/position';
import { ErrorCode, VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';
import { Address, LineRange } from '../../vimscript/lineRange';

export class CopyCommand extends ExCommand {
  public static readonly argParser: Parser<CopyCommand> = optWhitespace
    .then(Address.parser.fallback(undefined))
    .map((address) => new CopyCommand(address));

  private address?: Address;
  constructor(address?: Address) {
    super();
    this.address = address;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  private copyLines(vimState: VimState, sourceStart: number, sourceEnd: number) {
    const dest = this.address?.resolve(vimState, 'left', false);
    if (dest === undefined || dest < -1 || dest > vimState.document.lineCount) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.InvalidAddress));
      return;
    }

    if (sourceEnd < sourceStart) {
      [sourceStart, sourceEnd] = [sourceEnd, sourceStart];
    }

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
    const cursorPosition = new Position(
      Math.max(dest + lines.length, 0),
      lines[lines.length - 1].match(/\S/)?.index ?? 0,
    );

    vimState.recordedState.transformer.insert(
      position,
      text,
      PositionDiff.exactPosition(cursorPosition),
    );
  }

  public async execute(vimState: VimState): Promise<void> {
    const line = vimState.cursors[0].stop.line;
    this.copyLines(vimState, line, line);
  }

  public override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const { start, end } = range.resolve(vimState);
    this.copyLines(vimState, start, end);
  }
}
