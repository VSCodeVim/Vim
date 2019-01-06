import * as vscode from 'vscode';
import { ModeName, Mode } from './mode/mode';
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

  public ReportLinesChanged(numLinesChanged: number, mode: ModeName) {
    if (numLinesChanged > configuration.report) {
      StatusBar.Set(numLinesChanged + ' more lines', mode, this._wasRecordingMacro, true);
    } else if (-numLinesChanged > configuration.report)
      StatusBar.Set(numLinesChanged + ' fewer lines', mode, this._wasRecordingMacro, true);
  }

  public ReportLinesYanked(numLinesYanked: number, mode: ModeName) {
    if (numLinesYanked > configuration.report) {
      if (mode === ModeName.VisualBlock) {
        StatusBar.Set(
          'block of ' + numLinesYanked + ' lines yanked',
          mode,
          this._wasRecordingMacro,
          true
        );
      } else {
        StatusBar.Set(numLinesYanked + ' lines yanked', mode, this._wasRecordingMacro, true);
      }
    }
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

    const workbenchConfiguration = vscode.workspace.getConfiguration('workbench');
    const currentColorCustomizations = workbenchConfiguration.get('colorCustomizations');

    const colorCustomizations = Object.assign({}, currentColorCustomizations || {}, {
      'statusBar.background': `${background}`,
      'statusBar.noFolderBackground': `${background}`,
      'statusBar.debuggingBackground': `${background}`,
      'statusBar.foreground': `${foreground}`,
    });

    if (foreground === undefined) {
      delete colorCustomizations['statusBar.foreground'];
    }

    if (currentColorCustomizations !== colorCustomizations) {
      workbenchConfiguration.update('colorCustomizations', colorCustomizations, true);
    }
  }
}

export const StatusBar = new StatusBarImpl();
