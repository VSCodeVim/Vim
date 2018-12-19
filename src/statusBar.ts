import * as vscode from 'vscode';
import { ModeName } from './mode/mode';
import { configuration } from './configuration/configuration';

class StatusBarImpl implements vscode.Disposable {
  private _statusBarItem: vscode.StatusBarItem;
  private _previousModeName: ModeName | undefined;
  private _wasRecordingMacro: boolean;
  private _wasHighPriority: boolean;

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this._statusBarItem.show();
    this._previousModeName = undefined;
    this._wasRecordingMacro = false;
    this._wasHighPriority = false;
  }

  public Set(
    text: string,
    mode: ModeName,
    isRecordingMacro: boolean,
    isHighPriority: boolean = false
  ) {
    let hasModeChanged = mode !== this._previousModeName;

    // text
    let shouldUpdateText =
      hasModeChanged ||
      mode === ModeName.SearchInProgressMode ||
      mode === ModeName.CommandlineInProgress ||
      isRecordingMacro !== this._wasRecordingMacro ||
      configuration.showcmd;

    if ((shouldUpdateText && !this._wasHighPriority) || isHighPriority) {
      this.UpdateText(text);
    }

    // color
    let shouldUpdateColor = configuration.statusBarColorControl && hasModeChanged;
    if (shouldUpdateColor) {
      this.UpdateColor(mode);
    }

    if (hasModeChanged && mode !== ModeName.Normal) {
      this._wasHighPriority = false;
    } else if (isHighPriority) {
      this._wasHighPriority = true;
    }

    this._previousModeName = mode;
    this._wasRecordingMacro = isRecordingMacro;
  }

  dispose() {
    this._statusBarItem.dispose();
  }

  private UpdateText(text: string) {
    this._statusBarItem.text = text || '';
  }

  private UpdateColor(mode: ModeName) {
    let foreground;
    let background;

    const colorToSet = configuration.statusBarColors[ModeName[mode].toLowerCase()];
    if (colorToSet !== undefined) {
      if (typeof colorToSet === 'string') {
        background = colorToSet;
      } else {
        [background, foreground] = colorToSet;
      }
    }

    const currentColorCustomizations = vscode.workspace
      .getConfiguration('workbench')
      .get('colorCustomizations');

    const colorCustomizations = Object.assign(currentColorCustomizations || {}, {
      'statusBar.background': `${background}`,
      'statusBar.noFolderBackground': `${background}`,
      'statusBar.debuggingBackground': `${background}`,
      'statusBar.foreground': `${foreground}`,
    });

    if (foreground === undefined) {
      delete colorCustomizations['statusBar.foreground'];
    }

    vscode.workspace
      .getConfiguration('workbench')
      .update('colorCustomizations', colorCustomizations, true);
  }
}

export const StatusBar = new StatusBarImpl();
