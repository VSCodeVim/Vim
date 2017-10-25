import * as vscode from 'vscode';
export class VimSettings {
  static get normalModeSettings() {
    return [
      'autoindent',
      'cindent',
      'smartindent',
      'indentexpr=',
      `shiftwidth=${vscode.window.activeTextEditor!.options.tabSize}`,
    ];
  }
  static get insertModeSettings() {
    return ['noautoindent', 'nocindent', 'nosmartindent', 'indentexpr=', 'shiftwidth=1'];
  }

  static get enterFileSettings() {
    let result: string[] = [];
    const currentFileSettings = vscode.window.activeTextEditor!.options;
    if (currentFileSettings.insertSpaces) {
      result.push('expandtab');
    }
    result = result.concat([
      `tabstop=${currentFileSettings.tabSize}`,
      `shiftwidth=${currentFileSettings.tabSize}`,
    ]);
    return result;
  }
}
