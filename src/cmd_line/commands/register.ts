"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import {ModeHandler} from "../../mode/modeHandler";
import { Register} from '../../register/register';

export interface IRegisterCommandArguments extends node.ICommandArgs {
  arg?: string;
}

export class RegisterCommand extends node.CommandBase {
  protected _arguments : IRegisterCommandArguments;

  constructor(args : IRegisterCommandArguments) {
    super();
    this._name = 'register';
    this._shortName = 'reg';
    this._arguments = args;
  }

  get arguments() : IRegisterCommandArguments{
    return this._arguments;
  }

  async displayRegisterValue(register: string): Promise<void> {
    let result = (await Register.getByKey(register)).text;
    if (result instanceof Array) {
      result = result.join("\n").substr(0, 100);
    }
    vscode.window.showInformationMessage(`${register} ${result}`);
  }

  async execute(modeHandler: ModeHandler): Promise<void> {
    if (this.arguments.arg !== undefined && this.arguments.arg.length > 0) {
      await this.displayRegisterValue(this.arguments.arg);
    } else {
      vscode.window.showQuickPick(Register.getKeys()).then(async (val) => {
        await this.displayRegisterValue(val);
      });
    }
  }
}