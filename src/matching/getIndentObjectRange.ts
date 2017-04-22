import { TextEditor } from '../textEditor';
import { Position } from '../motion/position';

const emptyRegex = /^\s*$/;

/**
 * Get a range based on the current indentation level.
 * Will search for non-empty lines.
 * Respects indentation level if options.operatorString is 'change'.
 */
export function getIndentObjectRange (position: Position, options: IIndentObjectOptions): IIndentObjectRange {
  const firstValidLineNumber = findFirstValidLine(position);
  const firstValidContents = TextEditor.readLineAt(firstValidLineNumber);
  const cursorIndent = TextEditor.getIndentationLevel(firstValidContents!);

  let startLineNumber = findRangeStart(firstValidLineNumber, cursorIndent);
  let endLineNumber = findRangeEnd(firstValidLineNumber + 1, cursorIndent);

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
    startCharacter = TextEditor.getIndentationLevel(TextEditor.readLineAt(startLineNumber));
  }
  const endCharacter = TextEditor.readLineAt(endLineNumber).length;

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
    if (!TextEditor.readLineAt(i).match(emptyRegex)) {
      return i;
    }
  }

  return cursorPosition.line;
}

/**
 * Searches up from a line finding the first with a lower indent level.
 */
function findRangeStart (startIndex: number, cursorIndent: number): number {
  for (let i = startIndex; i >= 0; i--) {
    const line = TextEditor.readLineAt(i);

    // Ignore empty lines.
    if (line.match(emptyRegex)) {
      continue;
    }

    if (TextEditor.getIndentationLevel(line) < cursorIndent) {
      break;
    }

    return i;
  }

  return startIndex;
}

/**
 * Searches down from a line finding the first with a lower indent level.
 */
function findRangeEnd (startIndex: number, cursorIndent: number): number {
  for (let i = startIndex; i < TextEditor.getLineCount(); i++) {
    const line = TextEditor.readLineAt(i);

    // Ignore empty lines.
    if (line.match(emptyRegex)) {
      continue;
    }

    if (TextEditor.getIndentationLevel(line) < cursorIndent) {
      break;
    }

    return i;
  }

  return startIndex;
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