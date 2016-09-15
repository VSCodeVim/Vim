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
  text        : string | string[];
  registerMode: RegisterMode;
}

export class Register {
  /**
   * The '"' is the unnamed register.
   * The '*' is the special register for stroing into system clipboard.
   * TODO: Read-Only registers
   *  '.' register has the last inserted text.
   *  '%' register has the current file path.
   *  ':' is the most recently executed command.
   *  '#' is the name of last edited file. (low priority)
   */
  private static registers: { [key: string]: IRegisterContent } = {
    '"': { text: "", registerMode: RegisterMode.CharacterWise },
    '*': { text: "", registerMode: RegisterMode.CharacterWise }
  };

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

    if (register === '*') {
      clipboard.copy(content);
    }

    Register.registers[register] = {
      text        : content,
      registerMode: vimState.effectiveRegisterMode(),
    };
  }

  public static add(content: string, vimState: VimState): void {
    const register = vimState.recordedState.registerName;

    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (typeof Register.registers[register].text !== "string") {
      // TODO - I don't know why this cast is necessary!

      (Register.registers[register].text as string[]).push(content);
    }
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
    if (register === '*') {
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
