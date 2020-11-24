import { Position } from 'vscode';
import { TextEditor } from '../textEditor';

/**
 * Get the end of the current paragraph.
 */
export function getCurrentParagraphEnd(pos: Position, trimWhite: boolean = false): Position {
  const lastLine = TextEditor.getLineCount() - 1;

  let line = pos.line;

  // If we're not in a paragraph yet, go down until we are.
  while (line < lastLine && isLineBlank(line, trimWhite)) {
    line++;
  }

  // Go until we're outside of the paragraph, or at the end of the document.
  while (line < lastLine && !isLineBlank(line, trimWhite)) {
    line++;
  }

  return pos.with({ line }).getLineEnd();
}

/**
 * Get the beginning of the current paragraph.
 */
export function getCurrentParagraphBeginning(pos: Position, trimWhite: boolean = false): Position {
  let line = pos.line;

  // If we're not in a paragraph yet, go up until we are.
  while (line > 0 && isLineBlank(line, trimWhite)) {
    line--;
  }

  // Go until we're outside of the paragraph, or at the beginning of the document.
  while (line > 0 && !isLineBlank(line, trimWhite)) {
    line--;
  }

  return new Position(line, 0);
}

function isLineBlank(line: number, trimWhite: boolean = false): boolean {
  const text = TextEditor.getLine(line).text;
  return (trimWhite ? text.trim() : text) === '';
}
