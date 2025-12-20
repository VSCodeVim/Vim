import { Position, Range } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { PositionDiff, sorted } from '../../common/motion/position';
import { NumericString } from '../../common/number/numericString';
import {
  Mode,
  isVisualMode,
  visualBlockGetBottomRightPosition,
  visualBlockGetTopLeftPosition,
} from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { BaseCommand, RegisterAction } from '../base';

abstract class IncrementDecrementNumberAction extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  override createsUndoPoint = true;
  abstract offset: number;
  abstract staircase: boolean;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const ranges = this.getSearchRanges(vimState);

    let stepNum = 1;

    for (const [idx, range] of ranges.entries()) {
      position = range.start;

      const text = vimState.document.lineAt(position).text;

      // Make sure position within the text is possible and return if not
      if (text.length <= position.character) {
        continue;
      }

      // Start looking to the right for the next word to increment, unless we're
      // already on a word to increment, in which case start at the beginning of
      // that word.
      const whereToStart = text[position.character].match(/\s/)
        ? position
        : position.prevWordStart(vimState.document, { inclusive: true });

      wordLoop: for (let { start, end, word } of TextEditor.iterateWords(
        vimState.document,
        whereToStart,
      )) {
        if (start.isAfter(range.stop)) {
          break;
        }

        // '-' doesn't count as a word, but is important to include in parsing
        // the number, as long as it is not just part of the word (-foo2 for example)
        if (text[start.character - 1] === '-' && /\d/.test(text[start.character])) {
          start = start.getLeft();
          word = text[start.character] + word;
        }
        // Strict number parsing so "1a" doesn't silently get converted to "1"
        do {
          const result = NumericString.parse(word);
          if (result === undefined) {
            break;
          }
          const { num, suffixOffset } = result;

          // Use suffix offset to check if current cursor is in or before detected number.
          if (position.character < start.character + suffixOffset) {
            const pos = await this.replaceNum(
              vimState,
              num,
              this.offset * stepNum * (vimState.recordedState.count || 1),
              start,
              end,
            );

            if (this.staircase) {
              stepNum++;
            }

            if (vimState.currentMode === Mode.Normal) {
              vimState.recordedState.transformer.moveCursor(
                PositionDiff.exactPosition(pos.getLeft(num.suffix.length)),
              );
            }
            break wordLoop;
          } else {
            // For situation like this: xyz1999em199[cursor]9m
            word = word.slice(suffixOffset);
            start = new Position(start.line, start.character + suffixOffset);
          }
        } while (true);
      }
    }

    if (isVisualMode(vimState.currentMode)) {
      vimState.recordedState.transformer.moveCursor(PositionDiff.exactPosition(ranges[0].start));
    }

    await vimState.setCurrentMode(Mode.Normal);
  }

  private async replaceNum(
    vimState: VimState,
    start: NumericString,
    offset: number,
    startPos: Position,
    endPos: Position,
  ): Promise<Position> {
    const oldLength = endPos.character + 1 - startPos.character;
    start.value += offset;
    const newNum = start.toString();

    const range = new Range(startPos, endPos.getRight());

    vimState.recordedState.transformer.replace(range, newNum);
    if (oldLength !== newNum.length) {
      // Adjust end position according to difference in width of number-string
      endPos = new Position(endPos.line, startPos.character + newNum.length - 1);
    }

    return endPos;
  }

  /**
   * @returns a list of Ranges in which to search for numbers
   */
  private getSearchRanges(vimState: VimState): Cursor[] {
    const ranges: Cursor[] = [];
    const [start, stop] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    switch (vimState.currentMode) {
      case Mode.Normal: {
        ranges.push(
          new Cursor(vimState.cursorStopPosition, vimState.cursorStopPosition.getLineEnd()),
        );
        break;
      }

      case Mode.Visual: {
        ranges.push(new Cursor(start, start.getLineEnd()));
        for (let line = start.line + 1; line < stop.line; line++) {
          const lineStart = new Position(line, 0);
          ranges.push(new Cursor(lineStart, lineStart.getLineEnd()));
        }
        ranges.push(new Cursor(stop.getLineBegin(), stop));
        break;
      }

      case Mode.VisualLine: {
        for (let line = start.line; line <= stop.line; line++) {
          const lineStart = new Position(line, 0);
          ranges.push(new Cursor(lineStart, lineStart.getLineEnd()));
        }
        break;
      }

      case Mode.VisualBlock: {
        const topLeft = visualBlockGetTopLeftPosition(start, stop);
        const bottomRight = visualBlockGetBottomRightPosition(start, stop);
        for (let line = topLeft.line; line <= bottomRight.line; line++) {
          ranges.push(
            new Cursor(
              new Position(line, topLeft.character),
              new Position(line, bottomRight.character),
            ),
          );
        }
        break;
      }

      default:
        throw new Error(
          `Unexpected mode ${vimState.currentMode} in IncrementDecrementNumberAction.getPositions()`,
        );
    }
    return ranges;
  }
}

@RegisterAction
class IncrementNumber extends IncrementDecrementNumberAction {
  keys = ['<C-a>'];
  offset = +1;
  staircase = false;
}

@RegisterAction
class DecrementNumber extends IncrementDecrementNumberAction {
  keys = ['<C-x>'];
  offset = -1;
  staircase = false;
}

@RegisterAction
class IncrementNumberStaircase extends IncrementDecrementNumberAction {
  keys = ['g', '<C-a>'];
  offset = +1;
  staircase = true;
}

@RegisterAction
class DecrementNumberStaircase extends IncrementDecrementNumberAction {
  keys = ['g', '<C-x>'];
  offset = -1;
  staircase = true;
}
