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
};

export interface IRegisterContent {
  text    : string;
  registerMode: RegisterMode;
}

export class Register {
  /**
   * The '*' is the special register for stroing into system clipboard.
   */
  private static validRegisters = [
    '"',
    '*'
  ];

  private static registers: { [key: string]: IRegisterContent } = {
    '"': { text: "", registerMode: RegisterMode.CharacterWise }
  };

  /**
   * Puts content in a register. If none is specified, uses the default
   * register ".
   */
  public static put(content: string, vimState: VimState): void {
    const register = vimState.recordedState.registerName;

    if (Register.validRegisters.indexOf(register) === -1) {
      throw new Error(`Invalid register ${register}`);
    }

    if (register === '*') {
      clipboard.copy(content);
    }

    Register.registers[register] = {
      text    : content,
      registerMode: vimState.effectiveRegisterMode(),
    };
  }

  /**
   * Gets content from a register. If none is specified, uses the default
   * register ".
   */
  public static async get(vimState: VimState): Promise<IRegisterContent> {
    const register = vimState.recordedState.registerName;

    if (Register.validRegisters.indexOf(register) === -1) {
      throw new Error(`Invalid register ${register}`);
    }

    /* Read from system clipboard */
    if (register === '*') {
      const text = await new Promise<string>((resolve, reject) =>
        clipboard.paste((err, text) => {
          if (err) { reject(err); }
          else { resolve(text); }
        })
      );
      Register.registers[register].text = text;
    }

    return Register.registers[register];
  }
}
