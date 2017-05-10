import { ModeName } from './../mode/mode';
import { Position } from './../common/motion/position';
import { Range } from './../common/motion/range';
import { TextEditor } from './../textEditor';
import { VimState } from './../mode/modeHandler';
import { RegisterAction } from './base';
import { ChangeOperator } from './operator';
import {
  BaseMovement, IMovement,
  MoveASingleQuotes, MoveADoubleQuotes, MoveAClosingCurlyBrace, MoveAParentheses, MoveASquareBracket
} from './motion';

export abstract class TextObjectMovement extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualBlock];
  canBePrefixedWithCount = true;

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    const res = await this.execAction(position, vimState) as IMovement;
    // Since we need to handle leading spaces, we cannot use MoveWordBegin.execActionForOperator
    // In normal mode, the character on the stop position will be the first character after the operator executed
    // and we do left-shifting in operator-pre-execution phase, here we need to right-shift the stop position accordingly.
    res.stop = new Position(res.stop.line, res.stop.character + 1);

    return res;
  }
}

@RegisterAction
export class SelectWord extends TextObjectMovement {
  keys = ["a", "w"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
      start = position.getLastWordEnd().getRight();
      stop = position.getCurrentWordEnd();
    } else {
      stop = position.getWordRight();
      // If the next word is not at the beginning of the next line, we want to pretend it is.
      // This is because 'aw' has two fundamentally different behaviors distinguished by whether
      // the next word is directly after the current word, as described in the following comment.
      // The only case that's not true is in cases like #1350.
      if (stop.isEqual(stop.getFirstLineNonBlankChar())) {
        stop = stop.getLineBegin();
      }
      stop = stop.getLeftThroughLineBreaks().getLeftIfEOL();
      // If we aren't separated from the next word by whitespace(like in "horse ca|t,dog" or at the end of the line)
      // then we delete the spaces to the left of the current word. Otherwise, we delete to the right.
      // Also, if the current word is the leftmost word, we only delete from the start of the word to the end.
      if (stop.isEqual(position.getCurrentWordEnd(true)) &&
        !position.getWordLeft(true).isEqual(position.getFirstLineNonBlankChar())
        && vimState.recordedState.count === 0) {
        start = position.getLastWordEnd().getRight();
      } else {
        start = position.getWordLeft(true);
      }
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.getWordLeft(true);
        } else {
          stop = position.getLastWordEnd().getRight();
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
export class SelectABigWord extends TextObjectMovement {
  keys = ["a", "W"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
      start = position.getLastBigWordEnd().getRight();
      stop = position.getCurrentBigWordEnd();
    } else {
      // Check 'aw' code for much of the reasoning behind this logic.
      let nextWord = position.getBigWordRight();
      if ((nextWord.isEqual(nextWord.getFirstLineNonBlankChar()) || nextWord.isLineEnd()) &&
        vimState.recordedState.count === 0) {
        start = position.getLastWordEnd().getRight();
        stop = position.getLineEnd();
      } else {
        start = position.getBigWordLeft(true);
        stop = position.getBigWordRight().getLeft();
      }
    }
    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.getBigWordLeft();
        } else {
          stop = position.getLastBigWordEnd().getRight();
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

/**
 * This is a custom action that I (johnfn) added. It selects procedurally
 * larger blocks. e.g. if you had "blah (foo [bar 'ba|z'])" then it would
 * select 'baz' first. If you pressed az again, it'd then select [bar 'baz'],
 * and if you did it a third time it would select "(foo [bar 'baz'])".
 */
@RegisterAction
export class SelectAnExpandingBlock extends TextObjectMovement {
  keys = ["a", "f"];
  modes = [ModeName.Visual, ModeName.VisualLine];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const ranges = [
      await new MoveASingleQuotes().execAction(position, vimState),
      await new MoveADoubleQuotes().execAction(position, vimState),
      await new MoveAClosingCurlyBrace().execAction(position, vimState),
      await new MoveAParentheses().execAction(position, vimState),
      await new MoveASquareBracket().execAction(position, vimState),
    ];

    let smallestRange: Range | undefined = undefined;

    for (const iMotion of ranges) {
      if (iMotion.failed) { continue; }

      const range = Range.FromIMovement(iMotion);
      let contender: Range | undefined = undefined;

      if (!smallestRange) {
        contender = range;
      } else {
        if (range.start.isAfter(smallestRange.start) &&
          range.stop.isBefore(smallestRange.stop)) {
          contender = range;
        }
      }

      if (contender) {
        const areTheyEqual =
          contender.equals(new Range(vimState.cursorStartPosition, vimState.cursorPosition)) ||
          (vimState.currentMode === ModeName.VisualLine &&
            contender.start.line === vimState.cursorStartPosition.line &&
            contender.stop.line === vimState.cursorPosition.line);

        if (!areTheyEqual) {
          smallestRange = contender;
        }
      }
    }

    if (!smallestRange) {
      return {
        start: vimState.cursorStartPosition,
        stop: vimState.cursorPosition,
      };
    } else {
      return {
        start: smallestRange.start,
        stop: smallestRange.stop,
      };
    }
  }
}

@RegisterAction
export class SelectInnerWord extends TextObjectMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["i", "w"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
      start = position.getLastWordEnd().getRight();
      stop = position.getWordRight().getLeftThroughLineBreaks();
    } else {
      start = position.getWordLeft(true);
      stop = position.getCurrentWordEnd(true);
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.getLastWordEnd().getRight();
        } else {
          stop = position.getWordLeft(true);
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
export class SelectInnerBigWord extends TextObjectMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["i", "W"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
      start = position.getLastBigWordEnd().getRight();
      stop = position.getBigWordRight().getLeft();
    } else {
      start = position.getBigWordLeft();
      stop = position.getCurrentBigWordEnd(true);
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.getLastBigWordEnd().getRight();
        } else {
          stop = position.getBigWordLeft();
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
export class SelectSentence extends TextObjectMovement {
  keys = ["a", "s"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentSentenceBegin = position.getSentenceBegin({ forward: false });
    const currentSentenceNonWhitespaceEnd = currentSentenceBegin.getCurrentSentenceEnd();

    if (currentSentenceNonWhitespaceEnd.isBefore(position)) {
      // The cursor is on a trailing white space.
      start = currentSentenceNonWhitespaceEnd.getRight();
      stop = currentSentenceBegin.getSentenceBegin({ forward: true }).getCurrentSentenceEnd();
    } else {
      const nextSentenceBegin = currentSentenceBegin.getSentenceBegin({ forward: true });

      // If the sentence has no trailing white spaces, `as` should include its leading white spaces.
      if (nextSentenceBegin.isEqual(currentSentenceBegin.getCurrentSentenceEnd())) {
        start = currentSentenceBegin.getSentenceBegin({ forward: false }).getCurrentSentenceEnd().getRight();
        stop = nextSentenceBegin;
      } else {
        start = currentSentenceBegin;
        stop = nextSentenceBegin.getLeft();
      }
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting sentences in reverser order.
        if (currentSentenceNonWhitespaceEnd.isAfter(vimState.cursorPosition)) {
          stop = currentSentenceBegin.getSentenceBegin({ forward: false }).getCurrentSentenceEnd().getRight();
        } else {
          stop = currentSentenceBegin;
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
export class SelectInnerSentence extends TextObjectMovement {
  keys = ["i", "s"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentSentenceBegin = position.getSentenceBegin({ forward: false });
    const currentSentenceNonWhitespaceEnd = currentSentenceBegin.getCurrentSentenceEnd();

    if (currentSentenceNonWhitespaceEnd.isBefore(position)) {
      // The cursor is on a trailing white space.
      start = currentSentenceNonWhitespaceEnd.getRight();
      stop = currentSentenceBegin.getSentenceBegin({ forward: true }).getLeft();
    } else {
      start = currentSentenceBegin;
      stop = currentSentenceNonWhitespaceEnd;
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting sentences in reverser order.
        if (currentSentenceNonWhitespaceEnd.isAfter(vimState.cursorPosition)) {
          stop = currentSentenceBegin;
        } else {
          stop = currentSentenceNonWhitespaceEnd.getRight();
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
export class SelectParagraph extends TextObjectMovement {
  keys = ["a", "p"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    const currentParagraphBegin = position.getCurrentParagraphBeginning();

    if (position.isLineBeginning() && position.isLineEnd()) {
      // The cursor is at an empty line, it can be both the start of next paragraph and the end of previous paragraph
      start = position.getCurrentParagraphBeginning().getCurrentParagraphEnd();
    } else {
      if (currentParagraphBegin.isLineBeginning() && currentParagraphBegin.isLineEnd()) {
        start = currentParagraphBegin.getRightThroughLineBreaks();
      } else {
        start = currentParagraphBegin;
      }
    }

    return {
      start: start,
      stop: position.getCurrentParagraphEnd()
    };
  }
}

@RegisterAction
export class SelectInnerParagraph extends TextObjectMovement {
  keys = ["i", "p"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position = position.getCurrentParagraphEnd();

    if (stop.isLineBeginning() && stop.isLineEnd()) {
      stop = stop.getLeftThroughLineBreaks();
    }

    const currentParagraphBegin = position.getCurrentParagraphBeginning();

    if (position.isLineBeginning() && position.isLineEnd()) {
      // The cursor is at an empty line, it can be both the start of next paragraph and the end of previous paragraph
      start = position.getCurrentParagraphBeginning().getCurrentParagraphEnd();
      stop = position.getCurrentParagraphEnd().getCurrentParagraphBeginning();
    } else {
      if (currentParagraphBegin.isLineBeginning() && currentParagraphBegin.isLineEnd()) {
        start = currentParagraphBegin.getRightThroughLineBreaks();
      } else {
        start = currentParagraphBegin;
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

abstract class IndentObjectMatch extends TextObjectMovement {
  setsDesiredColumnToEOL = true;

  protected includeLineAbove = false;
  protected includeLineBelow = false;

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const isChangeOperator = vimState.recordedState.operator instanceof ChangeOperator;
    const firstValidLineNumber = IndentObjectMatch.findFirstValidLine(position);
    const firstValidLine = TextEditor.getLineAt(new Position(firstValidLineNumber, 0));
    const cursorIndent = firstValidLine.firstNonWhitespaceCharacterIndex;

    // let startLineNumber = findRangeStart(firstValidLineNumber, cursorIndent);
    let startLineNumber = IndentObjectMatch.findRangeStartOrEnd(firstValidLineNumber, cursorIndent, -1);
    let endLineNumber = IndentObjectMatch.findRangeStartOrEnd(firstValidLineNumber, cursorIndent, 1);

    // Adjust the start line as needed.
    if (this.includeLineAbove) {
      startLineNumber -= 1;
    }
    // Check for OOB.
    if (startLineNumber < 0) {
      startLineNumber = 0;
    }

    // Adjust the end line as needed.
    if (this.includeLineBelow) {
      endLineNumber += 1;
    }
    // Check for OOB.
    if (endLineNumber > TextEditor.getLineCount() - 1) {
      endLineNumber = TextEditor.getLineCount() - 1;
    }

    // If initiated by a change operation, adjust the cursor to the indent level
    // of the block.
    let startCharacter = 0;
    if (isChangeOperator) {
      startCharacter = TextEditor.getLineAt(new Position(startLineNumber, 0)).firstNonWhitespaceCharacterIndex;
    }
    // TextEditor.getLineMaxColumn throws when given line 0, which we don't
    // care about here since it just means this text object wouldn't work on a
    // single-line document.
    let endCharacter;
    if (endLineNumber === TextEditor.getLineCount() - 1 || vimState.currentMode === ModeName.Visual) {
      endCharacter = TextEditor.getLineMaxColumn(endLineNumber);
    } else {
      endCharacter = 0;
      endLineNumber++;
    }
    return {
      start: new Position(startLineNumber, startCharacter),
      stop: new Position(endLineNumber, endCharacter),
    };
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    return await this.execAction(position, vimState);
  }

  /**
   * Searches up from the cursor for the first non-empty line.
   */
  public static findFirstValidLine(cursorPosition: Position): number {
    for (let i = cursorPosition.line; i >= 0; i--) {
      const line = TextEditor.getLineAt(new Position(i, 0));

      if (!line.isEmptyOrWhitespace) {
        return i;
      }
    }

    return cursorPosition.line;
  }

  /**
   * Searches up or down from a line finding the first with a lower indent level.
   */
  public static findRangeStartOrEnd(startIndex: number, cursorIndent: number, step: -1 | 1): number {
    let i = startIndex;
    let ret = startIndex;
    const end = step === 1
      ? TextEditor.getLineCount()
      : -1;

    for (; i !== end; i += step) {
      const line = TextEditor.getLineAt(new Position(i, 0));
      const isLineEmpty = line.isEmptyOrWhitespace;
      const lineIndent = line.firstNonWhitespaceCharacterIndex;

      if (lineIndent < cursorIndent && !isLineEmpty) {
        break;
      }

      ret = i;
    }

    return ret;
  }
}

@RegisterAction
class InsideIndentObject extends IndentObjectMatch {
  keys = ["i", "i"];
}

@RegisterAction
class InsideIndentObjectAbove extends IndentObjectMatch {
  keys = ["a", "i"];
  includeLineAbove = true;
}

@RegisterAction
class InsideIndentObjectBoth extends IndentObjectMatch {
  keys = ["a", "I"];
  includeLineAbove = true;
  includeLineBelow = true;
}