/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */
import './src/actions/include-main';
import './src/actions/include-plugins';

/**
 * Load configuration validator
 */

import './src/configuration/validators/inputMethodSwitcherValidator';
import './src/configuration/validators/remappingValidator';
import './src/configuration/validators/neovimValidator';
import './src/configuration/validators/vimrcValidator';

import * as vscode from 'vscode';
import {
  activate as activateFunc,
  loadConfiguration,
  registerCommand,
  registerEventListener,
} from './extensionBase';
import { Globals } from './src/globals';
import { Register } from './src/register/register';
import { vimrc } from './src/configuration/vimrc';
import * as path from 'path';
import { Logger } from './src/util/logger';

export { getAndUpdateModeHandler } from './extensionBase';

export async function activate(context: vscode.ExtensionContext) {
  // Set the storage path to be used by history files
  Globals.extensionStoragePath = context.globalStorageUri.fsPath;

  await activateFunc(context);

  registerEventListener(context, vscode.workspace.onDidSaveTextDocument, async (document) => {
    if (vimrc.vimrcPath && path.relative(document.fileName, vimrc.vimrcPath) === '') {
      await loadConfiguration();
      Logger.info('Sourced new .vimrc');
    }
  });

  registerCommand(
    context,
    'vim.editVimrc',
    async () => {
      if (vimrc.vimrcPath) {
        const document = await vscode.workspace.openTextDocument(vimrc.vimrcPath);
        await vscode.window.showTextDocument(document);
      } else {
        await vscode.window.showWarningMessage('No .vimrc found. Please set `vim.vimrc.path`.');
      }
    },
    false,
  );
}

export async function deactivate() {
  await Register.saveToDisk(true);
}
