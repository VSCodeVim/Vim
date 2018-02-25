import * as path from 'path';
import * as vscode from 'vscode';

import * as node from '../node';

export enum Tab {
  Next,
  Previous,
  First,
  Last,
  New,
  Close,
  Only,
  Move,
}

export interface ITabCommandArguments extends node.ICommandArgs {
  tab: Tab;
  count?: number;
  file?: string;
}

//
//  Implements tab
//  http://vimdoc.sourceforge.net/htmldoc/tabpage.html
//
export class TabCommand extends node.CommandBase {
  protected _arguments: ITabCommandArguments;

  constructor(args: ITabCommandArguments) {
    super();
    this._name = 'tab';
    this._arguments = args;
  }

  get arguments(): ITabCommandArguments {
    return this._arguments;
  }

  private executeCommandWithCount(count: number, command: string) {
    for (let i = 0; i < count; i++) {
      vscode.commands.executeCommand(command);
    }
  }

  async execute(): Promise<void> {
    switch (this._arguments.tab) {
      case Tab.Next:
        if (this._arguments.count /** not undefined or 0 */) {
          vscode.commands.executeCommand('workbench.action.openEditorAtIndex1');
          this.executeCommandWithCount(
            this._arguments.count! - 1,
            'workbench.action.nextEditorInGroup'
          );
        } else {
          this.executeCommandWithCount(1, 'workbench.action.nextEditorInGroup');
        }
        break;
      case Tab.Previous:
        if (this._arguments.count !== undefined && this._arguments.count <= 0) {
          break;
        }

        this.executeCommandWithCount(
          this._arguments.count || 1,
          'workbench.action.previousEditorInGroup'
        );
        break;
      case Tab.First:
        this.executeCommandWithCount(1, 'workbench.action.openEditorAtIndex1');
        break;
      case Tab.Last:
        this.executeCommandWithCount(1, 'workbench.action.openLastEditorInGroup');
        break;
      case Tab.New: {
        const hasFile = !(this.arguments.file === undefined || this.arguments.file === '');
        if (hasFile) {
          const isAbsolute = path.isAbsolute(this.arguments.file!);
          const isInWorkspace =
            vscode.workspace.workspaceFolders !== undefined &&
            vscode.workspace.workspaceFolders.length > 0;
          const currentFilePath = vscode.window.activeTextEditor!.document.uri.path;

          let toOpenPath: string;
          if (isAbsolute) {
            toOpenPath = this.arguments.file!;
          } else if (isInWorkspace) {
            const workspacePath = vscode.workspace.workspaceFolders![0].uri.path;
            toOpenPath = path.join(workspacePath, this.arguments.file!);
          } else {
            toOpenPath = path.join(path.dirname(currentFilePath), this.arguments.file!);
          }

          if (toOpenPath !== currentFilePath) {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(toOpenPath));
          }
        } else {
          await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        }
        break;
      }
      case Tab.Close:
        // Navigate the correct position
        if (this._arguments.count === undefined) {
          vscode.commands.executeCommand('workbench.action.closeActiveEditor');
          break;
        }

        if (this._arguments.count === 0) {
          // Wrong paramter
          break;
        }

        // TODO: Close Page {count}. Page count is one-based.
        break;
      case Tab.Only:
        this.executeCommandWithCount(1, 'workbench.action.closeOtherEditors');
        break;
      case Tab.Move:
        if (this._arguments.count !== undefined) {
          if (this._arguments.count === 0) {
            vscode.commands.executeCommand('activeEditorMove', { to: 'first' });
          } else {
            vscode.commands.executeCommand('activeEditorMove', {
              to: 'position',
              amount: this._arguments.count,
            });
          }
        } else {
          vscode.commands.executeCommand('activeEditorMove', { to: 'last' });
        }
        break;

      default:
        break;
    }
  }
}
