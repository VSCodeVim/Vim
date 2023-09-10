import * as vscode from 'vscode';

import { TextEditor } from './../textEditor';
import { VimState } from '../state/vimState';
import { Position } from 'vscode';

/**
 * Return open text documents, with a given file at the top of the list.
 * @param startingFileName File that will be first in the array, typically current file
 */
const documentsStartingWith = (startingFileName: string) => {
  return [...vscode.workspace.textDocuments].sort((a, b) => {
    if (a.fileName === startingFileName) {
      return -1;
    } else if (b.fileName === startingFileName) {
      return 1;
    }
    return 0;
  });
};

/**
 * Get lines, with leading tabs or whitespace stripped.
 * @param document Document to get lines from.
 * @param lineToStartScanFrom Where to start looking for matches first. Closest matches are sorted first.
 * @param scanAboveFirst Whether to start scan above or below cursor. Other direction is scanned last.
 * @returns
 */
const linesWithoutIndentation = (
  document: vscode.TextDocument,
  lineToStartScanFrom: number,
  scanAboveFirst: boolean,
): Array<{ sortPriority: number; text: string }> => {
  const distanceFromStartLine = (line: number) => {
    let sortPriority = scanAboveFirst ? lineToStartScanFrom - line : line - lineToStartScanFrom;
    if (sortPriority < 0) {
      // We prioritized any items in the main direction searched,
      // but now find closest items in opposite direction.
      sortPriority = lineToStartScanFrom + Math.abs(sortPriority);
    }

    return sortPriority;
  };

  return document
    .getText()
    .split('\n')
    .map((text, line) => ({
      sortPriority: distanceFromStartLine(line),
      text: text.replace(/^[ \t]*/, ''),
    }))
    .sort((a, b) => (a.sortPriority > b.sortPriority ? 1 : -1));
};

/**
 * Get all completions that match given text within open documents.
 * @example
 * a1
 * a2
 * a| // <--- Perform line completion here
 * a3
 * a4
 * // Returns: ['a2', 'a1', 'a3', 'a4']
 * @param text Text to partially match. Indentation is stripped.
 * @param currentFileName Current file, which is prioritized in sorting.
 * @param currentPosition Current position, which is prioritized when sorting for current file.
 */
const getCompletionsForText = (
  text: string,
  currentFileName: string,
  currentPosition: Position,
): string[] | null => {
  const matchedLines: string[] = [];

  for (const document of documentsStartingWith(currentFileName)) {
    let lineToStartScanFrom = 0;
    let scanAboveFirst = false;

    if (document.fileName === currentFileName) {
      lineToStartScanFrom = currentPosition.line;
      scanAboveFirst = true;
    }

    for (const line of linesWithoutIndentation(document, lineToStartScanFrom, scanAboveFirst)) {
      if (
        !matchedLines.includes(line.text) &&
        line.text &&
        line.text.startsWith(text) &&
        line.text !== text
      ) {
        matchedLines.push(line.text);
      }
    }
  }

  return matchedLines;
};

/**
 * Get all completions that match given text within open documents.
 * Results are sorted in a few ways:
 * 1) The current document is prioritized over other open documents.
 * 2) For the current document, lines above the current cursor are always prioritized over lines below it.
 * 3) For the current document, lines are also prioritized based on distance from cursor.
 * 4) For other documents, lines are prioritized based on distance from the top.
 * @example
 * a1
 * a2
 * a| // <--- Perform line completion here
 * a3
 * a4
 * // Returns: ['a2', 'a1', 'a3', 'a4']
 * @param position Position to start scan from
 * @param document Document to start scanning from, starting at the position (other open documents are scanned from top)
 */
export const getCompletionsForCurrentLine = (
  position: Position,
  document: vscode.TextDocument,
): string[] | null => {
  const currentLineText = document.getText(
    new vscode.Range(TextEditor.getFirstNonWhitespaceCharOnLine(document, position.line), position),
  );

  return getCompletionsForText(currentLineText, document.fileName, position);
};

export const lineCompletionProvider = {
  /**
   * Get all completions that match given text within open documents.
   * Results are sorted by priority.
   * @see getCompletionsForCurrentLine
   *
   * Any trailing characters are stripped. Trailing characters are often
   * from auto-close, such as when importing in JavaScript ES6 and typing a
   * curly brace. So the trailing characters are removed on purpose.
   *
   * Modifies vimState, adding transformations that replaces the
   * current line's text with the chosen completion, with proper indentation.
   *
   * Here we use Quick Pick, instead of registerCompletionItemProvider
   * Originally I looked at using a standard completion dropdown using that method,
   * but it doesn't allow you to limit completions, and it became overwhelming
   * when e.g. trying to do a line completion when the cursor is positioned after
   * a space character (such that it shows almost any symbol in the list).
   * Quick Pick also allows for searching, which is a nice bonus.
   */
  showLineCompletionsQuickPick: async (position: Position, vimState: VimState): Promise<void> => {
    const completions = getCompletionsForCurrentLine(position, vimState.document);

    if (!completions) {
      return;
    }

    const selectedCompletion = await vscode.window.showQuickPick(completions);

    if (!selectedCompletion) {
      return;
    }

    vimState.recordedState.transformer.delete(
      new vscode.Range(
        TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, position.line),
        position.getLineEnd(),
      ),
    );

    vimState.recordedState.transformer.addTransformation({
      type: 'insertTextVSCode',
      text: selectedCompletion,
    });
  },
};
