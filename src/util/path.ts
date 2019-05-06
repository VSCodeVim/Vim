import * as vscode from 'vscode';
import * as path from 'path';
import untildify = require('untildify');
import { parseTabOnlyCommandArgs } from '../cmd_line/subparsers/tab';

/**
 * Given relative path, calculate absolute path.
 */
export function GetAbsolutePath(partialPath: string): string {
  const editorFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  let basePath: string;

  if (partialPath.startsWith('/')) {
    basePath = '/';
  } else if (partialPath.startsWith('~/')) {
    basePath = <string>untildify(partialPath);
    partialPath = '';
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
