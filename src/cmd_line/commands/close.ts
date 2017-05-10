"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as error from '../../error';

export interface ICloseCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  range?: node.LineRange;
  quitAll?: boolean;
}

//
//  Implements :close
//  http://vimdoc.sourceforge.net/htmldoc/windows.html#:close
//
export class CloseCommand extends node.CommandBase {
  protected _arguments : ICloseCommandArguments;

  constructor(args : ICloseCommandArguments) {
    super();
    this._name = 'close';
    this._arguments = args;
  }

  get arguments() : ICloseCommandArguments {
    return this._arguments;
  }

  async execute() : Promise<void> {
    if (this.activeTextEditor!.document.isDirty && !this.arguments.bang) {
      throw error.VimError.fromCode(error.ErrorCode.E37);
    }

    if (vscode.window.visibleTextEditors.length === 1) {
      throw error.VimError.fromCode(error.ErrorCode.E444);
    }

    let oldViewColumn = this.activeTextEditor!.viewColumn;
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    if (vscode.window.activeTextEditor !== undefined && vscode.window.activeTextEditor.viewColumn === oldViewColumn) {
      await vscode.commands.executeCommand('workbench.action.previousEditor');
    }
  }}
