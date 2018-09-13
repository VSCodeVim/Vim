import * as vscode from 'vscode';

import { Position, PositionDiff } from '../common/motion/position';
import { TextEditor } from './../textEditor';
import { VimState } from '../state/vimState';
import { Range } from '../common/motion/range';

const documentsStartingWith = startingFileName => {
  return vscode.workspace.textDocuments.sort((a, b) => {
    if (a.fileName === startingFileName) {
      return -1;
    } else if (b.fileName === startingFileName) {
      return 1;
    }
    return 0;
  });
};

const linesWithoutPadding = (
  document: vscode.TextDocument,
  startLine: number,
  reverse: boolean
) => {
  const distanceFromStartLine = (line: number) => {
    let distance = reverse ? startLine - line : line - startLine;
    if (distance < 0) {
      // We prioritized any items in the main direction searched,
      // but now find closest items in opposite direction.
      distance = startLine + Math.abs(distance);
    }

    return distance;
  };

  return document
    .getText()
    .split('\n')
    .map((text, line) => ({
      distance: distanceFromStartLine(line),
      text: text.replace(/^[ \t]*/, ''),
    }))
    .sort((a, b) => (a.distance > b.distance ? 1 : -1));
};

/**
 * Get all completions that match given text within open documents.
 *
 * Results are sorted in a few ways:
 * 1) The current document is prioritized over other open documents.
 * 2) For the current document, lines above the current cursor are always prioritized over lines below it.
 * 3) For the current document, lines are also prioritized based on distance from cursor.
 * 4) For other documents, lines are prioritized based on distance from the top.
 *
 * @param text - Text to partially match. Indentation is stripped.
 * @param currentFileName - Current file, which is prioritized in sorting.
 * @param currentPosition - Current position, which is prioritized when sorting for current file.
 */
const getCompletionsForText = (
  text: string,
  currentFileName: string,
  currentPosition: Position
): string[] | null => {
  const matchedLines: string[] = [];

  for (const document of documentsStartingWith(currentFileName)) {
    let startLine = 0;
    let reverse = false;

    if (document.fileName === currentFileName) {
      startLine = currentPosition.line;
      reverse = true;
    }

    for (const line of linesWithoutPadding(document, startLine, reverse)) {
      if (
        matchedLines.indexOf(line.text) === -1 &&
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

export const getCompletionsForCurrentLine = (
  position: Position,
  vimState: VimState
): string[] | null => {
  const currentLineText = TextEditor.getText(
    new vscode.Range(position.getFirstLineNonBlankChar(), vimState.cursorPosition)
  );

  return getCompletionsForText(currentLineText, vimState.editor.document.fileName, position);
};

export const lineCompletionProvider = {
  /**
   * Here we use Quick Pick, instead of registerCompletionItemProvider
   * Originally I looked at using a standard completion dropdown using that method,
   * but it doesn't allow you to limit completions, and it became overwhelming
   * when e.g. trying to do a line completion when the cursor is positioned after
   * a space character (such that it shows almost any symbol in the list).
   *
   * Quick Pick also allows for searching, which is kind of a nice bonus.
   */
  showLineCompletionsQuickPick: async (
    position: Position,
    vimState: VimState
  ): Promise<VimState> => {
    const completions = getCompletionsForCurrentLine(position, vimState);

    if (!completions) {
      return vimState;
    }

    const selectedCompletion = await vscode.window.showQuickPick(completions);

    if (!selectedCompletion) {
      return vimState;
    }

    vimState.recordedState.transformations.push({
      type: 'deleteRange',
      range: new Range(position.getFirstLineNonBlankChar(), position.getLineEnd()),
    });

    vimState.recordedState.transformations.push({
      type: 'insertTextVSCode',
      text: selectedCompletion,
    });

    return vimState;
  },
};
