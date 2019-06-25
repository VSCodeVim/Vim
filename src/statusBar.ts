import * as vscode from 'vscode';
import { ModeName } from './mode/mode';
import { configuration } from './configuration/configuration';

class StatusBarImpl implements vscode.Disposable {
  private _statusBarItem: vscode.StatusBarItem;
  private _previousModeName: ModeName | undefined = undefined;
  private _wasRecordingMacro = false;
  private _wasHighPriority = false;

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this._statusBarItem.show();
  }

  public Set(
    text: string,
    mode: ModeName,
    isRecordingMacro: boolean,
    isHighPriority: boolean = false
  ) {
    const hasModeChanged = mode !== this._previousModeName;

    // text
    const shouldUpdateText =
      hasModeChanged ||
      mode === ModeName.SearchInProgressMode ||
      mode === ModeName.CommandlineInProgress ||
      isRecordingMacro !== this._wasRecordingMacro ||
      configuration.showcmd;

    // errors and other high-priorty messages remain displayed on the status bar
    // until specific conditions are met (such as the mode has changed)
    if ((shouldUpdateText && !this._wasHighPriority) || isHighPriority) {
      this.UpdateText(text);
    }

    // color
    const shouldUpdateColor = configuration.statusBarColorControl && hasModeChanged;
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

  public Get() {
    let text = this._statusBarItem.text;
    return text;
  }

  private UpdateText(text: string) {
    this._statusBarItem.text = text || '';
  }

  private UpdateColor(mode: ModeName) {
    let foreground: string | undefined = undefined;
    let background: string | undefined = undefined;

    let colorToSet = configuration.statusBarColors[ModeName[mode].toLowerCase()];

    if (colorToSet !== undefined) {
      if (typeof colorToSet === 'string') {
        background = colorToSet;
      } else {
        [background, foreground] = colorToSet;
      }
    }

    const workbenchConfiguration = vscode.workspace.getConfiguration('workbench');
    const currentColorCustomizations = workbenchConfiguration.get('colorCustomizations');

    const colorCustomizations = Object.assign({}, currentColorCustomizations || {}, {
      'statusBar.background': `${background}`,
      'statusBar.noFolderBackground': `${background}`,
      'statusBar.debuggingBackground': `${background}`,
      'statusBar.foreground': `${foreground}`,
    });

    // if colors are undefined, return to vscode defaults
    if (background === undefined) {
      delete colorCustomizations['statusBar.background'];
      delete colorCustomizations['statusBar.noFolderBackground'];
      delete colorCustomizations['statusBar.debuggingBackground'];
    }

    if (foreground === undefined) {
      delete colorCustomizations['statusBar.foreground'];
    }

    if (currentColorCustomizations !== colorCustomizations) {
      workbenchConfiguration.update('colorCustomizations', colorCustomizations, true);
    }
  }
}

export const StatusBar = new StatusBarImpl();
