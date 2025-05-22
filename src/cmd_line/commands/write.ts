// eslint-disable-next-line id-denylist
import { all, alt, optWhitespace, Parser, seq, string } from 'parsimmon';
import * as path from 'path';
import * as fs from 'platform/fs';
import * as vscode from 'vscode';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { Logger } from '../../util/logger';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser, fileNameParser, FileOpt, fileOptParser } from '../../vimscript/parserUtils';

export type IWriteCommandArguments = {
  bang: boolean;
  opt: FileOpt;
  bgWrite: boolean;
  file?: string;
} & ({ cmd: string } | object);

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand extends ExCommand {
  public static readonly argParser: Parser<WriteCommand> = seq(
    bangParser.skip(optWhitespace),
    fileOptParser.skip(optWhitespace),
    alt<{ cmd: string } | { file: string }>(
      string('!')
        .then(all)
        .map((cmd) => {
          return { cmd };
        }),
      fileNameParser.map((file) => {
        return { file };
      }),
      // TODO: Support `:help :w_a` ('>>')
    ).fallback({}),
  ).map(([bang, opt, other]) => new WriteCommand({ bang, opt, bgWrite: true, ...other }));

  public override isRepeatableWithDot = false;

  public readonly arguments: IWriteCommandArguments;

  constructor(args: IWriteCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: Use arguments: opt, file, cmd

    // If the file isn't on disk because it's brand new or on a remote file system, let VS Code handle it
    if (vimState.document.isUntitled || vimState.document.uri.scheme !== 'file') {
      await this.background(vscode.commands.executeCommand('workbench.action.files.save'));
      return;
    }

    try {
      if (this.arguments.file) {
        await this.saveAs(vimState, this.arguments.file);
      } else {
        await fs.accessAsync(vimState.document.fileName, fs.constants.W_OK);
        await this.save(vimState);
      }
    } catch (accessErr) {
      if (this.arguments.bang) {
        try {
          const mode = await fs.getMode(vimState.document.fileName);
          await fs.chmodAsync(vimState.document.fileName, 0o666);
          // We must do a foreground write so we can await the save
          // and chmod the file back to its original state
          this.arguments.bgWrite = false;
          await this.save(vimState);
          await fs.chmodAsync(vimState.document.fileName, mode);
        } catch (e) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          StatusBar.setText(vimState, e.message);
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        StatusBar.setText(vimState, accessErr.message);
      }
    }
  }

  // TODO: Aparentemente foi tudo, claro que falta alguns ERRORS e bla bla bla tipo o do :w 8/ E212 mas fds o E357 sobrepoe
  // TODO: fazer PR (#1876)
  private async saveAs(vimState: VimState, fileName: string): Promise<void> {
    try {
      const filePath = path.resolve(path.dirname(vimState.document.fileName), fileName);
      const fileExists = await fs.existsAsync(filePath);
      const uri = vscode.Uri.file(path.resolve(path.dirname(vimState.document.fileName), filePath));
      // An extension to the file must be specified.
      if (path.extname(filePath) === '') {
        StatusBar.setText(vimState, `E357: The file extension must be specified`, true);
        return;
      }
      // Checks if the file exists.
      if (fileExists) {
        const stats = await vscode.workspace.fs.stat(uri);
        const isDirectory = stats.type === vscode.FileType.Directory;
        // If it's a directory, throw an error.
        if (isDirectory) {
          StatusBar.setText(vimState, `E17: "${filePath}" is a directory`, true);
          return;
        }
        // Create a pop-up asking if user wants to overwrite the file.
        const confirmOverwrite = await vscode.window.showWarningMessage(
          `File "${fileName}" already exists. Do you want to overwrite it?`,
          { modal: true },
          'Yes',
          'No',
        );

        if (confirmOverwrite === 'No') {
          return;
        }
      }

      // Create a new file in 'filePath', appending the current's file content to it.
      await vscode.window.showTextDocument(vimState.document, { preview: false });
      await vscode.commands.executeCommand('workbench.action.files.save', uri);
      await vscode.workspace.fs.copy(vimState.document.uri, uri, { overwrite: true });

      StatusBar.setText(
        vimState,
        `"${fileName}" ${fileExists ? '' : '[New]'} ${vimState.document.lineCount}L ${
          vimState.document.getText().length
        }C written`,
      );
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      StatusBar.setText(vimState, e.message);
    }
  }

  private async save(vimState: VimState): Promise<void> {
    await this.background(
      vimState.document.save().then((success) => {
        if (success) {
          StatusBar.setText(
            vimState,
            `"${path.basename(vimState.document.fileName)}" ${vimState.document.lineCount}L ${
              vimState.document.getText().length
            }C written`,
          );
        } else {
          Logger.warn(':w failed');
          // TODO: What's the right thing to do here?
        }
      }),
    );
  }

  private async background<T>(fn: Thenable<T>): Promise<void> {
    if (!this.arguments.bgWrite) {
      await fn;
    }
  }
}
