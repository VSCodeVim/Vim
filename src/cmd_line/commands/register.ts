import * as vscode from 'vscode';

// eslint-disable-next-line id-denylist
import { Parser, any, optWhitespace } from 'parsimmon';
import { ErrorCode, VimError } from '../../error';
import { Register } from '../../register/register';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';

export class RegisterCommand extends ExCommand {
  public override isRepeatableWithDot: boolean = false;

  public static readonly argParser: Parser<RegisterCommand> = optWhitespace.then(
    // eslint-disable-next-line id-denylist
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
      void vscode.window.showInformationMessage(`${register} ${result}`);
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
        const displayValue = await this.getRegisterDisplayValue(registerKey);
        if (typeof displayValue === 'string') {
          registerKeyAndContent.push({
            label: registerKey,
            description: displayValue,
          });
        }
      }

      void vscode.window.showQuickPick(registerKeyAndContent).then(async (val) => {
        if (val) {
          const result = val.description;
          void vscode.window.showInformationMessage(`${val.label} ${result}`);
        }
      });
    }
  }
}
