import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';

export class Decoration {
  static readonly Default = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editorCursor.foreground'),
    borderColor: new vscode.ThemeColor('editorCursor.foreground'),
    dark: {
      color: 'rgb(81,80,82)',
    },
    light: {
      // used for light colored themes
      color: 'rgb(255, 255, 255)',
    },
    borderStyle: 'solid',
    borderWidth: '1px',
  });

  static readonly SearchHighlight = vscode.window.createTextEditorDecorationType({
    backgroundColor: configuration.searchHighlightColor,
  });

  static readonly EasyMotion = vscode.window.createTextEditorDecorationType({
    backgroundColor: configuration.searchHighlightColor,
  });
}
