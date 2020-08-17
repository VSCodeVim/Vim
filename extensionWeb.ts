/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */
import './src/actions/include-main';

/**
 * Load configuration validator
 */

import './src/configuration/validators/inputMethodSwitcherValidator';
import './src/configuration/validators/remappingValidator';
import './src/configuration/validators/vimrcValidator';

import * as vscode from 'vscode';
import { activate as activateFunc } from './extensionBase';
export { getAndUpdateModeHandler } from './extensionBase';

export async function activate(context: vscode.ExtensionContext) {
  activateFunc(context, false);
}
