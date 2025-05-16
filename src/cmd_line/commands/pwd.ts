import { ExCommand } from '../../vimscript/exCommand';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import * as vscode from 'vscode';

/**
 * Implements the :pwd command, which prints the current working directory.
 */
export class PwdCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const currentDir = workspaceFolders[0].uri.fsPath;
      StatusBar.setText(vimState, `Current Directory: ${currentDir}`);
    } else {
      StatusBar.setText(vimState, 'No workspace folder is open.');
    }
  }
}
