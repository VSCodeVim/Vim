import * as vscode from "vscode";

import { getAndUpdateModeHandler } from "../../extension";
import { ModeHandler } from "../mode/modeHandler";
import { TextEditor } from "./../textEditor";

const documents = v => {
  return v.workspace.textDocuments;
};
const lines = document => {
  return document.getText().split("\n");
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
  provideCompletionItems: (
    document,
    position,
    token,
    myContext,
  ): Thenable<vscode.CompletionItem[] | vscode.CompletionList> => {
    return new Promise(async (resolve, reject) => {
      const mh: ModeHandler = await getAndUpdateModeHandler();

      const currentLineText = TextEditor.getText(
        new vscode.Range(
          new vscode.Position(mh.vimState.cursorPosition.line, 0),
          mh.vimState.cursorPosition,
        ),
      );

      const matchingText: string[] | null = getMatchingText(currentLineText);

      if (!matchingText) {
        return reject({ items: [] });
      }

      const completionItems: vscode.CompletionItem[] = matchingText.map(
        text => {
          let completionItem = new vscode.CompletionItem(text);
          completionItem.detail = text;
          completionItem.documentation = text;
          completionItem.filterText = text;
          completionItem.insertText = text.replace(/^[ ]*/, '');
          completionItem.label = text;
          completionItem.kind = vscode.CompletionItemKind.Text;
          return completionItem;
        },
      );

      return resolve({ items: completionItems });
    });
  },
};
