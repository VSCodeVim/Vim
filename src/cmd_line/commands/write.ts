import * as fs from 'platform/fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../../util/logger';
import { StatusBar } from '../../statusBar';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { all, alt, optWhitespace, Parser, regexp, seq, string } from 'parsimmon';
import { bangParser, fileNameParser, FileOpt, fileOptParser } from '../../vimscript/parserUtils';

export type IWriteCommandArguments =
  | {
      bang: boolean;
      opt: FileOpt;
      bgWrite: boolean;
    } & ({ cmd: string } | { file: string } | {});

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
      })
      // TODO: Support `:help :w_a` ('>>')
    ).fallback({})
  ).map(([bang, opt, other]) => new WriteCommand({ bang, opt, bgWrite: true, ...other }));

  public override isRepeatableWithDot = false;

  public readonly arguments: IWriteCommandArguments;
  private readonly logger = Logger.get('Write');

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
      await fs.accessAsync(vimState.document.fileName, fs.constants.W_OK);
      await this.save(vimState);
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
          StatusBar.setText(vimState, e.message);
        }
      } else {
        StatusBar.setText(vimState, accessErr.message);
      }
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
            }C written`
          );
        } else {
          this.logger.warn(':w failed');
          // TODO: What's the right thing to do here?
        }
      })
    );
  }

  private async background<T>(fn: Thenable<T>): Promise<void> {
    if (!this.arguments.bgWrite) {
      await fn;
    }
  }
}
