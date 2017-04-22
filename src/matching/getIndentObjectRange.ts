import { TextEditor } from '../textEditor';
import { Position } from '../motion/position';

/**
 * Get a range based on the current indentation level.
 * Will search backward if starting on empty line.
 * Respects indentation level if options.operatorString is 'change'.
 */
export function getIndentObjectRange (position: Position, options: IIndentObjectOptions): IIndentObjectRange {
  const firstValidLineNumber = findFirstValidLine(position);
  const firstValidLine = TextEditor.getLineAt(new Position(firstValidLineNumber, 0));
  const cursorIndent = firstValidLine.firstNonWhitespaceCharacterIndex;

  let startLineNumber = findRangeStartOrEnd(firstValidLineNumber, cursorIndent, -1);
  let endLineNumber = findRangeStartOrEnd(firstValidLineNumber, cursorIndent, 1);

  // Adjust the start line as needed.
  if (options.includeLineAbove) {
    startLineNumber -= 1;
  }
  // Check for OOB.
  if (startLineNumber < 0) {
    startLineNumber = 0;
  }

  // Adjust the end line as needed.
  if (options.includeLineBelow) {
    endLineNumber += 1;
  }
  // Check for OOB.
  if (endLineNumber > TextEditor.getLineCount() - 1) {
    endLineNumber = TextEditor.getLineCount() - 1;
  }

  // If initiated by a change operation, adjust the cursor to the indent level
  // of the block.
  let startCharacter = 0;
  if (options.operatorString === 'change') {
    startCharacter = TextEditor.getLineAt(new Position(startLineNumber, 0)).firstNonWhitespaceCharacterIndex;
  }
  // Get the number of characters on the last line.
  // Add one to also get the newline.
  const endCharacter = TextEditor.readLineAt(endLineNumber).length + 1;

  return {
    startPosition: new Position(startLineNumber, startCharacter),
    endPosition: new Position(endLineNumber, endCharacter),
  };
}

/**
 * Searches up from the cursor for the first non-empty line.
 */
function findFirstValidLine (cursorPosition: Position): number {
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
function findRangeStartOrEnd (startIndex: number, cursorIndent: number, step: -1 | 1): number {
  let i = startIndex;
  let ret = startIndex;
  let end = step === 1
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

interface IIndentObjectOptions {
  includeLineAbove: boolean;
  includeLineBelow: boolean;
  operatorString: 'change' | 'delete' | 'yank' | 'visual' | undefined;
}

interface IIndentObjectRange {
  startPosition: Position;
  endPosition: Position;
}