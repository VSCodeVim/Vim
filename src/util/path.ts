import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

/**
 * Get the base path based on a path
 */
export function AbsolutePathFromRelativePath(partialPath: string): string {
  const editorFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  let basePath: string;

  if (partialPath.startsWith('/')) {
    basePath = '/';
  } else if (partialPath.startsWith('~/')) {
    basePath = os.homedir();
    partialPath = partialPath.replace('~/', '');
  } else if (partialPath.startsWith('./')) {
    basePath = path.dirname(editorFilePath);
    partialPath = partialPath.replace('./', '');
  } else if (partialPath.startsWith('../')) {
    basePath = path.dirname(editorFilePath) + '/';
  } else {
    basePath = path.dirname(editorFilePath);
  }

  return basePath + partialPath;
}