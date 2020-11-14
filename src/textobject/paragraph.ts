import { Position } from '../common/motion/position';
import { TextEditor } from '../textEditor';

/**
 * Get the end of the current paragraph.
 */
export function getCurrentParagraphEnd(pos: Position, trimWhite: boolean = false): Position {
  // If we're not in a paragraph yet, go down until we are.
  while (isLineBlank(pos, trimWhite) && !TextEditor.isLastLine(pos)) {
    pos = pos.getDownWithDesiredColumn(0);
  }

  // Go until we're outside of the paragraph, or at the end of the document.
  while (!isLineBlank(pos, trimWhite) && pos.line < TextEditor.getLineCount() - 1) {
    pos = pos.getDownWithDesiredColumn(0);
  }

  return pos.getLineEnd();
}

/**
 * Get the beginning of the current paragraph.
 */
export function getCurrentParagraphBeginning(pos: Position, trimWhite: boolean = false): Position {
  // If we're not in a paragraph yet, go up until we are.
  while (isLineBlank(pos, trimWhite) && !TextEditor.isFirstLine(pos)) {
    pos = pos.getUpWithDesiredColumn(0);
  }

  // Go until we're outside of the paragraph, or at the beginning of the document.
  while (pos.line > 0 && !isLineBlank(pos, trimWhite)) {
    pos = pos.getUpWithDesiredColumn(0);
  }

  return pos.getLineBegin();
}

function isLineBlank(pos: Position, trimWhite: boolean = false): boolean {
  let text = TextEditor.getLineAt(pos).text;
  return (trimWhite ? text.trim() : text) === '';
}
