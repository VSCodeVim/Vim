import * as vscode from 'vscode';

import { VimState } from '../../state/vimState';
import { Register } from '../../register/register';
import { RecordedState } from '../../state/recordedState';
import * as node from '../node';

export interface IRegisterCommandArguments extends node.ICommandArgs {
  registers: string[];
}
export class RegisterCommand extends node.CommandBase {
  protected _arguments: IRegisterCommandArguments;

  constructor(args: IRegisterCommandArguments) {
    super();
    this._name = 'register';
    this._arguments = args;
  }

  get arguments(): IRegisterCommandArguments {
    return this._arguments;
  }

  private async getRegisterDisplayValue(register: string) {
    let result = (await Register.getByKey(register)).text;
    if (result instanceof Array) {
      result = result.join('\n').substr(0, 100);
    } else if (result instanceof RecordedState) {
      result = result.actionsRun.map(x => x.keysPressed.join('')).join('');
    }

    return result;
  }

  async displayRegisterValue(register: string): Promise<void> {
    let result = await this.getRegisterDisplayValue(register);
    result = result.replace(/\n/g, '\\n');
    vscode.window.showInformationMessage(`${register} ${result}`);
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.arguments.registers.length === 1) {
      await this.displayRegisterValue(this.arguments.registers[0]);
    } else {
      const currentRegisterKeys = Register.getKeys().filter(
        reg =>
          reg !== '_' &&
          (this.arguments.registers.length === 0 || this.arguments.registers.includes(reg))
      );
      const registerKeyAndContent = new Array<vscode.QuickPickItem>();

      for (let registerKey of currentRegisterKeys) {
        registerKeyAndContent.push({
          label: registerKey,
          description: await this.getRegisterDisplayValue(registerKey),
        });
      }

      vscode.window.showQuickPick(registerKeyAndContent).then(async val => {
        if (val) {
          let result = val.description;
          vscode.window.showInformationMessage(`${val.label} ${result}`);
        }
      });
    }
  }
}
