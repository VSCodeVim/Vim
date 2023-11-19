import * as vscode from 'vscode';
import { Logger } from '../../util/logger';
import { getPathDetails, resolveUri } from '../../util/path';
import { doesFileExist } from 'platform/fs';
import untildify = require('untildify');
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import {
  bangParser,
  FileCmd,
  fileCmdParser,
  fileNameParser,
  FileOpt,
  fileOptParser,
} from '../../vimscript/parserUtils';
import { optWhitespace, regexp, seq } from 'parsimmon';

export enum FilePosition {
  NewWindowVerticalSplit,
  NewWindowHorizontalSplit,
}

export type IFileCommandArguments =
  | {
      name: 'edit';
      bang: boolean;
      opt: FileOpt;
      cmd?: FileCmd;
      file?: string;
      createFileIfNotExists?: boolean;
    }
  | {
      name: 'enew';
      bang: boolean;
      createFileIfNotExists?: boolean;
    }
  | {
      name: 'new' | 'vnew' | 'split' | 'vsplit';
      opt: FileOpt;
      cmd?: FileCmd;
      file?: string;
      createFileIfNotExists?: boolean;
    };

// TODO: This is a hack to get this to work in the short term with new arg parsing logic.
type LegacyArgs = {
  file?: string;
  bang?: boolean;
  position?: FilePosition;
  cmd?: FileCmd;
  createFileIfNotExists?: boolean;
};
function getLegacyArgs(args: IFileCommandArguments): LegacyArgs {
  if (args.name === 'edit') {
    return { file: args.file, bang: args.bang, cmd: args.cmd, createFileIfNotExists: true };
  } else if (args.name === 'enew') {
    return { bang: args.bang, createFileIfNotExists: true };
  } else if (args.name === 'new') {
    return {
      file: args.file,
      position: FilePosition.NewWindowHorizontalSplit,
      createFileIfNotExists: true,
    };
  } else if (args.name === 'vnew') {
    return {
      file: args.file,
      position: FilePosition.NewWindowVerticalSplit,
      createFileIfNotExists: true,
    };
  } else if (args.name === 'split') {
    return {
      file: args.file,
      position: FilePosition.NewWindowHorizontalSplit,
      createFileIfNotExists: true,
    };
  } else if (args.name === 'vsplit') {
    return {
      file: args.file,
      position: FilePosition.NewWindowVerticalSplit,
      createFileIfNotExists: true,
    };
  } else {
    throw new Error(`Unexpected FileCommand.arguments.name: ${args.name}`);
  }
}

export class FileCommand extends ExCommand {
  // TODO: There's a lot of duplication here
  // TODO: These `optWhitespace` calls should be `whitespace`
  public static readonly argParsers = {
    edit: seq(
      bangParser,
      optWhitespace.then(fileOptParser).fallback([]),
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(fileNameParser).fallback(undefined),
    ).map(([bang, opt, cmd, file]) => new FileCommand({ name: 'edit', bang, opt, cmd, file })),
    enew: bangParser.map((bang) => new FileCommand({ name: 'enew', bang })),
    new: seq(
      optWhitespace.then(fileOptParser).fallback([]),
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(fileNameParser).fallback(undefined),
    ).map(([opt, cmd, file]) => new FileCommand({ name: 'new', opt, cmd, file })),
    split: seq(
      optWhitespace.then(fileOptParser).fallback([]),
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(fileNameParser).fallback(undefined),
    ).map(([opt, cmd, file]) => new FileCommand({ name: 'split', opt, cmd, file })),
    vnew: seq(
      optWhitespace.then(fileOptParser).fallback([]),
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(fileNameParser).fallback(undefined),
    ).map(([opt, cmd, file]) => new FileCommand({ name: 'vnew', opt, cmd, file })),
    vsplit: seq(
      optWhitespace.then(fileOptParser).fallback([]),
      optWhitespace.then(fileCmdParser).fallback(undefined),
      optWhitespace.then(fileNameParser).fallback(undefined),
    ).map(([opt, cmd, file]) => new FileCommand({ name: 'vsplit', opt, cmd, file })),
  };

  private readonly arguments: IFileCommandArguments;

  constructor(args: IFileCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    const args = getLegacyArgs(this.arguments);

    if (args.bang) {
      await vscode.commands.executeCommand('workbench.action.files.revert');
      return;
    }

    // Need to do this before the split since it loses the activeTextEditor
    const editorFileUri = vscode.window.activeTextEditor!.document.uri;
    const editorFilePath = editorFileUri.fsPath;

    // Do the split if requested
    let split = false;
    if (args.position === FilePosition.NewWindowVerticalSplit) {
      await vscode.commands.executeCommand('workbench.action.splitEditorRight');
      split = true;
    }
    if (args.position === FilePosition.NewWindowHorizontalSplit) {
      await vscode.commands.executeCommand('workbench.action.splitEditorDown');
      split = true;
    }

    const hidePreviousEditor = async () => {
      if (split === true) {
        await vscode.commands.executeCommand('workbench.action.previousEditor');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    };

    // No file was specified
    if (args.file === undefined) {
      if (args.createFileIfNotExists === true) {
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await hidePreviousEditor();
      }
      return;
    }

    // Only untidify when the currently open page and file completion is local
    if (args.file && editorFileUri.scheme === 'file') {
      args.file = untildify(args.file);
    }

    let fileUri = editorFileUri;
    // Using the empty string will request to open a file
    if (args.file === '') {
      // No file on split is fine and just return
      if (split === true) {
        return;
      }

      const fileList = await vscode.window.showOpenDialog({});
      if (fileList && fileList.length > 0) {
        fileUri = fileList[0];
      }
    } else {
      // remove file://
      args.file = args.file.replace(/^file:\/\//, '');

      // Using a filename, open or create the file
      const isRemote = !!vscode.env.remoteName;
      const { fullPath, path: p } = getPathDetails(args.file, editorFileUri, isRemote);
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
          if (args.createFileIfNotExists) {
            // Change the scheme to untitled to open an
            // untitled tab
            fileUri = uriPath.with({ scheme: 'untitled' });
          } else {
            Logger.error(`${args.file} does not exist.`);
            return;
          }
        }
      }
    }

    const doc = await vscode.workspace.openTextDocument(fileUri);
    const editor = await vscode.window.showTextDocument(doc);

    const lineNumber =
      args.cmd?.type === 'line_number'
        ? args.cmd.line
        : args.cmd?.type === 'last_line'
          ? vscode.window.activeTextEditor!.document.lineCount - 1
          : undefined;
    if (lineNumber !== undefined && lineNumber >= 0) {
      const pos = new vscode.Position(lineNumber, 0);
      editor.selection = new vscode.Selection(pos, pos);
      const range = new vscode.Range(pos, pos);
      editor.revealRange(range);
    }
    await hidePreviousEditor();
  }
}
