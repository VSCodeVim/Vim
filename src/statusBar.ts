import * as vscode from 'vscode';

import { ModeName } from './mode/mode';

class StatusBarImpl implements vscode.Disposable {
  private _statusBarItem: vscode.StatusBarItem;
  private _prevModeName: ModeName | undefined;
  private _isRecordingMacro: boolean;

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this._prevModeName = undefined;
    this._isRecordingMacro = false;
  }

  public SetText(
    text: string,
    mode: ModeName,
    isRecordingMacro: boolean,
    forceUpdate: boolean = false
  ) {
    let updateStatusBar =
      this._prevModeName !== mode || this._isRecordingMacro !== isRecordingMacro || forceUpdate;

    this._prevModeName = mode;
    this._isRecordingMacro = isRecordingMacro;

    if (updateStatusBar) {
      this._statusBarItem.text = text || '';
      this._statusBarItem.show();
    }
  }

  public SetColor(background: string, foreground?: string) {
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

  dispose() {
    this._statusBarItem.dispose();
  }
}

export let StatusBar = new StatusBarImpl();
