import { Position, TextDocument } from 'vscode';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { TextObject } from '../../textobject/textobject';
import { RegisterAction } from '../base';
import { IMovement } from '../baseMotion';
import { ChangeOperator } from '../operator';

abstract class IndentObjectMatch extends TextObject {
  protected includeLineAbove = false;
  protected includeLineBelow = false;

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const isChangeOperator = vimState.recordedState.operator instanceof ChangeOperator;
    const firstValidLineNumber = IndentObjectMatch.findFirstValidLine(vimState.document, position);
    const firstValidLine = vimState.document.lineAt(firstValidLineNumber);
    const cursorIndent = firstValidLine.firstNonWhitespaceCharacterIndex;

    let startLineNumber = IndentObjectMatch.findRangeStartOrEnd(
      vimState.document,
      firstValidLineNumber,
      cursorIndent,
      -1,
    );
    let endLineNumber = IndentObjectMatch.findRangeStartOrEnd(
      vimState.document,
      firstValidLineNumber,
      cursorIndent,
      1,
    );

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
    if (endLineNumber > vimState.document.lineCount - 1) {
      endLineNumber = vimState.document.lineCount - 1;
    }

    // If initiated by a change operation, adjust the cursor to the indent level
    // of the block.
    let startCharacter = 0;
    if (isChangeOperator) {
      startCharacter = vimState.document.lineAt(startLineNumber).firstNonWhitespaceCharacterIndex;
    }
    // TextEditor.getLineMaxColumn throws when given line 0, which we don't
    // care about here since it just means this text object wouldn't work on a
    // single-line document.
    let endCharacter: number;
    if (
      endLineNumber === vimState.document.lineCount - 1 ||
      vimState.currentMode === Mode.Visual ||
      vimState.currentMode === Mode.VisualLine
    ) {
      endCharacter = TextEditor.getLineLength(endLineNumber);
    } else {
      endCharacter = 0;
      endLineNumber++;
    }
    return {
      start: new Position(startLineNumber, startCharacter),
      stop: new Position(endLineNumber, endCharacter),
    };
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState,
  ): Promise<IMovement> {
    return this.execAction(position, vimState);
  }

  /**
   * Searches up from the cursor for the first non-empty line.
   */
  public static findFirstValidLine(document: TextDocument, cursorPosition: Position): number {
    for (let i = cursorPosition.line; i >= 0; i--) {
      if (!document.lineAt(i).isEmptyOrWhitespace) {
        return i;
      }
    }

    return cursorPosition.line;
  }

  /**
   * Searches up or down from a line finding the first with a lower indent level.
   */
  public static findRangeStartOrEnd(
    document: TextDocument,
    startIndex: number,
    cursorIndent: number,
    step: -1 | 1,
  ): number {
    let i = startIndex;
    let ret = startIndex;
    const end = step === 1 ? document.lineCount : -1;

    for (; i !== end; i += step) {
      const line = document.lineAt(i);
      if (line.firstNonWhitespaceCharacterIndex < cursorIndent && !line.isEmptyOrWhitespace) {
        break;
      }

      ret = i;
    }

    return ret;
  }
}

@RegisterAction
class InsideIndentObject extends IndentObjectMatch {
  keys = ['i', 'i'];
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
}

@RegisterAction
class InsideIndentObjectAbove extends IndentObjectMatch {
  keys = ['a', 'i'];
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  override includeLineAbove = true;
}

@RegisterAction
class InsideIndentObjectBoth extends IndentObjectMatch {
  keys = ['a', 'I'];
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  override includeLineAbove = true;
  override includeLineBelow = true;
}
