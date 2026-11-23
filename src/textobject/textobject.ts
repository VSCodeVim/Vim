import { Position } from 'vscode';
import { RegisterAction } from '../actions/base';
import { BaseMovement, IMovement } from '../actions/baseMotion';
import {
  ExpandingSelection,
  MoveAroundBacktick,
  MoveAroundCurlyBrace,
  MoveAroundDoubleQuotes,
  MoveAroundParentheses,
  MoveAroundSingleQuotes,
  MoveAroundSquareBracket,
  MoveAroundTag,
} from '../actions/motion';
import { Cursor } from '../common/motion/cursor';
import { Mode } from '../mode/mode';
import { RegisterMode } from '../register/register';
import { VimState } from '../state/vimState';
import { TextEditor } from '../textEditor';
import { getCurrentParagraphBeginning, getCurrentParagraphEnd } from './paragraph';
import { WordType } from './word';

export abstract class TextObject extends BaseMovement {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];

  public override async execActionForOperator(
    position: Position,
    vimState: VimState,
  ): Promise<IMovement> {
    const res = await this.execAction(position, vimState);
    // Since we need to handle leading spaces, we cannot use MoveWordBegin.execActionForOperator
    // In normal mode, the character on the stop position will be the first character after the operator executed
    // and we do left-shifting in operator-pre-execution phase, here we need to right-shift the stop position accordingly.
    res.stop = new Position(res.stop.line, res.stop.character + 1);

    return res;
  }

  public abstract override execAction(position: Position, vimState: VimState): Promise<IMovement>;
}

@RegisterAction
export class SelectWord extends TextObject {
  keys = ['a', 'w'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = TextEditor.getCharAt(vimState.document, position);

    if (currentChar === undefined) {
      start = position;
      stop = position.nextWordEnd(vimState.document);
    } else if (/\s/.test(currentChar)) {
      start = position.prevWordEnd(vimState.document).getRight();
      stop = position.nextWordEnd(vimState.document);
    } else {
      stop = position.nextWordStart(vimState.document);
      // If the next word is not at the beginning of the next line, we want to pretend it is.
      // This is because 'aw' has two fundamentally different behaviors distinguished by whether
      // the next word is directly after the current word, as described in the following comment.
      // The only case that's not true is in cases like #1350.
      if (stop.isEqual(TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, stop.line))) {
        stop = stop.getLineBegin();
      }
      stop = stop.getLeftThroughLineBreaks().getLeftIfEOL();
      // If we aren't separated from the next word by whitespace(like in "horse ca|t,dog" or at the end of the line)
      // then we delete the spaces to the left of the current word. Otherwise, we delete to the right.
      // Also, if the current word is the leftmost word, we only delete from the start of the word to the end.
      if (
        stop.isEqual(position.nextWordEnd(vimState.document, { inclusive: true })) &&
        !position
          .prevWordStart(vimState.document, { inclusive: true })
          .isEqual(TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, stop.line)) &&
        vimState.recordedState.count === 0
      ) {
        start = position.prevWordEnd(vimState.document).getRight();
      } else {
        start = position.prevWordStart(vimState.document, { inclusive: true });
      }
    }

    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor position is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.prevWordStart(vimState.document, { inclusive: true });
        } else {
          stop = position.prevWordEnd(vimState.document).getRight();
        }
      }
    }

    return {
      start,
      stop,
    };
  }
}

@RegisterAction
export class SelectABigWord extends TextObject {
  keys = ['a', 'W'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentChar = vimState.document.lineAt(position).text[position.character];

    if (currentChar === undefined) {
      start = position;
      stop = position.nextWordEnd(vimState.document);
    } else if (/\s/.test(currentChar)) {
      start = position.prevWordEnd(vimState.document, { wordType: WordType.Big }).getRight();
      stop = position.nextWordEnd(vimState.document, { wordType: WordType.Big });
    } else {
      // Check 'aw' code for much of the reasoning behind this logic.
      const nextWord = position.nextWordStart(vimState.document, { wordType: WordType.Big });
      if (
        (nextWord.line > position.line || nextWord.isAtDocumentEnd(vimState.document)) &&
        vimState.recordedState.count === 0
      ) {
        if (position.prevWordEnd(vimState.document, { wordType: WordType.Big }).isLineBeginning()) {
          start = position.prevWordEnd(vimState.document, { wordType: WordType.Big });
        } else {
          start = position.prevWordEnd(vimState.document, { wordType: WordType.Big }).getRight();
        }
        stop = position.getLineEnd();
      } else if (
        (nextWord.isEqual(
          TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, nextWord.line),
        ) ||
          nextWord.isLineEnd(vimState.document)) &&
        vimState.recordedState.count === 0
      ) {
        start = position.prevWordEnd(vimState.document).getRight();
        stop = position.getLineEnd();
      } else {
        start = position.prevWordStart(vimState.document, {
          wordType: WordType.Big,
          inclusive: true,
        });
        stop = position.nextWordStart(vimState.document, { wordType: WordType.Big }).getLeft();
      }
    }
    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.prevWordStart(vimState.document, { wordType: WordType.Big });
        } else {
          stop = position.prevWordEnd(vimState.document, { wordType: WordType.Big }).getRight();
        }
      }
    }

    return {
      start,
      stop,
    };
  }
}

/**
 * This is a custom action that I (johnfn) added. It selects procedurally
 * larger blocks. e.g. if you had "blah (foo [bar 'ba|z'])" then it would
 * select 'baz' first. If you pressed af again, it'd then select [bar 'baz'],
 * and if you did it a third time it would select "(foo [bar 'baz'])".
 *
 * Very similar is the now built-in `editor.action.smartSelect.expand`
 */
@RegisterAction
export class SelectAnExpandingBlock extends ExpandingSelection {
  keys = ['a', 'f'];
  override modes = [Mode.Visual, Mode.VisualLine];

  public override async execAction(
    position: Position,
    vimState: VimState,
    firstIteration: boolean,
    lastIteration: boolean,
  ): Promise<IMovement> {
    const blocks = [
      new MoveAroundDoubleQuotes(),
      new MoveAroundSingleQuotes(),
      new MoveAroundBacktick(),
      new MoveAroundCurlyBrace(),
      new MoveAroundParentheses(),
      new MoveAroundSquareBracket(),
      new MoveAroundTag(),
    ];
    // ideally no state would change as we test each of the possible expansions
    // a deep copy of vimState could work here but may be expensive
    let ranges: IMovement[] = [];
    for (const block of blocks) {
      const cursorPos = new Position(position.line, position.character);
      const cursorStartPos = new Position(
        vimState.cursorStartPosition.line,
        vimState.cursorStartPosition.character,
      );
      ranges.push(await block.execAction(cursorPos, vimState, firstIteration, lastIteration));
      vimState.cursorStartPosition = cursorStartPos;
    }

    ranges = ranges.filter((range) => {
      return !range.failed;
    });

    let smallestRange: Cursor | undefined;

    for (const iMotion of ranges) {
      const currentSelectedRange = new Cursor(
        vimState.cursorStartPosition,
        vimState.cursorStopPosition,
      );
      if (iMotion.failed) {
        continue;
      }

      const range = new Cursor(iMotion.start, iMotion.stop);
      let contender: Cursor | undefined;

      if (
        range.start.isBefore(currentSelectedRange.start) &&
        range.stop.isAfter(currentSelectedRange.stop)
      ) {
        if (!smallestRange) {
          contender = range;
        } else {
          if (range.start.isAfter(smallestRange.start) && range.stop.isBefore(smallestRange.stop)) {
            contender = range;
          }
        }
      }

      if (contender) {
        const areTheyEqual =
          contender.equals(new Cursor(vimState.cursorStartPosition, vimState.cursorStopPosition)) ||
          (vimState.currentMode === Mode.VisualLine &&
            contender.start.line === vimState.cursorStartPosition.line &&
            contender.stop.line === vimState.cursorStopPosition.line);

        if (!areTheyEqual) {
          smallestRange = contender;
        }
      }
    }
    if (!smallestRange) {
      return {
        start: vimState.cursorStartPosition,
        stop: vimState.cursorStopPosition,
      };
    } else {
      // revert relevant state changes
      vimState.cursorStartPosition = new Position(
        smallestRange.start.line,
        smallestRange.start.character,
      );
      vimState.cursorStopPosition = new Position(
        smallestRange.stop.line,
        smallestRange.stop.character,
      );
      vimState.recordedState.operatorPositionDiff = undefined;
      return {
        start: smallestRange.start,
        stop: smallestRange.stop,
      };
    }
  }
}

@RegisterAction
export class SelectInnerWord extends TextObject {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['i', 'w'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = vimState.document.lineAt(position).text[position.character];

    if (currentChar === undefined) {
      start = position;
      stop = position.nextWordStart(vimState.document).getLeftThroughLineBreaks();
    } else if (/\s/.test(currentChar)) {
      start = position.prevWordEnd(vimState.document).getRight();
      stop = position.nextWordStart(vimState.document).getLeftThroughLineBreaks();
    } else {
      start = position.prevWordStart(vimState.document, { inclusive: true });
      stop = position.nextWordEnd(vimState.document, { inclusive: true });
    }

    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.prevWordEnd(vimState.document).getRight();
        } else {
          stop = position.prevWordStart(vimState.document, { inclusive: true });
        }
      }
    }

    return {
      start,
      stop,
    };
  }
}

@RegisterAction
export class SelectInnerBigWord extends TextObject {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['i', 'W'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = vimState.document.lineAt(position).text[position.character];

    if (currentChar === undefined) {
      start = position;
      stop = position.nextWordStart(vimState.document).getLeftThroughLineBreaks();
    } else if (/\s/.test(currentChar)) {
      start = position.prevWordEnd(vimState.document, { wordType: WordType.Big }).getRight();
      stop = position.nextWordStart(vimState.document, { wordType: WordType.Big }).getLeft();
    } else {
      start = position.prevWordStart(vimState.document, {
        wordType: WordType.Big,
        inclusive: true,
      });
      stop = position.nextWordEnd(vimState.document, {
        wordType: WordType.Big,
        inclusive: true,
      });
    }

    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.prevWordEnd(vimState.document, { wordType: WordType.Big }).getRight();
        } else {
          stop = position.prevWordStart(vimState.document, { wordType: WordType.Big });
        }
      }
    }

    return {
      start,
      stop,
    };
  }
}

@RegisterAction
export class SelectSentence extends TextObject {
  keys = ['a', 's'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentSentenceBegin = position.getSentenceBegin({ forward: false });
    const currentSentenceNonWhitespaceEnd = currentSentenceBegin.getSentenceEnd();

    if (currentSentenceNonWhitespaceEnd.isBefore(position)) {
      // The cursor is on a trailing white space.
      start = currentSentenceNonWhitespaceEnd.getRight();
      stop = currentSentenceBegin.getSentenceBegin({ forward: true }).getSentenceEnd();
    } else {
      const nextSentenceBegin = currentSentenceBegin.getSentenceBegin({ forward: true });

      // If the sentence has no trailing white spaces, `as` should include its leading white spaces.
      if (nextSentenceBegin.isEqual(currentSentenceBegin.getSentenceEnd())) {
        start = currentSentenceBegin
          .getSentenceBegin({ forward: false })
          .getSentenceEnd()
          .getRight();
        stop = nextSentenceBegin;
      } else {
        start = currentSentenceBegin;
        stop = nextSentenceBegin.getLeft();
      }
    }

    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting sentences in reverser order.
        if (currentSentenceNonWhitespaceEnd.isAfter(vimState.cursorStopPosition)) {
          stop = currentSentenceBegin
            .getSentenceBegin({ forward: false })
            .getSentenceEnd()
            .getRight();
        } else {
          stop = currentSentenceBegin;
        }
      }
    }

    return {
      start,
      stop,
    };
  }
}

@RegisterAction
export class SelectInnerSentence extends TextObject {
  keys = ['i', 's'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentSentenceBegin = position.getSentenceBegin({ forward: false });
    const currentSentenceNonWhitespaceEnd = currentSentenceBegin.getSentenceEnd();

    if (currentSentenceNonWhitespaceEnd.isBefore(position)) {
      // The cursor is on a trailing white space.
      start = currentSentenceNonWhitespaceEnd.getRight();
      stop = currentSentenceBegin.getSentenceBegin({ forward: true }).getLeft();
    } else {
      start = currentSentenceBegin;
      stop = currentSentenceNonWhitespaceEnd;
    }

    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting sentences in reverser order.
        if (currentSentenceNonWhitespaceEnd.isAfter(vimState.cursorStopPosition)) {
          stop = currentSentenceBegin;
        } else {
          stop = currentSentenceNonWhitespaceEnd.getRight();
        }
      }
    }

    return {
      start,
      stop,
    };
  }
}

@RegisterAction
export class SelectParagraph extends TextObject {
  keys = ['a', 'p'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    vimState.currentRegisterMode = RegisterMode.LineWise;

    let start: Position;
    const currentParagraphBegin = getCurrentParagraphBeginning(position, true);

    if (vimState.document.lineAt(position).isEmptyOrWhitespace) {
      // The cursor is at an empty line, it can be both the start of next paragraph and the end of previous paragraph
      start = getCurrentParagraphEnd(getCurrentParagraphBeginning(position, true), true);
    } else {
      if (
        currentParagraphBegin.isLineBeginning() &&
        currentParagraphBegin.isLineEnd(vimState.document)
      ) {
        start = currentParagraphBegin.getRightThroughLineBreaks();
      } else {
        start = currentParagraphBegin;
      }
    }

    // Include additional blank lines.
    let stop = getCurrentParagraphEnd(position, true);
    while (
      stop.line < vimState.document.lineCount - 1 &&
      vimState.document.lineAt(stop.getDown()).isEmptyOrWhitespace
    ) {
      stop = stop.with({ character: 0 }).getDown();
    }

    return {
      start,
      stop,
    };
  }
}

@RegisterAction
export class SelectInnerParagraph extends TextObject {
  keys = ['i', 'p'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    vimState.currentRegisterMode = RegisterMode.LineWise;

    let start: Position;
    let stop: Position;

    if (vimState.document.lineAt(position).isEmptyOrWhitespace) {
      // The cursor is at an empty line, so white lines are the paragraph.
      start = position.getLineBegin();
      stop = position.getLineEnd();
      while (start.line > 0 && vimState.document.lineAt(start.getUp()).isEmptyOrWhitespace) {
        start = start.getUp();
      }
      while (
        stop.line < vimState.document.lineCount - 1 &&
        vimState.document.lineAt(stop.getDown()).isEmptyOrWhitespace
      ) {
        stop = stop.with({ character: 0 }).getDown();
      }
    } else {
      const currentParagraphBegin = getCurrentParagraphBeginning(position, true);
      stop = getCurrentParagraphEnd(position, true);
      if (vimState.document.lineAt(currentParagraphBegin).isEmptyOrWhitespace) {
        start = currentParagraphBegin.getRightThroughLineBreaks();
      } else {
        start = currentParagraphBegin;
      }

      // Exclude additional blank lines.
      while (stop.line > 0 && vimState.document.lineAt(stop).isEmptyOrWhitespace) {
        stop = stop.getUp().getLineEnd();
      }
    }

    return {
      start,
      stop,
    };
  }
}

@RegisterAction
export class SelectEntire extends TextObject {
  keys = ['a', 'e'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const range = TextEditor.getDocumentRange(vimState.document);
    return { start: range.start, stop: range.end };
  }
}

@RegisterAction
export class SelectEntireIgnoringLeadingTrailing extends TextObject {
  keys = ['i', 'e'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position = TextEditor.getDocumentBegin();
    let stop: Position = TextEditor.getDocumentEnd(vimState.document);

    while (start.line < stop.line && vimState.document.lineAt(start).isEmptyOrWhitespace) {
      start = start.getDown();
    }

    while (stop.line > start.line && vimState.document.lineAt(stop).isEmptyOrWhitespace) {
      stop = stop.getUp();
    }
    stop = stop.getLineEnd();

    return {
      start,
      stop,
    };
  }
}
