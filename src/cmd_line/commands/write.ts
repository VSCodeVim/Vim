"use strict";

// XXX: use graceful-fs ??
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import * as node from '../node';
import * as util from '../../util';
import {ModeHandler} from "../../mode/modeHandler";

export interface IWriteCommandArguments extends node.ICommandArgs {
  opt? : string;
  optValue? : string;
  bang? : boolean;
  range? : node.LineRange;
  file? : string;
  append? : boolean;
  cmd? : string;
}

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand extends node.CommandBase {
  protected _arguments : IWriteCommandArguments;

  constructor(args : IWriteCommandArguments) {
    super();
    this._name = 'write';
    this._arguments = args;
  }

  get arguments() : IWriteCommandArguments {
    return this._arguments;
  }

  async execute(modeHandler : ModeHandler) : Promise<void> {
    if (this.arguments.opt) {
      util.showError("Not implemented.");
      return;
    } else if (this.arguments.file) {
      util.showError("Not implemented.");
      return;
    } else if (this.arguments.append) {
      util.showError("Not implemented.");
      return;
    } else if (this.arguments.cmd) {
      util.showError("Not implemented.");
      return;
    }

    if (this.activeTextEditor.document.isUntitled) {
      await vscode.commands.executeCommand("workbench.action.files.save");
      return;
    }

    try {
      fs.accessSync(this.activeTextEditor.document.fileName, fs.constants.W_OK);
      return this.save(modeHandler);
    } catch (accessErr) {
      if (this.arguments.bang) {
        fs.chmod(this.activeTextEditor.document.fileName, 666, (e) => {
          if (e) {
            modeHandler.setStatusBarText(e.message);
          } else {
            return this.save(modeHandler);
          }
        });
      } else {
        modeHandler.setStatusBarText(accessErr.message);
      }
    }
  }

  private async save(modeHandler : ModeHandler) : Promise<void> {
    await this.activeTextEditor.document.save().then(
      (ok) => {
        modeHandler.setStatusBarText('"' + path.basename(this.activeTextEditor.document.fileName) +
        '" ' + this.activeTextEditor.document.lineCount + 'L ' +
        this.activeTextEditor.document.getText().length + 'C written');
      },
      (e) => modeHandler.setStatusBarText(e)
    );
  }
}
