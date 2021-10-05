import * as fs from 'platform/fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../../util/logger';
import { StatusBar } from '../../statusBar';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';

export interface IWriteCommandArguments {
  opt?: string;
  optValue?: string;
  bang?: boolean;
  range?: LineRange;
  file?: string;
  append?: boolean;
  cmd?: string;
  bgWrite?: boolean;
}

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand extends ExCommand {
  public readonly arguments: IWriteCommandArguments;
  private readonly logger = Logger.get('Write');

  constructor(args: IWriteCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.arguments.opt) {
      this.logger.warn('not implemented');
      return;
    } else if (this.arguments.file) {
      this.logger.warn('not implemented');
      return;
    } else if (this.arguments.append) {
      this.logger.warn('not implemented');
      return;
    } else if (this.arguments.cmd) {
      this.logger.warn('not implemented');
      return;
    }

    // defer saving the file to vscode if file is new (to present file explorer) or if file is a remote file
    if (vimState.document.isUntitled || vimState.document.uri.scheme !== 'file') {
      await this.background(vscode.commands.executeCommand('workbench.action.files.save'));
      return;
    }

    try {
      await fs.accessAsync(vimState.document.fileName, fs.constants.W_OK);
      return this.save(vimState);
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
      vimState.document.save().then(
        () => {
          const text =
            '"' +
            path.basename(vimState.document.fileName) +
            '" ' +
            vimState.document.lineCount +
            'L ' +
            vimState.document.getText().length +
            'C written';
          StatusBar.setText(vimState, text);
        },
        (e) => StatusBar.setText(vimState, e)
      )
    );
  }

  private async background(fn: Thenable<void>): Promise<void> {
    if (!this.arguments.bgWrite) {
      await fn;
    }
  }
}
