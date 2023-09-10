import * as vscode from 'vscode';

import { VimState } from '../../state/vimState';
import { Register } from '../../register/register';
import { RecordedState } from '../../state/recordedState';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { ExCommand } from '../../vimscript/exCommand';
import { any, optWhitespace, Parser } from 'parsimmon';

export class RegisterCommand extends ExCommand {
  public static readonly argParser: Parser<RegisterCommand> = optWhitespace.then(
    any.sepBy(optWhitespace).map((registers) => new RegisterCommand(registers)),
  );

  private readonly registers: string[];
  constructor(registers: string[]) {
    super();
    this.registers = registers;
  }

  private async getRegisterDisplayValue(register: string): Promise<string | undefined> {
    let result = (await Register.get(register))?.text;
    if (result instanceof Array) {
      result = result.join('\n').substr(0, 100);
    } else if (result instanceof RecordedState) {
      result = result.actionsRun.map((x) => x.keysPressed.join('')).join('');
    }

    return result;
  }

  async displayRegisterValue(vimState: VimState, register: string): Promise<void> {
    let result = await this.getRegisterDisplayValue(register);
    if (result === undefined) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.NothingInRegister, register));
    } else {
      result = result.replace(/\n/g, '\\n');
      vscode.window.showInformationMessage(`${register} ${result}`);
    }
  }

  private regSortOrder(register: string): number {
    const specials = ['-', '*', '+', '.', ':', '%', '#', '/', '='];
    if (register === '"') {
      return 0;
    } else if (register >= '0' && register <= '9') {
      return 10 + parseInt(register, 10);
    } else if (register >= 'a' && register <= 'z') {
      return 100 + (register.charCodeAt(0) - 'a'.charCodeAt(0));
    } else if (specials.includes(register)) {
      return 1000 + specials.indexOf(register);
    } else {
      throw new Error(`Unexpected register ${register}`);
    }
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.registers.length === 1) {
      await this.displayRegisterValue(vimState, this.registers[0]);
    } else {
      const currentRegisterKeys = Register.getKeys()
        .filter(
          (reg) => reg !== '_' && (this.registers.length === 0 || this.registers.includes(reg)),
        )
        .sort((reg1: string, reg2: string) => this.regSortOrder(reg1) - this.regSortOrder(reg2));
      const registerKeyAndContent = new Array<vscode.QuickPickItem>();

      for (const registerKey of currentRegisterKeys) {
        registerKeyAndContent.push({
          label: registerKey,
          description: await this.getRegisterDisplayValue(registerKey),
        });
      }

      vscode.window.showQuickPick(registerKeyAndContent).then(async (val) => {
        if (val) {
          const result = val.description;
          vscode.window.showInformationMessage(`${val.label} ${result}`);
        }
      });
    }
  }
}
