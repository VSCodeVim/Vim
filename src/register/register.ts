import { VimState } from './../mode/modeHandler';

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
};

export interface IRegisterContent {
  text    : string;
  registerMode: RegisterMode;
}

export class Register {
  private static validRegisters = [
    '"'
  ];

  private static registers: { [key: string]: IRegisterContent } = {
    '"': { text: "", registerMode: RegisterMode.CharacterWise }
  };

  /**
   * Puts content in a register. If none is specified, uses the default
   * register ".
   */
  public static put(content: string, registerMode: RegisterMode): void {
    const register = '"'; // (TODO)

    if (Register.validRegisters.indexOf(register) === -1) {
      throw new Error(`Invalid register ${register}`);
    }

    Register.registers[register] = {
      text        : content,
      registerMode: registerMode,
    };
  }

  /**
   * Gets content from a register. If none is specified, uses the default
   * register ".
   */
  public static get(vimState: VimState): IRegisterContent {
    const register = vimState.registerName;

    if (Register.validRegisters.indexOf(register) === -1) {
      throw new Error(`Invalid register ${register}`);
    }

    return Register.registers[register];
  }
}
