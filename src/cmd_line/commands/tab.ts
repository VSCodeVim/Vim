import * as path from 'path';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';

import * as node from '../node';

export enum Tab {
  Next,
  Previous,
  First,
  Last,
  Absolute,
  New,
  Close,
  Only,
  Move,
}

export interface ITabCommandArguments extends node.ICommandArgs {
  tab: Tab;
  count?: number;
  direction?: 'left' | 'right';
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
    this._arguments = args;
  }

  get arguments(): ITabCommandArguments {
    return this._arguments;
  }

  private async executeCommandWithCount(count: number, command: string): Promise<void> {
    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand(command);
    }
  }

  async execute(vimState: VimState): Promise<void> {
    switch (this._arguments.tab) {
      case Tab.Absolute:
        if (this._arguments.count !== undefined && this._arguments.count >= 0) {
          await vscode.commands.executeCommand(
            'workbench.action.openEditorAtIndex',
            this._arguments.count
          );
        }
        break;
      case Tab.Next:
        if (this._arguments.count !== undefined && this._arguments.count <= 0) {
          break;
        }

        await this.executeCommandWithCount(
          this._arguments.count || 1,
          'workbench.action.nextEditorInGroup'
        );
        break;
      case Tab.Previous:
        if (this._arguments.count !== undefined && this._arguments.count <= 0) {
          break;
        }

        await this.executeCommandWithCount(
          this._arguments.count || 1,
          'workbench.action.previousEditorInGroup'
        );
        break;
      case Tab.First:
        await vscode.commands.executeCommand('workbench.action.openEditorAtIndex1');
        break;
      case Tab.Last:
        await vscode.commands.executeCommand('workbench.action.lastEditorInGroup');
        break;
      case Tab.New: {
        const hasFile = !(this.arguments.file === undefined || this.arguments.file === '');
        if (hasFile) {
          const isAbsolute = path.isAbsolute(this.arguments.file!);
          const isInWorkspace =
            vscode.workspace.workspaceFolders !== undefined &&
            vscode.workspace.workspaceFolders.length > 0;
          const currentFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;

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
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
          break;
        }

        if (this._arguments.count === 0) {
          // Wrong paramter
          break;
        }

        // TODO: Close Page {count}. Page count is one-based.
        break;
      case Tab.Only:
        await vscode.commands.executeCommand('workbench.action.closeOtherEditors');
        break;
      case Tab.Move: {
        const { count, direction } = this.arguments;
        let args;
        if (direction !== undefined) {
          args = { to: direction, by: 'tab', value: count };
        } else if (count === 0) {
          args = { to: 'first' };
        } else if (count === undefined) {
          args = { to: 'last' };
        } else {
          args = { to: 'position', by: 'tab', value: count + 1 };
        }
        await vscode.commands.executeCommand('moveActiveEditor', args);
        break;
      }
      default:
        break;
    }
  }
}
