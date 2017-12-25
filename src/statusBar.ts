import * as vscode from 'vscode';

import { ModeName } from './mode/mode';

class StatusBarClass implements vscode.Disposable {
  private _statusBarItem: vscode.StatusBarItem;
  private _prevModeName: ModeName | undefined;

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this._prevModeName = undefined;
  }

  public SetText(text: string, mode: ModeName, forceShow: boolean = false) {
    if (mode !== this._prevModeName || forceShow) {
      this._prevModeName = mode;
      this._statusBarItem.text = text || '';
      this._statusBarItem.show();
    }
  }

  public SetColor(color: string) {
    const currentColorCustomizations = vscode.workspace
      .getConfiguration('workbench')
      .get('colorCustomizations');
    const mergedColorCustomizations = Object.assign(currentColorCustomizations, {
      'statusBar.background': `${color}`,
      'statusBar.noFolderBackground': `${color}`,
      'statusBar.debuggingBackground': `${color}`,
    });
    vscode.workspace
      .getConfiguration('workbench')
      .update('colorCustomizations', mergedColorCustomizations, true);
  }

  dispose() {
    this._statusBarItem.dispose();
  }
}

export let StatusBar = new StatusBarClass();
