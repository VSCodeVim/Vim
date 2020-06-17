import * as vscode from 'vscode';
import { IConfiguration } from './iconfiguration';

class DecorationImpl {
  private _default: vscode.TextEditorDecorationType;
  private _searchHighlight: vscode.TextEditorDecorationType;
  private _easyMotion: vscode.TextEditorDecorationType;
  private _insertModeVirtualCharacter: vscode.TextEditorDecorationType;

  public set Default(value: vscode.TextEditorDecorationType) {
    if (this._default) {
      this._default.dispose();
    }
    this._default = value;
  }

  public get Default() {
    return this._default;
  }

  public set SearchHighlight(value: vscode.TextEditorDecorationType) {
    if (this._searchHighlight) {
      this._searchHighlight.dispose();
    }
    this._searchHighlight = value;
  }

  public get SearchHighlight() {
    return this._searchHighlight;
  }

  public set EasyMotion(value: vscode.TextEditorDecorationType) {
    if (this._easyMotion) {
      this._easyMotion.dispose();
    }
    this._easyMotion = value;
  }

  public get EasyMotion() {
    return this._easyMotion;
  }

  public set InsertModeVirtualCharacter(value: vscode.TextEditorDecorationType) {
    if (this._insertModeVirtualCharacter) {
      this._insertModeVirtualCharacter.dispose();
    }
    this._insertModeVirtualCharacter = value;
  }

  public get InsertModeVirtualCharacter() {
    return this._insertModeVirtualCharacter;
  }

  public load(configuration: IConfiguration) {
    this.Default = vscode.window.createTextEditorDecorationType({
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

    const searchHighlightColor = configuration.searchHighlightColor
      ? configuration.searchHighlightColor
      : new vscode.ThemeColor('editor.findMatchHighlightBackground');

    this.SearchHighlight = vscode.window.createTextEditorDecorationType({
      backgroundColor: searchHighlightColor,
      color: configuration.searchHighlightTextColor,
      overviewRulerColor: new vscode.ThemeColor('editorOverviewRuler.findMatchForeground'),
    });

    this.EasyMotion = vscode.window.createTextEditorDecorationType({
      backgroundColor: searchHighlightColor,
    });

    this.InsertModeVirtualCharacter = vscode.window.createTextEditorDecorationType({
      color: 'transparent', // no color to hide the existing character
      backgroundColor: new vscode.ThemeColor('editorCursor.foreground'),
      dark: {
        before: {
          color: 'rgb(81,80,82)',
        },
      },
      light: {
        before: {
          // used for light colored themes
          color: 'rgb(255, 255, 255)',
        },
      },
      before: {
        margin: '0 -1px 0 0',
        width: '1px',
        textDecoration: 'none; position: absolute; z-index:99;',
      },
    });
  }
}

export const decoration = new DecorationImpl();
