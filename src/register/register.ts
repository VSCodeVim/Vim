import { VimState, RecordedState } from './../mode/modeHandler';
import { YankOperator, BaseOperator, DeleteOperator } from './../actions/operator';
import { CommandYankFullLine, BaseCommand, CommandRegister } from './../actions/commands/actions';
import *  as util from './../util';

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
}

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
    '.': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
    '*': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: true },
    '+': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: true },
    '_': { text: "", registerMode: RegisterMode.CharacterWise, isClipboardRegister: false },
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

  public static isBlackHoleRegister(registerName: string): boolean {
    return (registerName === "_");
  }

  public static isClipboardRegister(registerName: string): boolean {
    const register = Register.registers[registerName];
    return register && register.isClipboardRegister;
  }

  /**
   * ". readonly register: last content change.
   */
  public static lastContentChange: RecordedState;

  public static isValidRegister(register: string): boolean {
    return register in Register.registers ||
      Register.isValidLowercaseRegister(register) ||
      Register.isValidUppercaseRegister(register);
  }

  public static isValidRegisterForMacro(register: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(register);
  }

  private static isValidLowercaseRegister(register: string): boolean {
    return /^[a-z]+$/.test(register);
  }

  private static isValidUppercaseRegister(register: string): boolean {
    return /^[A-Z]+$/.test(register);
  }

  /**
   * Puts content in a register. If none is specified, uses the default
   * register ".
   */
  public static put(content: RegisterContent, vimState: VimState, multicursorIndex?: number): void {
    const register = vimState.recordedState.registerName;

    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (Register.isBlackHoleRegister(register)) {
      return;
    }

    if (vimState.isMultiCursor) {
      if (Register.isValidUppercaseRegister(register)) {
        Register.appendMulticursorRegister(content, register, vimState, multicursorIndex as number);
      } else {
        Register.putMulticursorRegister(content, register, vimState, multicursorIndex as number);
      }
    } else {
      if (Register.isValidUppercaseRegister(register)) {
        Register.appendNormalRegister(content, register, vimState);
      } else {
        Register.putNormalRegister(content, register, vimState);
      }
    }
  }

  /**
   * Puts the content at the specified index of the multicursor Register.
   *
   * `REMARKS:` This procedure assumes that you pass an valid register.
   */
  private static putMulticursorRegister(content: RegisterContent, register: string, vimState: VimState, multicursorIndex: number): void {
    if (multicursorIndex === 0) {
      Register.registers[register.toLowerCase()] = {
        text               : [],
        registerMode       : vimState.effectiveRegisterMode(),
        isClipboardRegister: Register.isClipboardRegister(register),
      };
    }

    let registerContent = Register.registers[register.toLowerCase()];

    if (!Array.isArray(registerContent.text)) {
      registerContent.text = [];
    }

    (registerContent.text as string[]).push(content as string);

    if (multicursorIndex === vimState.allCursors.length - 1) {
      if (registerContent.isClipboardRegister) {
        let clipboardText: string = "";

        for ( const line of (registerContent.text as string[])) {
          clipboardText += line + "\n";
        }
        clipboardText = clipboardText.replace(/\n$/, "");

        util.clipboardCopy(clipboardText);
      }

      Register.ProcessNumberedRegister(registerContent.text, vimState);
    }
  }

  /**
   * Appends the content at the specified index of the multicursor Register.
   *
   * `REMARKS:` This Procedure assume that you pass an valid uppercase register.
   */
  private static appendMulticursorRegister(content: RegisterContent, register: string, vimState: VimState, multicursorIndex: number): void {
    let appendToRegister = Register.registers[register.toLowerCase()];

    // Only append if appendToRegister is multicursor register
    // and line count match, otherwise replace register
    if (multicursorIndex === 0) {
      let createEmptyRegister: boolean = false;

      if (typeof appendToRegister.text === 'string') {
        createEmptyRegister = true;
      } else {
        if ((appendToRegister.text as string[]).length !== vimState.allCursors.length) {
          createEmptyRegister = true;
        }
      }

      if (createEmptyRegister) {
        Register.registers[register.toLowerCase()] = {
          text               : Array<string>(vimState.allCursors.length).fill(''),
          registerMode       : vimState.effectiveRegisterMode(),
          isClipboardRegister: Register.isClipboardRegister(register),
        };

        appendToRegister = Register.registers[register.toLowerCase()];
      }
    }

    let currentRegisterMode = vimState.effectiveRegisterMode();
    if (appendToRegister.registerMode === RegisterMode.CharacterWise && currentRegisterMode === RegisterMode.CharacterWise) {
      appendToRegister.text[multicursorIndex] += content;
    } else {
      appendToRegister.text[multicursorIndex] += '\n' + content;
      appendToRegister.registerMode = currentRegisterMode;
    }
  }

  /**
   * Puts the content in the specified Register.
   *
   * `REMARKS:` This Procedure assume that you pass an valid register.
   */
  private static putNormalRegister(content: RegisterContent, register: string, vimState: VimState): void {
    if (Register.isClipboardRegister(register)) {
      util.clipboardCopy(content.toString());
    }

      Register.registers[register.toLowerCase()] = {
        text: content,
        registerMode: vimState.effectiveRegisterMode(),
        isClipboardRegister: Register.isClipboardRegister(register),
      };

      Register.ProcessNumberedRegister(content, vimState);
  }

  /**
   * Appends the content at the specified index of the multicursor Register.
   *
   * `REMARKS:` This Procedure assume that you pass an valid uppercase register.
   */
  private static appendNormalRegister(content: RegisterContent, register: string, vimState: VimState): void {
    let appendToRegister = Register.registers[register.toLowerCase()];
    let currentRegisterMode = vimState.effectiveRegisterMode();

    // Check if appending to a multicursor register or normal
    if (appendToRegister.text instanceof Array) {
      if (appendToRegister.registerMode === RegisterMode.CharacterWise && currentRegisterMode === RegisterMode.CharacterWise) {
        for (let i = 0; i < appendToRegister.text.length; i++) {
          appendToRegister.text[i] += content;
        }
      } else {
        for (let i = 0; i < appendToRegister.text.length; i++) {
          appendToRegister.text[i] += '\n' + content;
        }
        appendToRegister.registerMode = currentRegisterMode;
      }
    } else if (typeof appendToRegister.text === 'string') {
      if (appendToRegister.registerMode === RegisterMode.CharacterWise && currentRegisterMode === RegisterMode.CharacterWise) {
        appendToRegister.text = appendToRegister.text + content;
      } else {
        appendToRegister.text += '\n' + content;
        appendToRegister.registerMode = currentRegisterMode;
      }
    }
  }

  public static putByKey(content: RegisterContent, register = '"', registerMode = RegisterMode.FigureItOutFromCurrentMode): void {
    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (Register.isClipboardRegister(register)) {
      util.clipboardCopy(content.toString());
    }

    if (Register.isBlackHoleRegister(register)) {
      return;
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
  private static ProcessNumberedRegister(content: RegisterContent, vimState: VimState): void {
    // Find the BaseOperator of the current actions
    const baseOperator = vimState.recordedState.actionsRun.find( (value) => {
      return value instanceof BaseOperator ||
             value instanceof BaseCommand;
    });

    if (baseOperator instanceof YankOperator || baseOperator instanceof CommandYankFullLine) {
      // 'yank' to 0 only if no register was specified
      const registerCommand = vimState.recordedState.actionsRun.find( (value) => {
        return value instanceof CommandRegister;
      });

      if (!registerCommand) {
        Register.registers['0'].text = content;
        Register.registers['0'].registerMode = vimState.effectiveRegisterMode();
      }
    } else if (baseOperator instanceof DeleteOperator && !(vimState.isRecordingMacro || vimState.isReplayingMacro)) {
      // shift 'delete-history' register
      for (let index = 9; index > 1; index--) {
        Register.registers[String(index)].text = Register.registers[String(index - 1)].text;
        Register.registers[String(index)].registerMode = Register.registers[String(index - 1)].registerMode;
      }

      // Paste last delete into register '1'
      Register.registers['1'].text = content;
      Register.registers['1'].registerMode = vimState.effectiveRegisterMode();
    }
  }

  /**
   * Gets content from a register. If none is specified, uses the default
   * register ".
   */
  public static async get(vimState: VimState): Promise<IRegisterContent> {
    const register = vimState.recordedState.registerName;
    return Register.getByKey(register, vimState);
  }

  public static async getByKey(register: string, vimState?: VimState): Promise<IRegisterContent> {
    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    let lowercaseRegister = register.toLowerCase();

    // Clipboard registers are always defined, so if a register doesn't already
    // exist we can be sure it's not a clipboard one
    if (!Register.registers[lowercaseRegister]) {
      Register.registers[lowercaseRegister] = {
        text               : "",
        registerMode       : RegisterMode.CharacterWise,
        isClipboardRegister: false
      };
    }

    /* Read from system clipboard */
    if (Register.isClipboardRegister(register)) {
      let text = util.clipboardPaste();

      // Harmonize newline character
      text = text.replace(/\r\n/g, '\n');

      let registerText: string | string[];
      if (vimState && vimState.isMultiCursor) {
        registerText = text.split('\n');
        if (registerText.length !== vimState.allCursors.length) {
          registerText = text;
        }
      } else {
        registerText = text;
      }

      Register.registers[lowercaseRegister].text = registerText;
      return Register.registers[register];
    } else {
      let text = Register.registers[lowercaseRegister].text;

      let registerText: RegisterContent;
      if (text instanceof RecordedState) {
        registerText = text;
      } else {
        if (vimState && vimState.isMultiCursor && (typeof text === 'object')) {
          if ((text as string[]).length === vimState.allCursors.length) {
            registerText = text;
          } else {
            registerText = (text as string[]).join('\n');
          }
        } else {
          if (typeof text === 'object') {
            registerText = (text as string[]).join('\n');
          } else {
            registerText = text;
          }
        }
      }

      return {
        text               : registerText,
        registerMode       : Register.registers[lowercaseRegister].registerMode,
        isClipboardRegister: Register.registers[lowercaseRegister].isClipboardRegister
      };
    }
  }

  public static has(register: string): boolean {
    return Register.registers[register] !== undefined;
  }

  public static getKeys(): string[] {
    return Object.keys(Register.registers);
  }
}

