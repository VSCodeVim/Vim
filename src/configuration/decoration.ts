import * as vscode from 'vscode';
import { IConfiguration } from './iconfiguration';

class DecorationImpl {
  private _default: vscode.TextEditorDecorationType;
  private _searchHighlight: vscode.TextEditorDecorationType;
  private _easyMotionIncSearch: vscode.TextEditorDecorationType;
  private _easyMotionDimIncSearch: vscode.TextEditorDecorationType;
  private _insertModeVirtualCharacter: vscode.TextEditorDecorationType;
  private _operatorPendingModeCursor: vscode.TextEditorDecorationType;
  private _operatorPendingModeCursorChar: vscode.TextEditorDecorationType;

  public set default(value: vscode.TextEditorDecorationType) {
    if (this._default) {
      this._default.dispose();
    }
    this._default = value;
  }

  public get default() {
    return this._default;
  }

  public set searchHighlight(value: vscode.TextEditorDecorationType) {
    if (this._searchHighlight) {
      this._searchHighlight.dispose();
    }
    this._searchHighlight = value;
  }

  public get searchHighlight() {
    return this._searchHighlight;
  }

  public set easyMotionIncSearch(value: vscode.TextEditorDecorationType) {
    if (this._easyMotionIncSearch) {
      this._easyMotionIncSearch.dispose();
    }
    this._easyMotionIncSearch = value;
  }

  public set easyMotionDimIncSearch(value: vscode.TextEditorDecorationType) {
    if (this._easyMotionDimIncSearch) {
      this._easyMotionDimIncSearch.dispose();
    }
    this._easyMotionDimIncSearch = value;
  }

  public get easyMotionIncSearch() {
    return this._easyMotionIncSearch;
  }

  public get easyMotionDimIncSearch() {
    return this._easyMotionDimIncSearch;
  }

  public set insertModeVirtualCharacter(value: vscode.TextEditorDecorationType) {
    if (this._insertModeVirtualCharacter) {
      this._insertModeVirtualCharacter.dispose();
    }
    this._insertModeVirtualCharacter = value;
  }

  public get insertModeVirtualCharacter() {
    return this._insertModeVirtualCharacter;
  }

  public set operatorPendingModeCursor(value: vscode.TextEditorDecorationType) {
    if (this._operatorPendingModeCursor) {
      this._operatorPendingModeCursor.dispose();
    }
    this._operatorPendingModeCursor = value;
  }

  public get operatorPendingModeCursor() {
    return this._operatorPendingModeCursor;
  }

  public set operatorPendingModeCursorChar(value: vscode.TextEditorDecorationType) {
    if (this._operatorPendingModeCursorChar) {
      this._operatorPendingModeCursorChar.dispose();
    }
    this._operatorPendingModeCursorChar = value;
  }

  public get operatorPendingModeCursorChar() {
    return this._operatorPendingModeCursorChar;
  }

  public load(configuration: IConfiguration) {
    this.default = vscode.window.createTextEditorDecorationType({
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

    this.searchHighlight = vscode.window.createTextEditorDecorationType({
      backgroundColor: searchHighlightColor,
      color: configuration.searchHighlightTextColor,
      overviewRulerColor: new vscode.ThemeColor('editorOverviewRuler.findMatchForeground'),
    });

    this.easyMotionIncSearch = vscode.window.createTextEditorDecorationType({
      color: configuration.easymotionIncSearchForegroundColor,
      fontWeight: configuration.easymotionMarkerFontWeight,
    });

    this.easyMotionDimIncSearch = vscode.window.createTextEditorDecorationType({
      color: configuration.easymotionDimColor,
    });

    this.insertModeVirtualCharacter = vscode.window.createTextEditorDecorationType({
      color: 'transparent', // no color to hide the existing character
      before: {
        color: 'currentColor',
        backgroundColor: new vscode.ThemeColor('editor.background'),
        borderColor: new vscode.ThemeColor('editor.background'),
        margin: '0 -1ch 0 0',
        height: '100%',
      },
    });

    // This creates the half block cursor when on operator pending mode
    this.operatorPendingModeCursor = vscode.window.createTextEditorDecorationType({
      before: {
        // no color to hide the existing character. We only need the character here to make
        // the width be the same as the existing character.
        color: 'transparent',
        // The '-1ch' right margin is so that it displays on top of the existing character. The amount
        // here doesn't really matter, it could be '-1px' it just needs to be negative so that the left
        // of this 'before' element coincides with the left of the existing character.
        margin: `0 -1ch 0 0;
        position: absolute;
        bottom: 0;
        line-height: 0;`,
        height: '50%',
        backgroundColor: new vscode.ThemeColor('editorCursor.foreground'),
      },
    });

    // This puts a character on top of the half block cursor and on top of the existing character
    // to create the mix-blend 'magic'
    this.operatorPendingModeCursorChar = vscode.window.createTextEditorDecorationType({
      // We make the existing character 'black' -> rgb(0,0,0), because when using the mix-blend-mode
      // with 'exclusion' it subtracts the darker color from the lightest color which means we will
      // subtract zero from our 'currentcolor' leaving us with 'currentcolor' on the part above the
      // background of the half cursor.
      color: 'black',
      before: {
        color: 'currentcolor',
        // The '-1ch' right margin is so that it displays on top of the existing character. The amount
        // here doesn't really matter, it could be '-1px' it just needs to be negative so that the left
        // of this 'before' element coincides with the left of the existing character.
        margin: `0 -1ch 0 0;
        position: absolute;
        mix-blend-mode: exclusion;`,
        height: '100%',
      },
    });
  }
}

export const decoration = new DecorationImpl();
