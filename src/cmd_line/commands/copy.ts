import { Position, Range } from 'vscode';
import { PositionDiff } from '../../common/motion/position';
import { ErrorCode, VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import * as node from '../node';
import { Scanner } from '../scanner';

export class CopyCommand extends node.CommandBase {
  public static parse(args: string): CopyCommand {
    if (args.trim() === '') {
      return new CopyCommand();
    }

    const scanner = new Scanner(args);
    // TODO: dest should be parsed as a range (and all the special stuff that goes along with that, i.e. % or 'a)
    const dest = parseInt(scanner.nextWord(), 10);
    if (isNaN(dest) || !scanner.isAtEof) {
      throw VimError.fromCode(ErrorCode.TrailingCharacters);
    }

    return new CopyCommand(dest);
  }

  private dest?: number;
  private constructor(dest?: number) {
    super();
    this.dest = dest;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  private copyLines(vimState: VimState, sourceStart: number, sourceEnd: number) {
    if (this.dest === undefined || this.dest < 0 || this.dest > vimState.document.lineCount) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.InvalidAddress));
      return;
    }

    if (sourceEnd < sourceStart) {
      [sourceStart, sourceEnd] = [sourceEnd, sourceStart];
    }

    const copiedText = vimState.document.getText(
      new Range(new Position(sourceStart, 0), new Position(sourceEnd, 0).getLineEnd())
    );

    let text: string;
    let position: Position;
    if (this.dest === 0) {
      text = copiedText + '\n';
      position = new Position(0, 0);
    } else {
      text = '\n' + copiedText;
      position = new Position(this.dest - 1, 0).getLineEnd();
    }

    const lines = copiedText.split('\n');
    const cursorPosition = new Position(
      this.dest - 1 + lines.length,
      lines[lines.length - 1].match(/\S/)?.index ?? 0
    );

    vimState.recordedState.transformer.addTransformation({
      type: 'insertText',
      position,
      text,
      diff: PositionDiff.exactPosition(cursorPosition),
    });
  }

  public async execute(vimState: VimState): Promise<void> {
    const line = vimState.cursors[0].stop.line;
    this.copyLines(vimState, line, line);
  }

  public override async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);
    this.copyLines(vimState, start, end);
  }
}
