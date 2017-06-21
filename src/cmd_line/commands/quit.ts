"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as error from '../../error';

export interface IQuitCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  range?: node.LineRange;
  quitAll?: boolean;
}

//
//  Implements :quit
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
export class QuitCommand extends node.CommandBase {
  protected _arguments : IQuitCommandArguments;

  constructor(args : IQuitCommandArguments) {
    super();
    this._name = 'quit';
    this._arguments = args;
  }

  get arguments() : IQuitCommandArguments {
    return this._arguments;
  }

  async execute() : Promise<void> {
    if (this.activeTextEditor!.document.isDirty && !this.arguments.bang) {
      throw error.VimError.fromCode(error.ErrorCode.E37);
    }

    if (this._arguments.quitAll) {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } else {
      let oldViewColumn = this.activeTextEditor!.viewColumn;
      if (!this.arguments.bang) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      } else {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
      }

      if (vscode.window.activeTextEditor !== undefined && vscode.window.activeTextEditor.viewColumn === oldViewColumn) {
        await vscode.commands.executeCommand('workbench.action.previousEditor');
      }
    }
  }}
