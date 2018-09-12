import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../mode/modeHandler';
import { ModeName } from '../mode/mode';
import { Position, PositionDiff } from '../common/motion/position';
import { TextEditor } from './../textEditor';
import { VimState } from '../state/vimState';
import { Range } from '../common/motion/range';

const documents = v => {
  return v.workspace.textDocuments;
};
const lines = document => {
  return document.getText().split('\n');
};
const getCompletionsForText = (text: string): string[] | null => {
  const matchedLines: string[] = [];

  for (const document of documents(vscode)) {
    for (const line of lines(document)) {
      const lineWithoutPadding = line.replace(/^[ \t]/, '');
      if (
        matchedLines.indexOf(line) === -1 &&
        lineWithoutPadding &&
        lineWithoutPadding.startsWith(text) &&
        lineWithoutPadding !== text
      ) {
        matchedLines.push(lineWithoutPadding);
      }
    }
  }

  return matchedLines;
};

const getCompletionsForCurrentLine = (position: Position, vimState: VimState): string[] | null => {
  const currentLineText = TextEditor.getText(
    new vscode.Range(position.getFirstLineNonBlankChar(), vimState.cursorPosition)
  );

  return getCompletionsForText(currentLineText);
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
