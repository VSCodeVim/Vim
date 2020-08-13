import * as vscode from 'vscode';
import { IConfiguration } from './iconfiguration';

class DecorationImpl {
  private _default: vscode.TextEditorDecorationType;
  private _searchHighlight: vscode.TextEditorDecorationType;
  private _easyMotionIncSearch: vscode.TextEditorDecorationType;
  private _easyMotionDimIncSearch: vscode.TextEditorDecorationType;

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

  public set EasyMotionIncSearch(value: vscode.TextEditorDecorationType) {
    if (this._easyMotionIncSearch) {
      this._easyMotionIncSearch.dispose();
    }
    this._easyMotionIncSearch = value;
  }

  public set EasyMotionDimIncSearch(value: vscode.TextEditorDecorationType) {
    if (this._easyMotionDimIncSearch) {
      this._easyMotionDimIncSearch.dispose();
    }
    this._easyMotionDimIncSearch = value;
  }

  public get EasyMotionIncSearch() {
    return this._easyMotionIncSearch;
  }

  public get EasyMotionDimIncSearch() {
    return this._easyMotionDimIncSearch;
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

    this.EasyMotionIncSearch = vscode.window.createTextEditorDecorationType({
      color: configuration.easymotionIncSearchForegroundColor,
      fontWeight: configuration.easymotionMarkerFontWeight,
    });

    this.EasyMotionDimIncSearch = vscode.window.createTextEditorDecorationType({
      color: configuration.easymotionDimColor,
    });
  }
}

export const decoration = new DecorationImpl();
