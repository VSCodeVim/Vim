import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../mode/modeHandler';
import { ModeName } from '../mode/mode';
import { Position, PositionDiff } from '../common/motion/position';
import { TextEditor } from './../textEditor';
import { VimState } from '../state/vimState';
import { Range } from '../common/motion/range';

const documentsStartingWith = (startingFileName, v) => {
  return v.workspace.textDocuments.sort((a, b) => {
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

  for (const document of documentsStartingWith(currentFileName, vscode)) {
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

const getCompletionsForCurrentLine = (position: Position, vimState: VimState): string[] | null => {
  const currentLineText = TextEditor.getText(
    new vscode.Range(position.getFirstLineNonBlankChar(), vimState.cursorPosition)
  );

  return getCompletionsForText(currentLineText, vimState.editor.document.fileName, position);
};

export const lineCompletionProvider = {
  _enabled: false,

  showLineCompletionsQuickPick: async (
    position: Position,
    vimState: VimState
  ): Promise<VimState> => {
    this._enabled = true;

    const completions = getCompletionsForCurrentLine(position, vimState);

    if (!completions) {
      return vimState;
    }

    const selectedCompletion = await vscode.window.showQuickPick(completions);

    if (!selectedCompletion) {
      return vimState;
    }

    const originalText = TextEditor.getLineAt(position).text;
    const indentationWidth = TextEditor.getIndentationLevel(originalText);
    const tabSize = configuration.tabstop || Number(vimState.editor.options.tabSize);
    const newIndentationWidth = (indentationWidth / tabSize + 1) * tabSize;

    // await TextEditor.replaceText(
    //   vimState,
    //   selectedCompletion,
    //   position.getLineBegin(),
    //   position.getLineEnd(),
    //   new PositionDiff(0, newIndentationWidth - indentationWidth)
    // );

    vimState.recordedState.transformations.push({
      type: 'deleteRange',
      range: new Range(position.getFirstLineNonBlankChar(), position.getLineEnd()),
    });

    vimState.recordedState.transformations.push({
      type: 'insertTextVSCode',
      text: selectedCompletion,
    });

    // vimState.recordedState.transformations.push({
    //   type: 'replaceText',
    //   text: selectedCompletion,
    //   start: position.getLineBegin(),
    //   end: position,
    // });

    // vimState.recordedState.transformations.push({
    //   type: 'moveCursor',
    //   diff: new PositionDiff(0, selectedCompletion.length - originalText.length),
    // });

    // vimState.currentMode = ModeName.Insert;
    // vimState.cursorStartPosition = new Position(position.line, selectedCompletion.length);
    // vimState.cursorPosition = vimState.cursorStartPosition;

    return vimState;
  },

  showLineCompletionsDropdown: async (): Promise<void> => {
    // TODO: Delete me, if QuickPick works better.
    //       Using standard completion ends up having too many
    //       extra completions in the list.
    this._enabled = true;

    await vscode.commands.executeCommand('editor.action.triggerSuggest');
  },

  provideCompletionItems: (
    document,
    position: vscode.Position,
    token,
    myContext
  ): Thenable<vscode.CompletionItem[] | vscode.CompletionList> => {
    return new Promise(async (resolve, reject) => {
      if (!this._enabled) {
        return reject({ items: [] });
      }

      const mh: ModeHandler = await getAndUpdateModeHandler();
      const completions = getCompletionsForCurrentLine(mh.vimState.cursorPosition, mh.vimState);

      if (!completions) {
        return reject({ items: [] });
      }

      const completionItems: vscode.CompletionItem[] = completions.map(text => {
        let completionItem = new vscode.CompletionItem(text);
        const description = text.replace(/^[ ]*/, '');
        completionItem.detail = description;
        completionItem.documentation = description;
        // completionItem.filterText = text;
        // completionItem.insertText = text;
        completionItem.label = description;
        completionItem.kind = vscode.CompletionItemKind.Snippet;
        completionItem.preselect = true;
        completionItem.sortText = '00000';
        completionItem.range = new vscode.Range(
          new vscode.Position(mh.vimState.cursorPosition.line, 0),
          position
        );
        return completionItem;
      });

      this._enabled = false;

      return resolve({ items: completionItems });
    });
  },
};
