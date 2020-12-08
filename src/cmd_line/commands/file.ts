import * as vscode from 'vscode';
import { Logger } from '../../util/logger';
import { getPathDetails, resolveUri } from '../../util/path';
import * as node from '../node';
import { doesFileExist } from 'platform/fs';
import untildify = require('untildify');
import { VimState } from '../../state/vimState';

export enum FilePosition {
  NewWindowVerticalSplit,
  NewWindowHorizontalSplit,
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
  private readonly _logger = Logger.get('File');

  constructor(args: IFileCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IFileCommandArguments {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.arguments.bang) {
      await vscode.commands.executeCommand('workbench.action.files.revert');
      return;
    }

    // Need to do this before the split since it loses the activeTextEditor
    const editorFileUri = vscode.window.activeTextEditor!.document.uri;
    let editorFilePath = editorFileUri.fsPath;

    // Do the split if requested
    let split = false;
    if (this.arguments.position === FilePosition.NewWindowVerticalSplit) {
      await vscode.commands.executeCommand('workbench.action.splitEditorRight');
      split = true;
    }
    if (this.arguments.position === FilePosition.NewWindowHorizontalSplit) {
      await vscode.commands.executeCommand('workbench.action.splitEditorDown');
      split = true;
    }

    let hidePreviousEditor = async function () {
      if (split === true) {
        await vscode.commands.executeCommand('workbench.action.previousEditor');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    };

    // No name was specified
    if (this.arguments.name === undefined) {
      if (this.arguments.createFileIfNotExists === true) {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await hidePreviousEditor();
      }
      return;
    }

    // Only untidify when the currently open page and file completion is local
    if (this.arguments.name && editorFileUri.scheme === 'file') {
      this._arguments.name = untildify(this.arguments.name);
    }

    let fileUri = editorFileUri;
    // Using the empty string will request to open a file
    if (this.arguments.name === '') {
      // No name on split is fine and just return
      if (split === true) {
        return;
      }

      const fileList = await vscode.window.showOpenDialog({});
      if (fileList && fileList.length > 0) {
        fileUri = fileList[0];
      }
    } else {
      // remove file://
      this._arguments.name = this.arguments.name.replace(/^file:\/\//, '');

      // Using a filename, open or create the file
      const isRemote = !!vscode.env.remoteName;
      const { fullPath, path: p } = getPathDetails(this.arguments.name, editorFileUri, isRemote);
      // Only if the expanded path of the full path is different than
      // the currently opened window path
      if (fullPath !== editorFilePath) {
        const uriPath = resolveUri(fullPath, p.sep, editorFileUri, isRemote);
        if (uriPath === null) {
          // return if the path is invalid
          return;
        }

        let fileExists = await doesFileExist(uriPath);
        if (fileExists) {
          // If the file without the added ext exists
          fileUri = uriPath;
        } else {
          // if file does not exist
          // try to find it with the same extension as the current file
          const pathWithExt = fullPath + p.extname(editorFilePath);
          const uriPathWithExt = resolveUri(pathWithExt, p.sep, editorFileUri, isRemote);
          if (uriPathWithExt !== null) {
            fileExists = await doesFileExist(uriPathWithExt);
            if (fileExists) {
              // if the file with the added ext exists
              fileUri = uriPathWithExt;
            }
          }
        }

        // If both with and without ext path do not exist
        if (!fileExists) {
          if (this.arguments.createFileIfNotExists) {
            // Change the scheme to untitled to open an
            // untitled tab
            fileUri = uriPath.with({ scheme: 'untitled' });
          } else {
            this._logger.error(`${this.arguments.name} does not exist.`);
            return;
          }
        }
      }
    }

    const doc = await vscode.workspace.openTextDocument(fileUri);
    vscode.window.showTextDocument(doc);

    if (this.arguments.lineNumber) {
      vscode.window.activeTextEditor!.revealRange(
        new vscode.Range(
          new vscode.Position(this.arguments.lineNumber, 0),
          new vscode.Position(this.arguments.lineNumber, 0)
        )
      );
    }
    await hidePreviousEditor();
  }
}
