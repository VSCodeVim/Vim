import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { VimState } from '../state/vimState';

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

  static yankHighlight(vimState: VimState, range: vscode.Range[]) {
    const decoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: configuration.yankHighlightColor,
    });

    vimState.editor.setDecorations(decoration, range);
    setTimeout(() => decoration.dispose(), 200);
  }
}
