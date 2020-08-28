import * as vscode from 'vscode';
import { Clipboard } from './../util/clipboard';
import {
  ActionDeleteChar,
  ActionDeleteCharWithDeleteKey,
  ActionDeleteLastChar,
  CommandRegister,
  CommandYankFullLine,
} from './../actions/commands/actions';
import { DeleteOperator, YankOperator } from './../actions/operator';
import { RecordedState } from './../state/recordedState';
import { VimState } from './../state/vimState';

let extensionContext: vscode.ExtensionContext;

/**
 * There are two different modes of copy/paste in Vim - copy by character
 * and copy by line. Copy by line typically happens in Visual Line mode, but
 * also shows up in some other actions that work over lines (most notably dd,
 * yy).
 */
export enum RegisterMode {
  AscertainFromCurrentMode,
  CharacterWise,
  LineWise,
  BlockWise,
}

export type RegisterContent = string | string[] | RecordedState;

export interface IRegisterContent {
  text: RegisterContent;
  registerMode: RegisterMode;
}

export class Register {
  /**
   * " is the unnamed register.
   * * and + are special registers for accessing the system clipboard.
   * . is the last inserted text.
   * - is the last deleted text less than a line.
   * / is the most recently executed search.
   * : is the most recently executed command.
   * % is the current file path (relative to workspace root).
   * # is the previous file path (relative to workspace root).
   * _ is the black hole register; it's always empty.
   */
  private static readonly specialRegisters = ['"', '*', '+', '.', '-', '/', ':', '%', '#', '_'];

  private static registers: Map<string, IRegisterContent>;

  /**
   * ". readonly register: last content change.
   */
  public static lastContentChange: RecordedState;

  /**
   * Puts content in a register. If none is specified, uses the default register ".
   */
  public static put(content: RegisterContent, vimState: VimState, multicursorIndex?: number): void {
    const register = vimState.recordedState.registerName;

    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (Register.isBlackHoleRegister(register) || Register.isReadOnlyRegister(register)) {
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

    Register.saveToDisk();
  }

  public static isValidRegister(register: string): boolean {
    return (
      Register.isValidLowercaseRegister(register) ||
      Register.isValidUppercaseRegister(register) ||
      /^[0-9]$/.test(register) ||
      this.specialRegisters.includes(register)
    );
  }

  public static isValidRegisterForMacro(register: string): boolean {
    return /^[a-zA-Z0-9:]$/.test(register);
  }

  private static isBlackHoleRegister(registerName: string): boolean {
    return registerName === '_';
  }

  private static isClipboardRegister(registerName: string): boolean {
    return registerName === '*' || registerName === '+';
  }

  private static isReadOnlyRegister(registerName: string): boolean {
    return ['.', '%', ':', '#', '/'].includes(registerName);
  }

  private static isValidLowercaseRegister(register: string): boolean {
    return /^[a-z]$/.test(register);
  }

  private static isValidUppercaseRegister(register: string): boolean {
    return /^[A-Z]$/.test(register);
  }

  /**
   * Puts the content at the specified index of the multicursor Register.
   *
   * `REMARKS:` This procedure assumes that you pass an valid register.
   */
  private static putMulticursorRegister(
    content: RegisterContent,
    register: string,
    vimState: VimState,
    multicursorIndex: number
  ): void {
    if (multicursorIndex === 0) {
      Register.registers.set(register.toLowerCase(), {
        text: [],
        registerMode: vimState.effectiveRegisterMode,
      });
    }

    let registerContent = Register.registers.get(register.toLowerCase())!;

    if (!Array.isArray(registerContent.text)) {
      registerContent.text = [];
    }

    registerContent.text.push(content as string);

    if (multicursorIndex === vimState.cursors.length - 1) {
      if (this.isClipboardRegister(register)) {
        let clipboardText: string = '';

        for (const line of registerContent.text) {
          clipboardText += line + '\n';
        }
        clipboardText = clipboardText.replace(/\n$/, '');

        Clipboard.Copy(clipboardText);
      }

      Register.processNumberedRegister(registerContent.text, vimState);
    }
  }

  /**
   * Appends the content at the specified index of the multicursor Register.
   *
   * `REMARKS:` This Procedure assume that you pass an valid uppercase register.
   */
  private static appendMulticursorRegister(
    content: RegisterContent,
    register: string,
    vimState: VimState,
    multicursorIndex: number
  ): void {
    let appendToRegister = Register.registers.get(register.toLowerCase())!;

    // Only append if appendToRegister is multicursor register
    // and line count match, otherwise replace register
    if (multicursorIndex === 0) {
      let createEmptyRegister: boolean = false;

      if (typeof appendToRegister.text === 'string') {
        createEmptyRegister = true;
      } else {
        if ((appendToRegister.text as string[]).length !== vimState.cursors.length) {
          createEmptyRegister = true;
        }
      }

      if (createEmptyRegister) {
        Register.registers.set(register.toLowerCase(), {
          text: Array<string>(vimState.cursors.length).fill(''),
          registerMode: vimState.effectiveRegisterMode,
        });

        appendToRegister = Register.registers.get(register.toLowerCase())!;
      }
    }

    let currentRegisterMode = vimState.effectiveRegisterMode;
    if (
      appendToRegister.registerMode === RegisterMode.CharacterWise &&
      currentRegisterMode === RegisterMode.CharacterWise
    ) {
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
  private static putNormalRegister(
    content: RegisterContent,
    register: string,
    vimState: VimState
  ): void {
    if (Register.isClipboardRegister(register)) {
      Clipboard.Copy(content.toString());
    }

    Register.registers.set(register.toLowerCase(), {
      text: content,
      registerMode: vimState.effectiveRegisterMode,
    });

    Register.processNumberedRegister(content, vimState);
  }

  /**
   * Appends the content at the specified index of the multicursor Register.
   *
   * `REMARKS:` This Procedure assume that you pass an valid uppercase register.
   */
  private static appendNormalRegister(
    content: RegisterContent,
    register: string,
    vimState: VimState
  ): void {
    register = register.toLowerCase();
    let currentRegisterMode = vimState.effectiveRegisterMode;
    let appendToRegister = Register.registers.get(register);
    if (appendToRegister === undefined) {
      appendToRegister = { registerMode: currentRegisterMode, text: '' };
      Register.registers.set(register, appendToRegister);
    }

    // Check if appending to a multicursor register or normal
    if (appendToRegister.text instanceof Array) {
      if (
        appendToRegister.registerMode === RegisterMode.CharacterWise &&
        currentRegisterMode === RegisterMode.CharacterWise
      ) {
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
      if (
        appendToRegister.registerMode === RegisterMode.CharacterWise &&
        currentRegisterMode === RegisterMode.CharacterWise
      ) {
        appendToRegister.text = appendToRegister.text + content;
      } else {
        appendToRegister.text += '\n' + content;
        appendToRegister.registerMode = currentRegisterMode;
      }
    }
  }

  public static putByKey(
    content: RegisterContent,
    register = '"',
    registerMode = RegisterMode.AscertainFromCurrentMode,
    force = false
  ): void {
    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    if (Register.isClipboardRegister(register)) {
      Clipboard.Copy(content.toString());
    }

    if (Register.isBlackHoleRegister(register)) {
      return;
    }

    if (Register.isReadOnlyRegister(register) && !force) {
      return;
    }

    Register.registers.set(register, {
      text: content,
      registerMode: registerMode || RegisterMode.AscertainFromCurrentMode,
    });

    Register.saveToDisk();
  }

  /**
   * Handles special cases for Yank- and DeleteOperator.
   */
  private static processNumberedRegister(content: RegisterContent, vimState: VimState): void {
    // Find the BaseOperator of the current actions
    const baseOperator = vimState.recordedState.operator || vimState.recordedState.command;

    if (baseOperator instanceof YankOperator || baseOperator instanceof CommandYankFullLine) {
      // 'yank' to 0 only if no register was specified
      const registerCommand = vimState.recordedState.actionsRun.find((value) => {
        return value instanceof CommandRegister;
      });

      if (!registerCommand) {
        Register.registers.set('0', {
          text: content,
          registerMode: vimState.effectiveRegisterMode,
        });
      }
    } else if (
      (baseOperator instanceof DeleteOperator ||
        baseOperator instanceof ActionDeleteChar ||
        baseOperator instanceof ActionDeleteLastChar ||
        baseOperator instanceof ActionDeleteCharWithDeleteKey) &&
      !(vimState.macro !== undefined || vimState.isReplayingMacro)
    ) {
      if (
        !content.toString().match(/\n/g) &&
        vimState.currentRegisterMode !== RegisterMode.LineWise
      ) {
        Register.registers.set('-', {
          text: content,
          registerMode: RegisterMode.CharacterWise,
        });
      } else {
        // shift 'delete-history' register
        for (let index = 9; index > 1; index--) {
          const previous = Register.registers.get(String(index - 1));
          if (previous) {
            Register.registers.set(String(index), { ...previous });
          }
        }

        // Paste last delete into register '1'
        Register.registers.set('1', {
          text: content,
          registerMode: vimState.effectiveRegisterMode,
        });
      }
    }
  }

  /**
   * Gets content from a register. If no register is specified, uses `vimState.recordedState.registerName`.
   */
  public static async get(
    vimState: VimState,
    register?: string
  ): Promise<IRegisterContent | undefined> {
    register ??= vimState.recordedState.registerName;

    if (!Register.isValidRegister(register)) {
      throw new Error(`Invalid register ${register}`);
    }

    register = register.toLowerCase();

    /* Read from system clipboard */
    if (Register.isClipboardRegister(register)) {
      let text = await Clipboard.Paste();

      // Harmonize newline character
      text = text.replace(/\r\n/g, '\n');

      let registerText: string | string[];
      if (vimState && vimState.isMultiCursor) {
        registerText = text.split('\n');
        if (registerText.length !== vimState.cursors.length) {
          registerText = text;
        }
      } else {
        registerText = text;
      }

      const registerContent = {
        text: registerText,
        registerMode: Register.registers.get(register)?.registerMode ?? RegisterMode.CharacterWise,
      };
      Register.registers.set(register, registerContent);
      return registerContent;
    } else {
      return Register.registers.get(register);
    }
  }

  public static has(register: string): boolean {
    return Register.registers.has(register);
  }

  public static getKeys(): string[] {
    return [...Register.registers.keys()];
  }

  private static async saveToDisk(): Promise<void> {
    const serializable = new Map<string, IRegisterContent>();
    for (const [key, content] of Register.registers) {
      if (typeof content.text === 'string' || Array.isArray(content.text)) {
        serializable.set(key, content);
      }
    }
    extensionContext.globalState.update('registers', [...serializable]);
  }

  public static loadFromDisk(context: vscode.ExtensionContext): void {
    extensionContext = context;
    const savedRegisters = extensionContext.globalState.get<Array<[string, IRegisterContent]>>(
      'registers'
    );
    Register.registers = savedRegisters ? new Map(savedRegisters) : new Map();
  }
}
