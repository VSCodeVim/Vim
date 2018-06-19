import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import * as node from '../node';
import { Message } from './../../util/message';

const untildify = require('untildify');

export enum FilePosition {
  CurrentWindow,
  NewWindow,
}

export interface IFileCommandArguments extends node.ICommandArgs {
  name: string | undefined;
  bang?: boolean;
  position?: FilePosition;
  lineNumber?: number;
  createFileIfNotExists?: boolean;
}

export class FileCommand extends node.CommandBase {
  protected _arguments: IFileCommandArguments;

  constructor(args: IFileCommandArguments) {
    super();
    this._name = 'file';
    this._arguments = args;
  }

  get arguments(): IFileCommandArguments {
    return this._arguments;
  }

  getActiveViewColumn(): vscode.ViewColumn {
    const active = vscode.window.activeTextEditor;

    if (!active) {
      return vscode.ViewColumn.One;
    }

    return active.viewColumn!;
  }

  getViewColumnToRight(): vscode.ViewColumn {
    const active = vscode.window.activeTextEditor;

    if (!active) {
      return vscode.ViewColumn.One;
    }

    switch (active.viewColumn) {
      case vscode.ViewColumn.One:
        return vscode.ViewColumn.Two;
      case vscode.ViewColumn.Two:
        return vscode.ViewColumn.Three;
    }

    return active.viewColumn!;
  }

  async execute(): Promise<void> {
    if (this._arguments.bang) {
      await vscode.commands.executeCommand('workbench.action.files.revert');
      return;
    }
    if (this._arguments.name === undefined) {
      // Open an empty file
      if (this._arguments.position === FilePosition.CurrentWindow) {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
      } else {
        await vscode.commands.executeCommand('workbench.action.splitEditor');
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await vscode.commands.executeCommand('workbench.action.closeOtherEditors');
      }
      return;
    } else if (this._arguments.name === '') {
      if (this._arguments.position === FilePosition.NewWindow) {
        await vscode.commands.executeCommand('workbench.action.splitEditor');
        return;
      }
      const fileList = await vscode.window.showOpenDialog({});
      if (fileList) {
        const doc = await vscode.workspace.openTextDocument(fileList[0]);
        vscode.window.showTextDocument(doc);
      }
      return;
    }

    let editorFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
    this._arguments.name = <string>untildify(this._arguments.name);
    let filePath = path.isAbsolute(this._arguments.name)
      ? this._arguments.name
      : path.join(path.dirname(editorFilePath), this._arguments.name);

    if (filePath !== editorFilePath) {
      if (!fs.existsSync(filePath)) {
        // if file does not exist and does not have an extension
        // try to find it with the same extension
        if (path.extname(filePath) === '') {
          const pathWithExt = filePath + path.extname(editorFilePath);
          if (fs.existsSync(pathWithExt)) {
            filePath = pathWithExt;
          } else {
            // create file
            if (this.arguments.createFileIfNotExists) {
              fs.closeSync(fs.openSync(filePath, 'w'));
            } else {
              Message.ShowError('The file ' + filePath + ' does not exist.');
              return;
            }
          }
        }
      }

      let folder = vscode.Uri.file(filePath);
      await vscode.commands.executeCommand(
        'vscode.open',
        folder,
        this._arguments.position === FilePosition.NewWindow
          ? this.getViewColumnToRight()
          : this.getActiveViewColumn()
      );

      if (this.arguments.lineNumber) {
        vscode.window.activeTextEditor!.revealRange(
          new vscode.Range(
            new vscode.Position(this.arguments.lineNumber, 0),
            new vscode.Position(this.arguments.lineNumber, 0)
          )
        );
      }
    }
  }
}
