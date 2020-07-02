import * as vscode from 'vscode';
import { IConfiguration } from './iconfiguration';

class DecorationImpl {
  private _default: vscode.TextEditorDecorationType;
  private _searchHighlight: vscode.TextEditorDecorationType;
  private _easyMotion: vscode.TextEditorDecorationType;
  private _insertModeVirtualCharacter: vscode.TextEditorDecorationType;
  private _operatorPendingModeCursor: vscode.TextEditorDecorationType;
  private _operatorPendingModeCursorChar: vscode.TextEditorDecorationType;

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

  public set OperatorPendingModeCursor(value: vscode.TextEditorDecorationType) {
    if (this._operatorPendingModeCursor) {
      this._operatorPendingModeCursor.dispose();
    }
    this._operatorPendingModeCursor = value;
  }

  public get OperatorPendingModeCursor() {
    return this._operatorPendingModeCursor;
  }

  public set OperatorPendingModeCursorChar(value: vscode.TextEditorDecorationType) {
    if (this._operatorPendingModeCursorChar) {
      this._operatorPendingModeCursorChar.dispose();
    }
    this._operatorPendingModeCursorChar = value;
  }

  public get OperatorPendingModeCursorChar() {
    return this._operatorPendingModeCursorChar;
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
      before: {
        color: 'currentColor',
        backgroundColor: new vscode.ThemeColor('editor.background'),
        borderColor: new vscode.ThemeColor('editor.background'),
        margin: '0 -1ch 0 0',
        height: '100%',
      },
    });

    // This creates the half block cursor when on operator pending mode
    this.OperatorPendingModeCursor = vscode.window.createTextEditorDecorationType({
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
    this.OperatorPendingModeCursorChar = vscode.window.createTextEditorDecorationType({
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
