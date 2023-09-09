import { Position } from 'vscode';
import { TextEditor } from '../textEditor';
import { getCurrentParagraphBeginning, getCurrentParagraphEnd } from './paragraph';
import { getAllPositions, getAllEndPositions } from './util';

const sentenceEndRegex = /[\.!\?]["')\]]*?([ \n\t]+|$)/g;

export function getSentenceBegin(position: Position, args: { forward: boolean }): Position {
  if (args.forward) {
    return getNextSentenceBegin(position);
  } else {
    return getPreviousSentenceBegin(position);
  }
}

export function getSentenceEnd(pos: Position): Position {
  const paragraphEnd = getCurrentParagraphEnd(pos);
  for (let currentLine = pos.line; currentLine <= paragraphEnd.line; currentLine++) {
    const allPositions = getAllPositions(TextEditor.getLine(currentLine).text, sentenceEndRegex);
    const newCharacter = allPositions.find(
      (index) => index > pos.character || currentLine !== pos.line,
    );

    if (newCharacter !== undefined) {
      return new Position(currentLine, newCharacter);
    }
  }

  return getFirstNonWhitespaceInParagraph(pos, paragraphEnd, false);
}

function getPreviousSentenceBegin(pos: Position): Position {
  const paragraphBegin = getCurrentParagraphBeginning(pos);
  for (let currentLine = pos.line; currentLine >= paragraphBegin.line; currentLine--) {
    const endPositions = getAllEndPositions(TextEditor.getLine(currentLine).text, sentenceEndRegex);
    const newCharacter = endPositions.reverse().find((index) => {
      const newPositionBeforeThis = new Position(currentLine, index)
        .getRightThroughLineBreaks()
        .compareTo(pos);

      return newPositionBeforeThis && (index < pos.character || currentLine < pos.line);
    });

    if (newCharacter !== undefined) {
      return new Position(currentLine, newCharacter).getRightThroughLineBreaks();
    }
  }

  if (paragraphBegin.line + 1 === pos.line || paragraphBegin.line === pos.line) {
    return paragraphBegin;
  } else {
    return new Position(paragraphBegin.line + 1, 0);
  }
}

function getNextSentenceBegin(pos: Position): Position {
  // A paragraph and section boundary is also a sentence boundary.
  const paragraphEnd = getCurrentParagraphEnd(pos);
  for (let currentLine = pos.line; currentLine <= paragraphEnd.line; currentLine++) {
    const endPositions = getAllEndPositions(TextEditor.getLine(currentLine).text, sentenceEndRegex);
    const newCharacter = endPositions.find(
      (index) => index > pos.character || currentLine !== pos.line,
    );

    if (newCharacter !== undefined) {
      return new Position(currentLine, newCharacter).getRightThroughLineBreaks();
    }
  }

  return getFirstNonWhitespaceInParagraph(pos, paragraphEnd, false);
}

function getFirstNonWhitespaceInParagraph(
  pos: Position,
  paragraphEnd: Position,
  inclusive: boolean,
): Position {
  // If the cursor is at an empty line, it's the end of a paragraph and the begin of another paragraph
  // Find the first non-whitespace character.
  if (TextEditor.getLine(pos.line).text) {
    return paragraphEnd;
  } else {
    for (let currentLine = pos.line; currentLine <= paragraphEnd.line; currentLine++) {
      const nonWhitePositions = getAllPositions(TextEditor.getLine(currentLine).text, /\S/g);
      const newCharacter = nonWhitePositions.find(
        (index) =>
          (index > pos.character && !inclusive) ||
          (index >= pos.character && inclusive) ||
          currentLine !== pos.line,
      );

      if (newCharacter !== undefined) {
        return new Position(currentLine, newCharacter);
      }
    }
  }

  // Only happens at end of document
  return pos;
}
