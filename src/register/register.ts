import { VimState } from './../mode/modeHandler';
import * as clipboard from 'copy-paste';

/**
 * There are two different modes of copy/paste in Vim - copy by character
 * and copy by line. Copy by line typically happens in Visual Line mode, but
 * also shows up in some other actions that work over lines (most noteably dd,
 * yy).
 */
export enum RegisterMode {
  FigureItOutFromCurrentMode,
  CharacterWise,
  LineWise,
  BlockWise,
};

export interface IRegisterContent {
  text                : string | string[];
  registerMode        : RegisterMode;
  isClipboardRegister?: boolean;
}

export class Register {
  /**
   * The '"' is the unnamed register.
   * The '*' and '+' are special registers for accessing the system clipboard.
   * TODO: Read-Only registers
   *  '.' register has the last inserted text.
   *  '%' register has the current file path.
   *  ':' is the most recently executed command.
   *  '#' is the name of last edited file. (low priority)
   */
  private static registers: { [key: string]: IRegisterContent } = {
    '"': { text: "", registerMode: RegisterMode.CharacterWise },
    '*': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: true },
    '+': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: true }
  };

  public static isClipboardRegister(registerName: string): boolean {
    const register = Register.registers[registerName];

    if (register && register.isClipboardRegister) {
      return true;
    }

    return false;
  }

  public static isValidRegister(register: string): boolean {
    return register in Register.registers || /^[a-z0-9]+$/i.test(register);
  }

  /**
   * Puts content in a register. If none is specified, uses the default
   * register ".
   */
  public static put(content: string | string[], vimState: VimState): void {
    const register = vimState.recordedState.registerName;

    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (Register.isClipboardRegister(register)) {
      clipboard.copy(content);
    }

    Register.registers[register] = {
      text               : content,
      registerMode       : vimState.effectiveRegisterMode(),
      isClipboardRegister: Register.isClipboardRegister(register),
    };
  }

  public static putByKey(content: string | string[], register?: string, registerMode?: RegisterMode): void {
    register = register || '"';

    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (Register.isClipboardRegister(register)) {
      clipboard.copy(content);
    }

    Register.registers[register] = {
      text               : content,
      registerMode       : registerMode || RegisterMode.FigureItOutFromCurrentMode,
      isClipboardRegister: Register.isClipboardRegister(register),
    };
  }

  /**
   * Gets content from a register. If none is specified, uses the default
   * register ".
   */
  public static async get(vimState: VimState): Promise<IRegisterContent> {
    const register = vimState.recordedState.registerName;
    return Register.getByKey(register);
  }

  public static async getByKey(register: string): Promise<IRegisterContent> {
    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (!Register.registers[register]) {
      Register.registers[register] = { text: "", registerMode: RegisterMode.CharacterWise };
    }

    /* Read from system clipboard */
    if (Register.isClipboardRegister(register)) {
      const text = await new Promise<string>((resolve, reject) =>
        clipboard.paste((err, text) => {
          if (err) {
            reject(err);
          } else {
            resolve(text);
          }
        })
      );
      Register.registers[register].text = text;
    }

    return Register.registers[register];
  }

  public static getKeys(): string[] {
    return Object.keys(Register.registers);
  }
}
