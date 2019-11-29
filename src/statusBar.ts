import * as vscode from 'vscode';
import { ModeName } from './mode/mode';
import { configuration } from './configuration/configuration';
import { VimState } from './state/vimState';

class StatusBarImpl implements vscode.Disposable {
  private _statusBarItem: vscode.StatusBarItem;
  private _previousModeName: ModeName | undefined = undefined;
  private _wasRecordingMacro = false;
  private _wasHighPriority = false;

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this._statusBarItem.show();
  }

  public Set(text: string, vimState: VimState, isHighPriority = false, isError = false) {
    const hasModeChanged = vimState.currentMode !== this._previousModeName;

    // text
    const shouldUpdateText =
      hasModeChanged ||
      vimState.currentMode === ModeName.SearchInProgressMode ||
      vimState.currentMode === ModeName.CommandlineInProgress ||
      vimState.isRecordingMacro !== this._wasRecordingMacro ||
      configuration.showcmd;

    // Errors and other high-priority messages remain displayed on the status bar
    // until specific conditions are met (such as the mode has changed)
    if ((shouldUpdateText && !this._wasHighPriority) || isHighPriority) {
      this.UpdateText(text);
      if (!configuration.statusBarColorControl) {
        this._statusBarItem.color = isError ? new vscode.ThemeColor('errorForeground') : undefined;
      }
    }

    // color
    const shouldUpdateColor = configuration.statusBarColorControl && hasModeChanged;
    if (shouldUpdateColor) {
      this.UpdateColor(vimState.currentMode);
    }

    if (hasModeChanged && vimState.currentMode !== ModeName.Normal) {
      this._wasHighPriority = false;
    } else if (isHighPriority) {
      this._wasHighPriority = true;
    }

    this._previousModeName = vimState.currentMode;
    this._wasRecordingMacro = vimState.isRecordingMacro;
  }

  dispose() {
    this._statusBarItem.dispose();
  }

  public Get() {
    return this._statusBarItem.text.replace(/\^M/g, '\n');
  }

  private UpdateText(text: string) {
    const escaped = text.replace(/\n/g, '^M');
    this._statusBarItem.text = escaped || '';
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

    // If colors are undefined, return to VSCode defaults
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
