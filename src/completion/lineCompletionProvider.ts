import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../mode/modeHandler';
import { TextEditor } from './../textEditor';

const documents = v => {
  return v.workspace.textDocuments;
};
const lines = document => {
  return document.getText().split('\n');
};
const getMatchingText = (text: string): string[] | null => {
  const matchedLines: string[] = [];

  for (const document of documents(vscode)) {
    for (const line of lines(document)) {
      if (line && line.startsWith(text) && line !== text) {
        matchedLines.push(line);
      }
    }
  }

  return matchedLines;
};

export const lineCompletionProvider = {
  _enabled: false,

  showLineCompletions: async (): Promise<void> => {
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

      const currentLineText = TextEditor.getText(
        new vscode.Range(
          new vscode.Position(mh.vimState.cursorPosition.line, 0),
          mh.vimState.cursorPosition
        )
      );

      const matchingText: string[] | null = getMatchingText(currentLineText);

      if (!matchingText) {
        return reject({ items: [] });
      }

      const completionItems: vscode.CompletionItem[] = matchingText.map(text => {
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
