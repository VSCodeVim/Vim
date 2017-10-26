import * as vscode from 'vscode';
import { Vim } from '../extension';

export class VimSettings {
  static indentexpr: string = '';
  static get normalModeSettings() {
    return [
      'autoindent',
      'cindent',
      'smartindent',
      `indentexpr=${this.indentexpr}`,
      `shiftwidth=${vscode.window.activeTextEditor!.options.tabSize}`,
    ];
  }
  static async insertModeSettings() {
    return ['noautoindent', 'nocindent', 'nosmartindent', 'indentexpr=', 'shiftwidth=1'];
  }

  static async enterFileSettings() {
    let result: string[] = [];
    const currentFileSettings = vscode.window.activeTextEditor!.options;
    if (currentFileSettings.insertSpaces) {
      result.push('expandtab');
    }
    this.indentexpr = await (await Vim.nv.buffer).getOption('indentexpr');

    result = result.concat([
      `tabstop=${currentFileSettings.tabSize}`,
      `shiftwidth=${currentFileSettings.tabSize}`,
    ]);
    return result;
  }
}
