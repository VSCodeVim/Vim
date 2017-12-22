import * as vscode from 'vscode';

class StatusBarClass implements vscode.Disposable {
  private _statusBarItem: vscode.StatusBarItem;

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  }

  set Text(text: string) {
    this._statusBarItem.text = text || '';
    this._statusBarItem.show();
  }

  set Color(color: string) {
    const currentColorCustomizations = vscode.workspace
      .getConfiguration('workbench')
      .get('colorCustomizations');
    vscode.workspace.getConfiguration('workbench').update(
      'colorCustomizations',
      Object.assign(currentColorCustomizations, {
        'statusBar.background': `${color}`,
        'statusBar.noFolderBackground': `${color}`,
        'statusBar.debuggingBackground': `${color}`,
      }),
      true
    );
  }

  dispose() {
    this._statusBarItem.dispose();
  }
}

export let StatusBar = new StatusBarClass();
