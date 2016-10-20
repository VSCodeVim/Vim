import { VimState, RecordedState } from './../mode/modeHandler';
import * as clipboard from 'copy-paste';
import { YankOperator, BaseOperator, CommandRegister, DeleteOperator } from './../actions/actions';

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

export type RegisterContent = string | string[] | RecordedState;

export interface IRegisterContent {
  text               : RegisterContent;
  registerMode       : RegisterMode;
  isClipboardRegister: boolean;
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
    '"': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '*': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: true },
    '+': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: true },
    '0': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '1': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '2': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '3': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '4': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '5': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '6': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '7': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '8': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '9': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false }
  };


  public static isClipboardRegister(registerName: string): boolean {
    const register = Register.registers[registerName];
    return register && register.isClipboardRegister;
  }

  /**
   * ". readonly register: last content change.
   */
  public static lastContentChange: RecordedState;

  public static isValidRegister(register: string): boolean {
    return register in Register.registers || /^[a-z0-9]+$/i.test(register) || /\./.test(register);
  }

  public static isValidRegisterForMacro(register: string): boolean {
    return /^[a-zA-Z0-9]+$/i.test(register);
  }

  /**
   * Puts content in a register. If none is specified, uses the default
   * register ".
   */
  public static put(content: RegisterContent, vimState: VimState): void {
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

    Register.ProcessNumberedRegister(content, vimState);
  }

  public static putByKey(content: RegisterContent, register = '"', registerMode = RegisterMode.FigureItOutFromCurrentMode): void {
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
   * Handles special cases for Yank- and DeleteOperator.
   */
  private static ProcessNumberedRegister(content: string | string[], vimState: VimState): void {
    // Find the BaseOperator of the current actions
    const baseOperator = vimState.recordedState.actionsRun.find( (value) => {
      return value instanceof BaseOperator;
    });

    if (baseOperator instanceof YankOperator) {
      // 'yank' to 0 only if no register was specified
      const registerCommand = vimState.recordedState.actionsRun.find( (value) => {
        return value instanceof CommandRegister;
      });

      if (!registerCommand) {
        Register.registers["0"] = {
          text               : content,
          registerMode       : vimState.effectiveRegisterMode(),
          isClipboardRegister: Register.isClipboardRegister("0"),
        };
      }
    } else if (baseOperator instanceof DeleteOperator) {
      // shift 'delete-history' register
      for (let index = 9; index > 1; index--) {
        Register.registers[String(index)] = Register.registers[String(index - 1)];
      }

      // Paste last delete into register '1'
      Register.registers["1"] = {
        text               : content,
        registerMode       : vimState.effectiveRegisterMode(),
        isClipboardRegister: Register.isClipboardRegister("1"),
      };
    }
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

    // Clipboard registers are always defined, so if a register doesn't already
    // exist we can be sure it's not a clipboard one
    if (!Register.registers[register]) {
      Register.registers[register] = {
        text               : "",
        registerMode       : RegisterMode.CharacterWise,
        isClipboardRegister: false
      };
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

  public static has(register: string): boolean {
    return Register.registers[register] !== undefined;
  }

  public static getKeys(): string[] {
    return Object.keys(Register.registers);
  }
}
