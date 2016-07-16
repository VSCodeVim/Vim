"use strict";

import * as vscode from "vscode";
import * as node from "../node";

export enum Tab {
  Next,
  Previous,
  First,
  Last,
  New,
  Close,
  Only
}

export interface ITabCommandArguments extends node.ICommandArgs {
  tab: Tab;
  count: number;
}

//
//  Implements tab
//  http://vimdoc.sourceforge.net/htmldoc/tabpage.html
//
export class TabCommand extends node.CommandBase {
  protected _arguments : ITabCommandArguments;

  constructor(args : ITabCommandArguments) {
    super();
    this._name = 'tab';
    this._shortName = 'tab';
    this._arguments = args;
  }

  get arguments() : ITabCommandArguments {
    return this._arguments;
  }

  private executeCommandWithCount(count: number, command: string) {
    for (let i = 0; i < count; i++) {
      vscode.commands.executeCommand(command);
    }
  }

  execute() : void {
    switch (this._arguments.tab) {
      case Tab.Next:
        this.executeCommandWithCount(this._arguments.count, "workbench.action.nextEditor");
        break;
      case Tab.Previous:
        this.executeCommandWithCount(this._arguments.count, "workbench.action.previousEditor");
        break;
      case Tab.First:
        this.executeCommandWithCount(this._arguments.count, "workbench.action.openEditorAtIndex1");
        break;
      case Tab.Last:
        this.executeCommandWithCount(this._arguments.count, "workbench.action.openLastEditorInGroup");
        break;
      case Tab.New:
        this.executeCommandWithCount(this._arguments.count, "workbench.action.files.newUntitledFile");
        break;
      case Tab.Close:
        this.executeCommandWithCount(this._arguments.count, "workbench.action.closeActiveEditor");
        break;
      case Tab.Only:
        this.executeCommandWithCount(this._arguments.count, "workbench.action.closeOtherEditors");
        break;

      default:
        break;
    }
  }
}
