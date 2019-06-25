import * as fs from 'fs';
import * as node from '../node';
import * as path from 'path';
import * as util from 'util';
import * as vscode from 'vscode';
import { Logger } from '../../util/logger';
import { StatusBar } from '../../statusBar';
import { VimState } from '../../state/vimState';

export interface IWriteCommandArguments extends node.ICommandArgs {
  opt?: string;
  optValue?: string;
  bang?: boolean;
  range?: node.LineRange;
  file?: string;
  append?: boolean;
  cmd?: string;
}

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand extends node.CommandBase {
  protected _arguments: IWriteCommandArguments;
  private readonly _logger = Logger.get('Write');

  constructor(args: IWriteCommandArguments) {
    super();
    this._name = 'write';
    this._arguments = args;
  }

  get arguments(): IWriteCommandArguments {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.arguments.opt) {
      this._logger.warn('not implemented');
      return;
    } else if (this.arguments.file) {
      this._logger.warn('not implemented');
      return;
    } else if (this.arguments.append) {
      this._logger.warn('not implemented');
      return;
    } else if (this.arguments.cmd) {
      this._logger.warn('not implemented');
      return;
    }

    // defer saving the file to vscode if file is new (to present file explorer) or if file is a remote file
    if (vimState.editor.document.isUntitled || vimState.editor.document.uri.scheme !== 'file') {
      vscode.commands.executeCommand('workbench.action.files.save');
      return;
    }

    try {
      await util.promisify(fs.access)(vimState.editor.document.fileName, fs.constants.W_OK);
      return this.save(vimState);
    } catch (accessErr) {
      if (this.arguments.bang) {
        fs.chmod(vimState.editor.document.fileName, 666, e => {
          if (!e) {
            return this.save(vimState);
          }
          StatusBar.Set(e.message, vimState.currentMode, vimState.isRecordingMacro, true);
          return;
        });
      } else {
        StatusBar.Set(accessErr.message, vimState.currentMode, vimState.isRecordingMacro, true);
      }
    }
  }

  private async save(vimState: VimState): Promise<void> {
    await vimState.editor.document.save().then(
      () => {
        let text =
          '"' +
          path.basename(vimState.editor.document.fileName) +
          '" ' +
          vimState.editor.document.lineCount +
          'L ' +
          vimState.editor.document.getText().length +
          'C written';
        StatusBar.Set(text, vimState.currentMode, vimState.isRecordingMacro, true);
      },
      e => StatusBar.Set(e, vimState.currentMode, vimState.isRecordingMacro, true)
    );
  }
}
